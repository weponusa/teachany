#!/usr/bin/env python3
"""Round 2 fill: retry subjects that have PDFs but got 0 before with better prompts."""
import json, glob, os, requests, re, time

try:
    import pdfplumber
except ImportError:
    os.system("pip3 install pdfplumber -q")
    import pdfplumber

API_KEY = "sk-Ye5gTEaDbjlXaM2BlZGcjg"
API_URL = "https://llmapi.paratera.com/v1/chat/completions"

def extract_text(pdf_path, max_pages=40):
    if not os.path.exists(pdf_path):
        return ""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages[:max_pages]:
                t = page.extract_text() or ""
                if t.strip():
                    text += t + "\n"
    except Exception as e:
        print("  [WARN] extract failed: {}".format(e))
    return text

def call_llm(prompt):
    r = requests.post(API_URL,
        headers={"Authorization":"Bearer {}".format(API_KEY),"Content-Type":"application/json"},
        json={"model":"DeepSeek-V3.2","messages":[{"role":"user","content":prompt}],
             "max_tokens":8192,"temperature":0.1}, timeout=300)
    if not r.ok:
        raise RuntimeError("{}: {}".format(r.status_code, r.text[:300]))
    return r.json()["choices"][0]["message"]["content"]

def fill(nodes, text, tag):
    # Build node list with BOTH name_en and name for matching
    nl = "\n".join(
        "{} | EN:{} | CN:{}".format(n["id"], n.get("name_en","") or "(none)", n.get("name","") or "(none)")
        for n in nodes
    )
    
    prompt = (
        "You are a curriculum expert for {}.\n\n"
        "CURRICULUM DOCUMENT is provided below.\n"
        "KNOWLEDGE POINTS are from a course tree - each has an ID, English name, and Chinese name.\n\n"
        "TASK: For EACH knowledge point, find ALL relevant learning objectives or content descriptions.\n\n"
        "CRITICAL RULES:\n"
        "- Match by TOPIC/SUBJECT, not by exact wording.\n"
        "- If the point is 'photosynthesis', find ANY objective about photosynthesis, plants, energy in living things.\n"
        "- If the point is 'fractions', find objectives about fractions, rational numbers, number operations.\n"
        "- If the point is 'forces and motion', look for physics/mechanics sections about forces, Newton's laws, motion.\n"
        "- Each entry must be a substantive description (10+ chars), not just a heading like 'Physics'.\n"
        "- You CAN use different parts of the document to match one point.\n"
        "- Output pure JSON only: {{\"node_id\": [\"description 1\", \"description 2\"]}}\n"
        "- Use [] ONLY if the topic genuinely doesn't exist anywhere in the document.\n"
        "- You MUST output all {} entries.\n\n"
        "KNOWLEDGE POINTS ({} pts):\n{}\n\n"
        "=== CURRICULUM DOCUMENT ===\n{}"
    ).format(tag, len(nodes), len(nodes), nl, text[:20000])
    
    print("\n[{}] ({}pts)".format(tag, len(nodes)), end="", flush=True)
    try:
        raw = call_llm(prompt)
        cleaned = re.sub(r"^```json|^```|```$", "", raw.strip(), flags=re.MULTILINE).strip()
        
        # Debug: show first 300 chars of LLM output
        print("\n  LLM->{}".format(raw[:200].replace("\n", " ")))
        
        si = cleaned.find("{")
        ei = cleaned.rfind("}") + 1
        result = json.loads(cleaned[si:ei]) if si >= 0 and ei > si else {}
        
        filled = 0; samples = []
        for n in nodes:
            cps = result.get(n["id"], [])
            good = [c.strip() for c in cps if c.strip() and len(c.strip()) > 8]
            if good:
                td = json.load(open(n["file"]))
                chg = False
                for dom in td.get("domains", []):
                    for nd in dom.get("nodes", []):
                        if nd["id"] == n["id"]:
                            nd["curriculum_points"] = good
                            chg = True
                            break
                    if chg: break
                if chg:
                    with open(n["file"], "w") as fo:
                        json.dump(td, fo, ensure_ascii=False, indent=2)
                    filled += 1
                    if len(samples) < 3:
                        samples.append("[{}] {}".format(n["id"], str(good[0])[:80]))
        
        print(" -> OK {}/{}".format(filled, len(nodes)))
        for s in samples:
            print("   {}".format(s))
        return filled
    except Exception as e:
        print(" -> FAIL {}".format(e))
        return 0


total_filled = 0

# ============================================================
# 1. CAMBRIDGE PRIMARY SCIENCE (22 missing, has PDF)
# ============================================================
print("=" * 60)
print("1. CAMBRIDGE PRIMARY SCIENCE")
sci_pdf = "/Users/wepon/CodeBuddy/一次函数/books/国际课标/Cambridge/Primary/Primary_Science_Framework.pdf"
sci_text = extract_text(sci_pdf)
print("Science PDF text: {} chars".format(len(sci_text)))

