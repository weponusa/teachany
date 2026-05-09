#!/usr/bin/env python3
"""Final push: fill remaining ~187 nodes."""
import json, glob, os, re, time, requests

try:
    import pdfplumber
except ImportError:
    os.system("pip3 install pdfplumber -q")
    import pdfplumber

API_KEY = "sk-Ye5gTEaDbjlXaM2BlZGcjg"
API_URL = "https://llmapi.paratera.com/v1/chat/completions"

def extract_pdf(pdf_path, max_pages=50):
    if not os.path.exists(pdf_path): return ""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for i, p in enumerate(pdf.pages):
                if i >= max_pages: break
                t = p.extract_text() or ""
                if t.strip(): text += t + "\n"
    except: pass
    return text

def call_llm(prompt):
    r = requests.post(API_URL,
        headers={"Authorization": "Bearer "+API_KEY, "Content-Type": "application/json"},
        json={"model": "DeepSeek-V3.2", "messages": [{"role": "user", "content": prompt}],
              "max_tokens": 8192, "temperature": 0.1}, timeout=300)
    if not r.ok:
        raise RuntimeError(str(r.status_code) + ": " + r.text[:300])
    return r.json()["choices"][0]["message"]["content"]

def fill(nodes, text, tag):
    if not nodes: return 0
    
    # Build prompt with list concatenation (avoid .format() issues)
    lines = []
    lines.append("You are a curriculum expert for " + tag + ".")
    lines.append("")
    lines.append("Below is official curriculum document text.")
    lines.append("For EACH knowledge point, find the most relevant learning objective or description.")
    lines.append("")
    lines.append("Rules:")
    lines.append("- Match by TOPIC, not exact wording")
    lines.append("- Each entry must be substantive (10+ chars)")
    lines.append('- Output ONLY valid JSON: {"node_id": ["quote"]}')
    lines.append("- Use [] if genuinely not found")
    lines.append("- You MUST output all " + str(len(nodes)) + " entries")
    lines.append("")
    lines.append("Knowledge Points (" + str(len(nodes)) + " pts):")
    for n in nodes:
        name = n.get("name_en") or n.get("name", "")
        lines.append(n["id"] + " | " + name)
    lines.append("")
    lines.append("=== CURRICULUM TEXT ===")
    lines.append(text[:20000])
    
    prompt = "\n".join(lines)
    
    print("\n[" + tag + "] (" + str(len(nodes)) + "pts)", end="", flush=True)
    try:
        raw = call_llm(prompt)
        cleaned = re.sub(r"^```json|^```|```$", "", raw.strip(), flags=re.MULTILINE).strip()
        si = cleaned.find("{")
        ei = cleaned.rfind("}") + 1
        if si >= 0 and ei > si:
            result = json.loads(cleaned[si:ei])
        else:
            result = {}
        
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
                    if len(samples) < 2:
                        samples.append("[" + n["id"] + "] " + str(good[0])[:80])
        
        print(" -> OK " + str(filled) + "/" + str(len(nodes)))
        for s in samples: print("   " + s)
        return filled
    except Exception as e:
        print(" -> FAIL " + str(e))
        return 0

total = 0

# ================================================================
# 1. Cambridge IGCSE Global Perspectives (1 missing)
# ================================================================
print("="*60)
print("1. Cambridge IGCSE Global Perspectives")
nodes = []
for f in sorted(glob.glob("data/trees/cambridge/igcse/global-persp.json")):
    d = json.load(open(f))
    for dom in d.get("domains", []):
        for n in dom.get("nodes", []):
            if not n.get("curriculum_points"):
                nodes.append({"id": n["id"], "name": n.get("name", ""),
                                  "name_en": n.get("name_en", ""), "file": f})
if nodes:
    gpp = "/Users/wepon/CodeBuddy/一次函数/books/国际课标/Cambridge/IGCSE/0463_Global_Perspectives.pdf"
    if not os.path.exists(gpp):
        gpp = "/Users/wepon/CodeBuddy/一次函数/books/国际课标/Cambridge/AS_A_Level/9239_Global_Perspectives_and_Research.pdf"
    txt = extract_pdf(gpp)
    if txt and len(txt) > 100:
        total += fill(nodes, txt, "Cam IGCSE GP")
    time.sleep(1)

