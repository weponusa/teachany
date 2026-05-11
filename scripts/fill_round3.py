#!/usr/bin/env python3
"""Fill remaining PYP themes and other gaps."""
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
    except:
        pass
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
    nl = "\n".join(
        "{} | EN:{} | CN:{}".format(n["id"], n.get("name_en","") or "(none)", n.get("name","") or "(none)")
        for n in nodes
    )
    
    prompt = (
        "You are a curriculum expert for {}.\n\n"
        "CURRICULUM DOCUMENT is provided below.\n"
        "KNOWLEDGE POINTS are from a course tree - each has ID, English name, Chinese name.\n\n"
        "TASK: For EACH knowledge point, find ALL relevant learning objectives.\n\n"
        "RULES:\n"
        "- Match by TOPIC/SUBJECT, not exact wording.\n"
        "- Each entry must be substantive (10+ chars).\n"
        "- Output pure JSON: {{\"node_id\": [\"description\"]}}\n"
        "- Use [] if topic doesn't exist in document.\n"
        "- Output ALL {} entries.\n\n"
        "POINTS ({} pts):\n{}\n\n"
        "DOCUMENT:\n{}"
    ).format(tag, len(nodes), len(nodes), nl, text[:20000])
    
    print("\n[{}] ({}pts)".format(tag, len(nodes)), end="", flush=True)
    try:
        raw = call_llm(prompt)
        cleaned = re.sub(r"^```json|^```|```$", "", raw.strip(), flags=re.MULTILINE).strip()
        si = cleaned.find("{"); ei = cleaned.rfind("}") + 1
        result = json.loads(cleaned[si:ei]) if si >= 0 and ei > si else {}
        
        filled = 0; samples = []
        for n in nodes:
            cps = result.get(n["id"], [])
            good = [c.strip() for c in cps if c.strip() and len(c.strip()) > 8]
            if good:
                td = json.load(open(n["file"])); chg = False
                for dom in td.get("domains", []):
                    for nd in dom.get("nodes", []):
                        if nd["id"] == n["id"]:
                            nd["curriculum_points"] = good; chg = True; break
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

# === IB PYP REMAINING 4 THEMES ===
pyp_pdf = "/Users/wepon/CodeBuddy/一次函数/books/国际课标/IB/PYP/PYP_Curriculum_Guide_2024-25.pdf"
pyp_text = extract_text(pyp_pdf)

if pyp_text:
    # Only the themes that still have missing nodes
    pyp_remaining = ["how-we-express", "how-world-works", "where-we-are", "who-we-are"]
    for theme in pyp_remaining:
        nodes = []
        for f in sorted(glob.glob("data/trees/ib/pyp/{}.json".format(theme))):
            d = json.load(open(f))
            for dom in d.get("domains", []):
                for n in dom.get("nodes", []):
                    if not n.get("curriculum_points"):
                        nodes.append({"id":n["id"],"name":n.get("name",""),"name_en":n.get("name_en",""),"file":f})
        if nodes:
            total += fill(nodes, pyp_text, "IB PYP {}".format(theme))


# === US MS MATH (9 missing) ===
us_math_md = "/Users/wepon/CodeBuddy/一次函数/books/课标-整理版/us/common-core-math.md"
if os.path.exists(us_math_md):
    us_text = open(us_math_md).read()
    g6_pos = us_text.find("Grade 6", 95000)
    hs_pos = us_text.find("High School", 140000)
    ms_text = us_text[g6_pos:hs_pos][:15000] if g6_pos > 0 and hs_pos > g6_pos else ""
    
    if ms_text:
        nodes = []
        for f in sorted(glob.glob("data/trees/us/ms/math.json")):
            d = json.load(open(f))
            for dom in d.get("domains", []):
                for n in dom.get("nodes", []):
                    if not n.get("curriculum_points"):
                        nodes.append({"id":n["id"],"name":n.get("name",""),"name_en":n.get("name_en",""),"file":f})
        if nodes:
            total += fill(nodes, ms_text, "US CCSS Math MS")


# === US HS ELA (12 missing) ===
us_ela_md = "/Users/wepon/CodeBuddy/一次函数/books/课标-整理版/us/common-core-ela.md"
if os.path.exists(us_ela_md):
    ela_text = open(us_ela_md).read()
    hs_start = ela_text.find("High School", 40000)
    if hs_start > 0:
        ela_hs = ela_text[hs_start:hs_start+18000]
        nodes = []
        for f in sorted(glob.glob("data/trees/us/hs/ela.json")):
            d = json.load(open(f))
            for dom in d.get("domains", []):
                for n in dom.get("nodes", []):
                    if not n.get("curriculum_points"):
                        nodes.append({"id":n["id"],"name":n.get("name",""),"name_en":n.get("name_en",""),"file":f})
        if nodes:
            total += fill(nodes, ela_hs, "US CCSS ELA HS")


# === US K5 math (1 missing), K5 social studies (16 missing) ===
k5_ss_nodes = []
for f in sorted(glob.glob("data/trees/us/k5/social-studies.json")):
    d = json.load(open(f))
    for dom in d.get("domains", []):
        for n in dom.get("nodes", []):
            if not n.get("curriculum_points"):
                k5_ss_nodes.append({"id":n["id"],"name":n.get("name",""),"name_en":n.get("name_en",""),"file":f})

for f in sorted(glob.glob("data/trees/us/k5/math.json")):
    d = json.load(open(f))
    for dom in d.get("domains", []):
        for n in dom.get("nodes", []):
            if not n.get("curriculum_points"):
                k5_ss_nodes.append({"id":n["id"],"name":n.get("name",""),"name_en":n.get("name_en",""),"file":f})

# Use C3 Framework or NCSS standards if available
us_base = "/Users/wepon/CodeBuddy/一次函数/books/课标-整理版/us"
ss_texts = []
for fn in os.listdir(us_base) if os.path.exists(us_base) else []:
    fl = fn.lower()
    fp = os.path.join(us_base, fn)
    if any(kw in fl for kw in ["social", "history", "civics", "c3"]) and (fn.endswith(".md") or fn.endswith(".txt")):
        ss_texts.append(open(fp).read())

if k5_ss_nodes and ss_texts:
    total += fill(k5_ss_nodes, "\n\n---\n\n".join(ss_texts)[:18000], "US K5 SS+Math")


# === FINAL ===
print("\n=== ROUND 3 FILLED: {} ===".format(total))
total_all = 0; cp_all = 0
for curr in ["cn", "ap", "cambridge", "ib", "us"]:
    t = 0; c = 0
    for f in glob.glob("data/trees/{}/**/*.json".format(curr), recursive=True):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                t += 1
                if n.get("curriculum_points"): c += 1
    total_all += t; cp_all += c
    print("{:12} {:4d} cp={:4d} {:.1f}%".format(curr, t, c, c/t*100 if t else 0))
print("{:12} {:4d} cp={:4d} {:.1f}%".format("TOTAL", total_all, cp_all, cp_all/total_all*100))