if sci_text and len(sci_text) > 100:
    nodes = []
    for f in sorted(glob.glob("data/trees/cambridge/primary/science.json")):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                if not n.get("curriculum_points"):
                    nodes.append({"id":n["id"],"name":n.get("name",""),"name_en":n.get("name_en",""),"file":f})
    if nodes:
        total_filled += fill(nodes, sci_text, "Cambridge Primary Science")

# Also try Primary Math remaining (1 missing)
for subj in ["math", "english"]:
    nodes = []
    for f in sorted(glob.glob("data/trees/cambridge/primary/{}.json".format(subj))):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                if not n.get("curriculum_points"):
                    nodes.append({"id":n["id"],"name":n.get("name",""),"name_en":n.get("name_en",""),"file":f})
    
    if not nodes:
        continue
    
    # Find PDF
    pdf_map = {"math": "Primary_Math_Framework_0096.pdf", "english": "Primary_English_Framework_0058.pdf"}
    pn = pdf_map.get(subj)
    if pn:
        pp = os.path.join("/Users/wepon/CodeBuddy/一次函数/books/国际课标/Cambridge/Primary", pn)
        txt = extract_text(pp)
        if txt and len(txt) > 100:
            total_filled += fill(nodes, txt, "Cambridge Primary {}".format(subj))

# ============================================================
# 2. IB PYP REMAINING (82 missing across 5 themes, have Curriculum Guide)
# ============================================================
print("\n" + "=" * 60)
print("2. IB PYP REMAINING THEMES")

pyp_pdf = "/Users/wepon/CodeBuddy/一次函数/books/国际课标/IB/PYP/PYP_Curriculum_Guide_2024-25.pdf"
pyp_text = extract_text(pyp_pdf)
print("PYP Guide: {} chars".format(len(pyp_text)))

if pyp_text and len(pyp_text) > 100:
    pyp_themes = ["how-we-express", "how-we-organize", "how-world-works", 
                   "sharing-planet", "where-we-are", "who-we-are"]
    for theme in pyp_themes:
        nodes = []
        for f in sorted(glob.glob("data/trees/ib/pyp/{}.json".format(theme))):
            d = json.load(open(f))
            for dom in d.get("domains", []):
                for n in dom.get("nodes", []):
                    if not n.get("curriculum_points"):
                        nodes.append({"id":n["id"],"name":n.get("name",""),"name_en":n.get("name_en",""),"file":f})
        if nodes:
            total_filled += fill(nodes, pyp_text, "IB PYP {}".format(theme))


# ============================================================
# 3. CAMBRIDGE LSEC ENGLISH (12 missing)
# ============================================================
print("\n" + "=" * 60)
print("3. CAMBRIDGE LS ENGLISH")

ls_eng_pdf = "/Users/wepon/CodeBuddy/一次函数/books/国际课标/Cambridge/LowerSecondary/LS_English_Outline.pdf"
ls_eng_text = extract_text(ls_eng_pdf)
print("LS English PDF: {} chars".format(len(ls_eng_text)))

if ls_eng_text and len(ls_eng_text) > 50:
    # The PDF might be short/damaged; try with what we have
    nodes = []
    for f in sorted(glob.glob("data/trees/cambridge/lsec/english*.json")):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                if not n.get("curriculum_points"):
                    nodes.append({"id":n["id"],"name":n.get("name",""),"name_en":n.get("name_en",""),"file":f})
    
    # Also use Comprehensive as fallback (it had English section TOC)
    comp_text = extract_text("/Users/wepon/CodeBuddy/一次函数/books/国际课标/Cambridge/LowerSecondary/LS_Comprehensive.pdf")
    combined = ls_eng_text + "\n\n---\n\n" + comp_text
    
    if nodes and len(combined) > 100:
        total_filled += fill(nodes, combined, "Cambridge LS English")


# ============================================================
# FINAL STATS
# ============================================================
print("\n" + "=" * 60)
print("ROUND 2 FILLED: {}".format(total_filled))
print("=" * 60)
total_all = 0; cp_all = 0
for curr in ["cn", "ap", "cambridge", "ib", "us"]:
    total = 0; with_cp = 0
    for f in glob.glob("data/trees/{}/**/*.json".format(curr), recursive=True):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                total += 1
                if n.get("curriculum_points"):
                    with_cp += 1
    pct = with_cp / total * 100 if total else 0
    total_all += total; cp_all += with_cp
    print("{:12} {:4d} cp={:4d} {:.1f}%".format(curr, total, with_cp, pct))
print("{:12} {:4d} cp={:4d} {:.1f}%".format("TOTAL", total_all, cp_all, cp_all/total_all*100))
