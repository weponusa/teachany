#!/usr/bin/env python3
"""Fill remaining curriculum points using Paratera + pdfplumber with DEBUG output."""
import json, glob, os, sys, requests, re, time

try:
    import pdfplumber
except ImportError:
    os.system("pip3 install pdfplumber -q")
    import pdfplumber

API_KEY = "sk-Ye5gTEaDbjlXaM2BlZGcjg"
API_URL = "https://llmapi.paratera.com/v1/chat/completions"

def extract_text(pdf_path, max_pages=30):
    """Extract text from PDF using pdfplumber."""
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
        print("  [WARN] PDF extract failed: {}".format(e))
    return text

def call_llm(prompt):
    r = requests.post(API_URL,
        headers={"Authorization":"Bearer {}".format(API_KEY),"Content-Type":"application/json"},
        json={"model":"DeepSeek-V3.2","messages":[{"role":"user","content":prompt}],
             "max_tokens":8192,"temperature":0.1}, timeout=300)
    if not r.ok:
        raise RuntimeError("{}: {}".format(r.status_code, r.text[:300]))
    return r.json()["choices"][0]["message"]["content"]

def fill(nodes, text, tag, debug=False):
    nl = "\n".join("{} | {} (en:{})".format(n["id"], n.get("name",""), n.get("name_en","")) for n in nodes)
    
    # IMPROVED PROMPT: semantic matching, not exact match
    prompt = (
        "You are an expert in {}.\n\n"
        "Below is a curriculum document and a list of knowledge points from a course tree.\n"
        "Your task: For EACH knowledge point, find the MOST RELEVANT learning objective, standard, or topic description from the curriculum.\n\n"
        "IMPORTANT matching rules:\n"
        "- Do NOT require exact string match. Use SEMANTIC matching.\n"
        "- The knowledge point names may be brief/abbreviated - map them to the closest detailed objective.\n"
        "- If the point is 'Inference', look for objectives about making inferences, drawing conclusions, etc.\n"
        "- If the point is about a math topic (fractions, equations), find the corresponding curriculum objective.\n"
        "- Each entry should be a substantive quote (10+ chars), not just a heading.\n\n"
        "Output format: pure JSON only: {{\"node_id\": [\"relevant curriculum objective quote\"]}}\n"
        "Use [] if truly no related content exists. Output ALL {} entries.\n\n"
        "Knowledge Points ({} pts):\n{}\n\n"
        "Curriculum Document:\n{}"
    ).format(tag, len(nodes), len(nodes), nl, text[:18000])
    
    print("\n[{}] ({}pts) txt={}".format(tag, len(nodes), len(text[:18000])), end="", flush=True)
    try:
        raw = call_llm(prompt)
        cleaned = re.sub(r"^```json|^```|```$", "", raw.strip(), flags=re.MULTILINE).strip()
        
        if debug:
            print("\n  --- LLM RAW (first 500) ---")
            print(raw[:500])
            
        si = cleaned.find("{")
        ei = cleaned.rfind("}") + 1
        result = json.loads(cleaned[si:ei]) if si >= 0 and ei > si else {}
        
        filled = 0
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
                    if chg:
                        break
                if chg:
                    with open(n["file"], "w") as fo:
                        json.dump(td, fo, ensure_ascii=False, indent=2)
                    filled += 1
        
        print(" -> OK {}/{}".format(filled, len(nodes)))
        
        # Show samples
        sc = 0
        for nid, cps in list(result.items()):
            if any(len(c) > 8 for c in cps):
                print("   [{}] {}".format(nid, str(cps[0])[:100]))
                sc += 1
                if sc >= 2:
                    break
        return filled
    except Exception as e:
        print(" -> FAIL {}".format(e))
        return 0


# ============================================================
# 1. CAMBRIDGE LOWER SECONDARY (using official 0862 Math framework)
# ============================================================
print("=" * 60)
print("CAMBRIDGE LOWER SECONDARY")
print("=" * 60)

base_cam = "/Users/wepon/CodeBuddy/一次函数/books/国际课标/Cambridge/LowerSecondary"

# Collect all LS missing nodes by subject
ls_nodes_by_subject = {}
for f in sorted(glob.glob("data/trees/cambridge/lsec/**/*.json", recursive=True)):
    d = json.load(open(f))
    parts = f.split("/")
    if len(parts) < 5:
        continue
    subj = os.path.splitext(parts[4])[0]  # e.g., "math-lsec", "english-lsec"
    for dom in d.get("domains", []):
        for n in dom.get("nodes", []):
            if not n.get("curriculum_points"):
                ls_nodes_by_subject.setdefault(subj, []).append({
                    "id": n["id"], "name": n.get("name", ""), 
                    "name_en": n.get("name_en", ""), "file": f
                })

for subj, nodes in sorted(ls_nodes_by_subject.items()):
    if not nodes:
        continue
    
    # Map subject to best PDF
    subj_key = subj.split("-")[0] if "-" in subj else subj
    pdf_map = {
        "math": ["LS_Math_Framework_0862.pdf"],
        "science": ["LS_Science_Outline.pdf"],
        "english": ["LS_English_Outline.pdf"],
        "ict": ["LS_Digital_Literacy_Outline.pdf"],
    }
    
    pdfs = pdf_map.get(subj_key, ["LS_Comprehensive.pdf"])
    texts = []
    for pn in pdfs:
        pp = os.path.join(base_cam, pn)
        if os.path.exists(pp):
            t = extract_text(pp)
            if t:
                texts.append(t)
    
    combined = "\n\n---\n\n".join(texts)
    if not combined or len(combined) < 100:
        print("\nSKIP [{}/lsec] no usable text".format(subj))
        continue
    
    debug = (subj == "math-lsec")  # Debug first run
    fill(nodes, combined, "CamLS/{}".format(subj), debug=debug)