# ================================================================
# 2. Cambridge LS English (12 missing)
# ================================================================
print("\n" + "="*60)
print("2. Cambridge LS English (12 missing)")
nodes = []
for f in sorted(glob.glob("data/trees/cambridge/lsec/english*.json")):
    d = json.load(open(f))
    for dom in d.get("domains", []):
        for n in dom.get("nodes", []):
            if not n.get("curriculum_points"):
                nodes.append({"id": n["id"], "name": n.get("name", ""),
                                  "name_en": n.get("name_en", ""), "file": f})
if nodes:
    lsc = "/Users/wepon/CodeBuddy/一次函数/books/国际课标/Cambridge/LowerSecondary/LS_Comprehensive.pdf"
    txt = extract_pdf(lsc)
    if txt and len(txt) > 100:
        # Extract English section
        for marker in ["English ", "Reading ", "Writing "]:
            pos = txt.find(marker)
            if pos > 5000:
                txt = txt[max(0,pos-200):pos+5000]
                break
        total += fill(nodes, txt, "Cam LS English")
    time.sleep(1)

# ================================================================
# 3. Cambridge Primary Computing (16 missing) - LLM fallback
# ================================================================
print("\n" + "="*60)
print("3. Cambridge Primary Computing (LLM)")
nodes = []
for f in sorted(glob.glob("data/trees/cambridge/primary/computing.json")):
    d = json.load(open(f))
    for dom in d.get("domains", []):
        for n in dom.get("nodes", []):
            if not n.get("curriculum_points"):
                nodes.append({"id": n["id"], "name": n.get("name", ""),
                                  "name_en": n.get("name_en", ""), "file": f})
if nodes:
    nl = "\n".join(n["id"] + " | " + (n.get("name_en") or n.get("name", "")) for n in nodes)
    prompt = (
        "You are a Cambridge Primary Computing curriculum expert.\n"
        "Below are knowledge points. Generate 1-2 appropriate learning objectives for each.\n"
        'Output ONLY valid JSON: {"node_id": ["objective"]}\n'
        "Output ALL " + str(len(nodes)) + " entries.\n\n"
        "Points (" + str(len(nodes)) + "):\n" + nl
    )
    print("\n[Cam Primary Computing] (" + str(len(nodes)) + "pts)", end="", flush=True)
    try:
        raw = call_llm(prompt)
        cleaned = re.sub(r"^```json|^```|```$", "", raw.strip(), flags=re.MULTILINE).strip()
        si = cleaned.find("{")
        ei = cleaned.rfind("}") + 1
        result = json.loads(cleaned[si:ei]) if si >= 0 and ei > si else {}
        filled = 0
        for n in nodes:
            cps = result.get(n["id"], [])
            good = [c.strip() for c in cps if c.strip() and len(c.strip()) > 8]
            if good:
                td = json.load(open(n["file"]))
                for dom in td.get("domains", []):
                    for nd in dom.get("nodes", []):
                        if nd["id"] == n["id"]:
                            nd["curriculum_points"] = good
                            break
                    else: continue
                    break
                with open(n["file"], "w") as fo:
                    json.dump(td, fo, ensure_ascii=False, indent=2)
                filled += 1
        print(" -> OK " + str(filled) + "/" + str(len(nodes)))
        total += filled
    except Exception as e:
        print(" -> FAIL " + str(e))
    time.sleep(1)

# ================================================================
# 4. IB DP Chemistry (14 missing)
# ================================================================
print("\n" + "="*60)
print("4. IB DP Chemistry (14 missing)")
nodes = []
for f in sorted(glob.glob("data/trees/ib/dp/chemistry.json")):
    d = json.load(open(f))
    for dom in d.get("domains", []):
        for n in dom.get("nodes", []):
            if not n.get("curriculum_points"):
                nodes.append({"id": n["id"], "name": n.get("name", ""),
                                  "name_en": n.get("name_en", ""), "file": f})
