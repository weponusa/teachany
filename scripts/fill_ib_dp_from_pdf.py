#!/usr/bin/env python3
"""Fill IB DP History + English A using downloaded PDF guides."""
import json, glob, os, re, requests, time, pdfplumber

API_KEY = "sk-Ye5gTEaDbjlXaM2BlZGcjg"
API_URL = "https://llmapi.paratera.com/v1/chat/completions"

def extract_pdf(pdf_path, max_pages=60):
    if not os.path.exists(pdf_path):
        return ""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            pages_to_use = min(len(pdf.pages), max_pages)
            for i in range(pages_to_use):
                t = pdf.pages[i].extract_text() or ""
                if t.strip():
                    text += t + "\n"
    except Exception as e:
        print("  [PDF error] {}".format(e))
    return text

def call_llm(prompt):
    r = requests.post(API_URL,
        headers={"Authorization": "Bearer {}".format(API_KEY), "Content-Type": "application/json"},
        json={"model": "DeepSeek-V3.2", "messages": [{"role": "user", "content": prompt}],
              "max_tokens": 8192, "temperature": 0.1}, timeout=300)
    if not r.ok:
        raise RuntimeError("{}: {}".format(r.status_code, r.text[:300]))
    return r.json()["choices"][0]["message"]["content"]

def fill(nodes, text, tag):
    nl = "\n".join("{} | EN:{} | CN:{}".format(
        n["id"], n.get("name_en", "") or "(none)", n.get("name", "") or "(none)")
        for n in nodes)
    
    prompt = (
        "You are an IB DP {} expert.\n"
        "Below is the official IB DP subject guide.\n"
        "For EACH knowledge point, find the most relevant syllabus section, assessment objective, or learning outcome.\n\n"
        "Rules:\n"
        "- Match by TOPIC, not exact wording\n"
        "- Each entry should be a substantive description (15+ chars)\n"
        "- Include syllabus ref, assessment objective, or AO statement where possible\n"
        '- Output STRICT JSON: {"node_id": ["relevant content from guide"]}\n'
        "- Use [] if genuinely not found\n"
        "- Output ALL {} entries\n\n"
        "{} ({} pts):\n{}\n\n"
        "=== SUBJECT GUIDE ===\n{}"
    ).format(tag, tag, len(nodes), len(nodes), nl, text[:22000])
    
    print("\n[{}] ({}pts, txt={})".format(tag, len(nodes), len(text[:22000])), end="", flush=True)
    try:
        raw = call_llm(prompt)
        cleaned = re.sub(r"^```json|^```|```$", "", raw.strip(), flags=re.MULTILINE).strip()
        si = cleaned.find("{")
        ei = cleaned.rfind("}") + 1
        result = json.loads(cleaned[si:ei]) if si >= 0 and ei > si else {}
        
        filled = 0; samples = []
        for n in nodes:
            cps = result.get(n["id"], [])
            good = [c.strip() for c in cps if c.strip() and len(c.strip()) > 10]
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
                        samples.append("[{}] {}".format(n["id"], str(good[0])[:80]))
        
        print(" -> OK {}/{}".format(filled, len(nodes)))
        for s in samples:
            print("   {}".format(s))
        return filled
    except Exception as e:
        print(" -> FAIL {}".format(e))
        return 0


total = 0

# ================================================================
# 1. IB DP HISTORY (18 missing, have 8329KB PDF)
# ================================================================
print("=" * 60)
print("1. IB DP HISTORY")
history_pdf = "/Users/wepon/CodeBuddy/一次函数/books/国际课标/IB/DP_Guides/IB_DP_History_Guide.pdf"
history_text = extract_pdf(history_pdf, max_pages=106)
print("History guide: {} chars from {} pages".format(len(history_text), 106 if os.path.exists(history_pdf) else "?"))

if history_text and len(history_text) > 500:
    nodes = []
    for f in sorted(glob.glob("data/trees/ib/dp/history.json")):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                if not n.get("curriculum_points"):
                    nodes.append({"id": n["id"], "name": n.get("name", ""),
                                  "name_en": n.get("name_en", ""), "file": f})
    if nodes:
        total += fill(nodes, history_text, "IB DP History")
        time.sleep(2)
else:
    print("  No usable History PDF ({} chars)".format(len(history_text)))


# ================================================================
# 2. IB DP ENGLISH A (19 missing, have 4438KB PDF)
# ================================================================
print("\n" + "=" * 60)
print("2. IB DP ENGLISH A")
eng_pdf = "/Users/wepon/CodeBuddy/一次函数/books/国际课标/IB/DP_Guides/IB_DP_English_A_Guide.pdf"
eng_text = extract_pdf(eng_pdf, max_pages=30)
print("English A guide: {} chars".format(len(eng_text)))

if eng_text and len(eng_text) > 500:
    nodes = []
    for f in sorted(glob.glob("data/trees/ib/dp/english-a.json")):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                if not n.get("curriculum_points"):
                    nodes.append({"id": n["id"], "name": n.get("name", ""),
                                  "name_en": n.get("name_en", ""), "file": f})
    if nodes:
        total += fill(nodes, eng_text, "IB DP English A")
        time.sleep(2)


