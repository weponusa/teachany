#!/usr/bin/env python3
"""Fill Cambridge Primary Science + remaining subjects."""
import json, glob, os, re, time, pdfplumber, requests

PARATERA_KEY = "sk-Ye5gTEaDbjlXaM2BlZGcjg"
URL = "https://llmapi.paratera.com/v1/chat/completions"

def call_llm(prompt):
    r = requests.post(URL,
        headers={"Authorization":"Bearer "+PARATERA_KEY,"Content-Type":"application/json"},
        json={"model":"DeepSeek-V3.2","messages":[{"role":"user","content":prompt}],
             "max_tokens":4096,"temperature":0.1}, timeout=300)
    if not r.ok:
        raise RuntimeError("{}: {}".format(r.status_code, r.text[:300]))
    return r.json()["choices"][0]["message"]["content"]

def fill(nodes, text, tag):
    nl = "\n".join("{} | {}".format(n.get("name_en") or n.get("name", ""), n["id"]) for n in nodes)
    prompt_lines = [
        "You are a curriculum expert for {}.".format(tag),
        "",
        "Below is official curriculum learning objectives/standards.",
        "For EACH knowledge point, find the most relevant matching objective.",
        "",
        'Return ONLY valid JSON: {"node_id": ["exact objective text"]}',
        'Use the node_id (like "math-cam-primary-fractions") as the JSON key.',
        "Use [] for no match. Output ALL {} entries.".format(len(nodes)),
        "",
        "{} ({} pts):".format(tag, len(nodes)),
        nl,
        "",
        "Curriculum:",
        text,
    ]
    prompt = "\n".join(prompt_lines)
    print("\n[" + tag + "] (" + str(len(nodes)) + "pts txt=" + str(len(text)) + ")", end="", flush=True)
    try:
        raw = call_llm(prompt)
        c = re.sub(r"^```json|^```|```$", "", raw.strip(), flags=re.MULTILINE).strip()
        si = c.find("{")
        ei = c.rfind("}") + 1
        if si >= 0 and ei > si:
            result = json.loads(c[si:ei])
        else:
            result = {}
        
        filled = 0
        for n in nodes:
            cps = result.get(n["id"], [])
            good = [x.strip() for x in cps if x.strip() and len(x.strip()) > 8]
            if good:
                td = json.load(open(n["file"]))
                for dom in td.get("domains", []):
                    for nd in dom.get("nodes", []):
                        if nd["id"] == n["id"]:
                            nd["curriculum_points"] = good
                            break
                    else:
                        continue
                    break
                else:
                    continue
                with open(n["file"], "w") as fo:
                    json.dump(td, fo, ensure_ascii=False, indent=2)
                filled += 1
        print(" -> OK {}/{}".format(filled, len(nodes)))
        
        # Show samples
        sc = 0
        for nid, cp in list(result.items()):
            if any(len(x) > 10 for x in cp):
                print("   [{}] {}".format(nid, str(cp[0])[:100]))
                sc += 1
                if sc >= 2:
                    break
        return filled
    except Exception as e:
        print(" -> FAIL {}".format(e))
        return 0

# ================================================================
# 1. Cambridge Primary Science (32 pages, full framework available)
# ================================================================
fp_pri_sci = "/Users/wepon/CodeBuddy/一次函数/books/国际课标/Cambridge/Primary/Primary_Science_Framework.pdf"
if os.path.exists(fp_pri_sci):
    with pdfplumber.open(fp_pri_sci) as pdf:
        all_text = ""
        for p in pdf.pages:
            all_text += (p.extract_text() or "") + "\n"
    
    # Find where Stage 1 learning objectives start (pos ~26663)
    start = all_text.find("Overview of learning objectives", 25000)
    if start < 0:
        start = all_text.find("Stage 1 Thinking", 26000)
    if start < 0:
        start = 25500
    # Take a big chunk covering Stages 1-6
    sci_text = all_text[start:start+25000]
    
    nodes = []
    for f in sorted(glob.glob("data/trees/cambridge/primary/science.json")):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                if not n.get("curriculum_points"):
                    nodes.append({"id": n["id"], "name": n.get("name", ""),
                                  "name_en": n.get("name_en", ""), "file": f})
    
    if nodes and sci_text:
        fill(nodes, sci_text, "CamPri Science")
        time.sleep(2)

# ================================================================
# 2. LS Science - try comprehensive PDF which covers science too
# ================================================================
fp_ls_comp = "/Users/wepon/CodeBuddy/一次函数/books/国际课标/Cambridge/LowerSecondary/LS_Comprehensive.pdf"
if os.path.exists(fp_ls_comp):
    with pdfplumber.open(fp_ls_comp) as pdf:
        ls_all = ""
        for p in pdf.pages:
            ls_all += (p.extract_text() or "") + "\n"
    
    # Find science section
    sci_start = ls_all.find("Science")
    # Try multiple markers
    for marker in ["Scientific enquiry", "Biology ", "Chemistry ", "Physics ", 
                    "science curriculum", "Stage 7", "Stage 9"]:
        pos = ls_all.find(marker, 5000)
        if pos > 0:
            sci_start = min(sci_start, pos) if sci_start > 0 else pos
    
    if sci_start > 5000:
        ls_sci_text = ls_all[sci_start:sci_start+18000]
    else:
        ls_sci_text = ls_all[-18000:]
    
    nodes = []
    for f in sorted(glob.glob("data/trees/cambridge/lsec/science.json")):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                if not n.get("curriculum_points"):
                    nodes.append({"id": n["id"], "name": n.get("name", ""),
                                  "name_en": n.get("name_en", ""), "file": f})
    
    if nodes and len(ls_sci_text) > 500:
        fill(nodes, ls_sci_text, "CamLS Science (from Comprehensive)")
        time.sleep(2)

# ================================================================
# FINAL COVERAGE
# ================================================================
print("\n=== FINAL COVERAGE ===")
for curr in ["cn", "ap", "cambridge", "ib", "us"]:
    t = w = 0
    for f in glob.glob("data/trees/" + curr + "/**/*.json", recursive=True):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                t += 1
                if n.get("curriculum_points"):
                    w += 1
    pct = w * 100.0 / t if t else 0
    print("{:12s} {:4d} cp={:4d} {:.1f}%".format(curr, t, w, pct))