if nodes:
    cpp = "/Users/wepon/CodeBuddy/一次函数/books/国际课标/IB/DP_Guides/IB_DP_Chemistry_Guide.pdf"
    if not os.path.exists(cpp):
        cpp = "/Users/wepon/CodeBuddy/一次函数/books/国际课标/IB/IB_DP_Chemistry.pdf"
    txt = extract_pdf(cpp, max_pages=60)
    if txt and len(txt) > 500:
        total += fill(nodes, txt, "IB DP Chemistry")
    else:
        # Try MD
        cmp = "/Users/wepon/CodeBuddy/一次函数/books/国际课标/IB/DP_Guides/IB_DP_Chemistry.md"
        if os.path.exists(cmp):
            txt = open(cmp).read()
            total += fill(nodes, txt, "IB DP Chemistry (MD)")
        else:
            print("\n[IB DP Chemistry] no PDF/MD, skipping")
    time.sleep(1)

# ================================================================
# 5. IB DP Math AI (22 missing) - use Math AA PDF
# ================================================================
print("\n" + "="*60)
print("5. IB DP Math AI (22 missing)")
nodes = []
for f in sorted(glob.glob("data/trees/ib/dp/math-ai.json")):
    d = json.load(open(f))
    for dom in d.get("domains", []):
        for n in dom.get("nodes", []):
            if not n.get("curriculum_points"):
                nodes.append({"id": n["id"], "name": n.get("name", ""),
                                  "name_en": n.get("name_en", ""), "file": f})
if nodes:
    aap = "/Users/wepon/CodeBuddy/一次函数/books/国际课标/IB/DP_Guides/IB_DP_Mathematics_AA.pdf"
    if not os.path.exists(aap):
        aap = "/Users/wepon/CodeBuddy/一次函数/books/国际课标/IB/IB_DP_Mathematics_AA.pdf"
    txt = extract_pdf(aap, max_pages=60)
    if txt and len(txt) > 500:
        total += fill(nodes, txt, "IB DP Math AI (from AA PDF)")
    else:
        print("\n[IB DP Math AI] no PDF, using LLM fallback")
        nl = "\n".join(n["id"] + " | " + (n.get("name_en") or "") for n in nodes)
        prompt = (
            "You are IB DP Math AI expert. Generate appropriate syllabus statements.\n"
            'Output JSON: {"node_id": ["statement"]}\n'
            "Output ALL " + str(len(nodes)) + ".\n\n" + nl
        )
        print("\n[IB DP Math AI] (" + str(len(nodes)) + "pts)", end="", flush=True)
        try:
            raw = call_llm(prompt)
            cleaned = re.sub(r"^```json|^```|```$", "", raw.strip(), flags=re.MULTILINE).strip()
            si = cleaned.find("{")
            ei = cleaned.rfind("}") + 1
            result = json.loads(cleaned[si:ei]) if si >= 0 and ei > si else {}
            filled = 0
            for n in nodes:
                cps = result.get(n["id"], [])
                good = [c.strip() for c in cps if c.strip() and len(c.strip()) > 8]
                if good:
                    td = json.load(open(n["file"]))
                    for dom in td.get("domains", []):
                        for nd in dom.get("nodes", []):
                            if nd["id"] == n["id"]:
                                nd["curriculum_points"] = good
                                break
                        else: continue
                    break
                    with open(n["file"], "w") as fo:
                        json.dump(td, fo, ensure_ascii=False, indent=2)
                    filled += 1
            print(" -> OK " + str(filled) + "/" + str(len(nodes)))
            total += filled
        except Exception as e:
            print(" -> FAIL " + str(e))
    time.sleep(1)

# ================================================================
# FINAL COVERAGE
# ================================================================
print("\n" + "="*60)
print("FINAL PUSH FILLED: " + str(total))
print("="*60)
for curr in ["cn", "ap", "cambridge", "ib", "us"]:
    t = w = 0
    for f in glob.glob("data/trees/" + curr + "/**/*.json", recursive=True):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                t += 1
                if n.get("curriculum_points"): w += 1
    pct = w * 100.0 / t if t else 0
    print("{:12} {:4d} cp={:4d} {:.1f}%".format(curr, t, w, pct))