# ============================================================
# 2. IB MYP (use individual subject guides)
# ============================================================
print("\n" + "=" * 60)
print("IB MYP")
print("=" * 60)

base_ib = "/Users/wepon/CodeBuddy/一次函数/books/国际课标/IB/MYP"

# List actual PDF files
ib_pdfs = {}
for fn in os.listdir(base_ib):
    if fn.endswith(".pdf"):
        ib_pdfs[fn.lower()] = os.path.join(base_ib, fn)
print("Available IB MYP PDFs:", list(ib_pdfs.keys()))

# IB MYP subject -> PDF mapping
ib_myp_map = {
    "individuals-societies": ["ibmyp_individuals_societies_guide.pdf"],
    "sciences": ["ibmyp_sciences_guide.pdf", "ibmyp_science_guide.pdf"],
    "language-acquisition": ["ibmyp_language_acquisition_guide.pdf"],
    "language-literature": ["ibmyp_language_literature_guide.pdf"],
    "arts": ["ibmyp_arts_guide.pdf"],
    "design": ["ibmyp_design_guide.pdf"],
    "pe": ["ibmyp_pe_guide.pdf", "ibmyp_physical_health_education_guide.pdf"],
}

# Collect IB MYP missing nodes
ibyp_nodes_by_subject = {}
for f in sorted(glob.glob("data/trees/ib/myp/**/*.json", recursive=True)):
    d = json.load(open(f))
    parts = f.split("/")
    if len(parts) < 5:
        continue
    subj = os.path.splitext(parts[4])[0]
    for dom in d.get("domains", []):
        for n in dom.get("nodes", []):
            if not n.get("curriculum_points"):
                ibyp_nodes_by_subject.setdefault(subj, []).append({
                    "id": n["id"], "name": n.get("name", ""),
                    "name_en": n.get("name_en", ""), "file": f
                })

for subj, nodes in sorted(ibyp_nodes_by_subject.items()):
    if not nodes:
        continue
    
    candidates = ib_myp_map.get(subj, [])
    texts = []
    for cn in candidates:
        for fk, fv in ib_pdfs.items():
            if cn.lower().replace("_", "").replace("-", "") in fk.replace("_", "").replace("-", "") or \
               fk.replace("_", "").replace("-", "") in cn.lower().replace("_", "").replace("-", ""):
                t = extract_text(fv)
                if t and len(t) > 100:
                    texts.append(t)
    
    if not texts:
        # Try fuzzy match
        subj_words = subj.replace("-", " ").split()
        for fk, fv in ib_pdfs.items():
            fk_clean = fk.replace(".pdf", "").replace("_", " ").replace("-", " ")
            if any(w in fk_clean for w in subj_words):
                t = extract_text(fv)
                if t and len(t) > 100:
                    texts.append(t)
                    break
    
    combined = "\n\n---\n\n".join(texts)
    if not combined or len(combined) < 100:
        print("\nSKIP [IB/{}] no usable text (tried: {})".format(subj, candidates))
        continue
    
    fill(nodes, combined, "IBMYP/{}".format(subj))


# ============================================================
# 3. US Social Studies / History (if we have C3 or similar)
# ============================================================
print("\n" + "=" * 60)
print("US SOCIAL STUDIES / HISTORY")
print("=" * 60)

us_base = "/Users/wepon/CodeBuddy/一次函数/books/课标-整理版/us"
us_ss_pdfs = []
for fn in os.listdir(us_base) if os.path.exists(us_base) else []:
    fl = fn.lower()
    if any(kw in fl for kw in ["social", "history", "c3", "civics", "geography", "econ"]):
        us_ss_pdfs.append(os.path.join(us_base, fn))

if us_ss_pdfs:
    ss_nodes = []
    for f in sorted(glob.glob("data/trees/us/hs/social-studies.json")):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                if not n.get("curriculum_points"):
                    ss_nodes.append({"id":n["id"],"name":n.get("name",""),"name_en":n.get("name_en",""),"file":f})
    
    for stage in ["k5", "ms"]:
        for f in sorted(glob.glob("data/trees/us/{}/history.json".format(stage))):
            d = json.load(open(f))
            for dom in d.get("domains", []):
                for n in dom.get("nodes", []):
                    if not n.get("curriculum_points"):
                        ss_nodes.append({"id":n["id"],"name":n.get("name",""),"name_en":n.get("name_en",""),"file":f})
    
    if ss_nodes:
        texts = []
        for pp in us_ss_pdfs:
            t = extract_text(pp)
            if t and len(t) > 100:
                texts.append(t)
        if texts:
            fill(ss_nodes, "\n\n---\n\n".join(texts)[:18000], "US/SS-History")


# ============================================================
# FINAL STATS
# ============================================================
print("\n" + "=" * 60)
print("FINAL COVERAGE")
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
print("Done!")