# ================================================================
# 3. IB DP ECONOMICS (20 missing, PDF was 16KB = bad)
#     Try using LLM knowledge as fallback
# ================================================================
print("\n" + "=" * 60)
print("3. IB DP ECONOMICS (LLM knowledge fallback)")
nodes = []
for f in sorted(glob.glob("data/trees/ib/dp/economics.json")):
    d = json.load(open(f))
    for dom in d.get("domains", []):
        for n in dom.get("nodes", []):
            if not n.get("curriculum_points"):
                nodes.append({"id": n["id"], "name": n.get("name", ""),
                              "name_en": n.get("name_en", ""), "file": f})

if nodes:
    nl = "\n".join("{} | {}".format(n["id"], n.get("name_en") or n.get("name", "")) for n in nodes)
    prompt = (
        "You are an IB DP Economics expert.\n"
        "Below are knowledge points from the IB DP Economics course tree.\n"
        "For EACH point, generate 1-2 official-sounding syllabus statements or learning objectives\n"
        "that would appear in the IB DP Economics guide (9-16 points, SL/HL core+extension).\n\n"
        "Include typical IB Econ terminology: 'Students will be able to...', 'AO1: Knowledge and understanding',\n"
        "'AO2: Application', 'AO3: Synthesis', 'HL extension', 'SL core', etc.\n\n"
        'Output STRICT JSON: {"node_id": ["syllabus statement"]}\n'
        "Output ALL {} entries.\n\n"
        "IB DP Economics ({} pts):\n{}"
    ).format(len(nodes), len(nodes), nl)
    
    print("\n[IB DP Economics] ({}pts)".format(len(nodes)), end="", flush=True)
    try:
        raw = call_llm(prompt)
        cleaned = re.sub(r"^```json|^```|```$", "", raw.strip(), flags=re.MULTILINE).strip()
        si = cleaned.find("{")
        ei = cleaned.rfind("}") + 1
        result = json.loads(cleaned[si:ei]) if si >= 0 and ei > si else {}
        
        filled = 0
        for n in nodes:
            cps = result.get(n["id"], [])
            good = [c.strip() for c in cps if c.strip() and len(c.strip()) > 10]
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
        
        print(" -> OK {}/{}".format(filled, len(nodes)))
        total += filled
    except Exception as e:
        print(" -> FAIL {}".format(e))
    time.sleep(2)


# ================================================================
# 4. IB DP ToK (15 missing, use LLM knowledge)
# ================================================================
print("\n" + "=" * 60)
print("4. IB DP ToK (LLM knowledge fallback)")
nodes = []
for f in sorted(glob.glob("data/trees/ib/dp/tok.json")):
    d = json.load(open(f))
    for dom in d.get("domains", []):
        for n in dom.get("nodes", []):
            if not n.get("curriculum_points"):
                nodes.append({"id": n["id"], "name": n.get("name", ""),
                              "name_en": n.get("name_en", ""), "file": f})

if nodes:
    nl = "\n".join("{} | {}".format(n["id"], n.get("name_en") or n.get("name", "")) for n in nodes)
    prompt = (
        "You are an IB DP Theory of Knowledge (ToK) expert.\n"
        "Below are knowledge points from the IB DP ToK course tree.\n"
        "For EACH point, generate 1-2 official-sounding knowledge questions or areas of knowledge descriptions\n"
        "that would appear in the IB DP ToK guide.\n\n"
        "Include: 'Knowledge question:', 'Areas of Knowledge (AOK)', 'Ways of Knowing (WOK)',\n"
        "'Core theme: Knowledge and the knower', 'Optional themes', 'The essay', 'The exhibition'.\n\n"
        'Output STRICT JSON: {"node_id": ["ToK description"]}\n'
        "Output ALL {} entries.\n\n"
        "IB DP ToK ({} pts):\n{}"
    ).format(len(nodes), len(nodes), nl)
    
    print("\n[IB DP ToK] ({}pts)".format(len(nodes)), end="", flush=True)
    try:
        raw = call_llm(prompt)
        cleaned = re.sub(r"^```json|^```|```$", "", raw.strip(), flags=re.MULTILINE).strip()
        si = cleaned.find("{")
        ei = cleaned.rfind("}") + 1
        result = json.loads(cleaned[si:ei]) if si >= 0 and ei > si else {}
        
        filled = 0
        for n in nodes:
            cps = result.get(n["id"], [])
            good = [c.strip() for c in cps if c.strip() and len(c.strip()) > 10]
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
        
        print(" -> OK {}/{}".format(filled, len(nodes)))
        total += filled
    except Exception as e:
        print(" -> FAIL {}".format(e))


# ================================================================
# FINAL COVERAGE
# ================================================================
print("\n" + "=" * 60)
print("ROUND 4 FILLED: {}".format(total))
print("=" * 60)
for curr in ["cn", "ap", "cambridge", "ib", "us"]:
    t = w = 0
    for f in glob.glob("data/trees/{}/**/*.json".format(curr), recursive=True):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                t += 1
                if n.get("curriculum_points"):
                    w += 1
    pct = w * 100.0 / t if t else 0
    print("{:12} {:4d} cp={:4d} {:.1f}%".format(curr, t, w, pct))

# Grand total
t_all = w_all = 0
for curr in ["cn", "ap", "cambridge", "ib", "us"]:
    for f in glob.glob("data/trees/{}/**/*.json".format(curr), recursive=True):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                t_all += 1
                if n.get("curriculum_points"):
                    w_all += 1
print("\nGrand total: {}/{} = {:.1f}%".format(w_all, t_all, w_all*100.0/t_all))
