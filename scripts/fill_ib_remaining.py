#!/usr/bin/env python3
"""Fill remaining IB + Cambridge gaps using LLM knowledge (no PDF available)."""
import json, glob, os, re, time, requests

PARATERA_KEY = "sk-Ye5gTEaDbjlXaM2BlZGcjg"
URL = "https://llmapi.paratera.com/v1/chat/completions"

def call_llm(prompt):
    r = requests.post(URL,
        headers={"Authorization":"Bearer "+PARATERA_KEY,"Content-Type":"application/json"},
        json={"model":"DeepSeek-V3.2","messages":[{"role":"user","content":prompt}],
             "max_tokens":4096,"temperature":0.1}, timeout=180)
    if not r.ok:
        raise RuntimeError("{}: {}".format(r.status_code, r.text[:300]))
    return r.json()["choices"][0]["message"]["content"]

def fill(nodes, tag, context_info=""):
    nl = "\n".join(
        "{} | {} | {}".format(
            n.get("name_en") or n.get("name", ""),
            n["id"],
            n.get("description", "")[:80] if n.get("description") else ""
        ) for n in nodes
    )
    
    prompt_lines = [
        "You are an expert on {}.".format(tag),
        "",
        "Below is a list of knowledge points from an educational curriculum tree.",
        "For EACH point, generate 1-2 concise curriculum standard statements or learning objectives",
        "that would appear in the official {} document.".format(tag),
        "",
        "Rules:",
        "- Each statement should be specific, actionable, and educationally appropriate",
        "- Use formal curriculum language (e.g., 'Students will be able to...')",
        "- Include grade/level indicators where relevant",
        "- Reference official terminology where possible",
        "",
        'Output STRICT JSON: {"node_id": ["statement 1", "statement 2"]}',
        "Use [] if unknown. Output ALL {} entries.".format(len(nodes)),
        "",
        "{} ({} pts):".format(tag, len(nodes)),
        nl,
    ]
    if context_info:
        prompt_lines.extend(["", "Context:", context_info])
    
    prompt = "\n".join(prompt_lines)
    
    print("\n[{}] ({}pts)".format(tag, len(nodes)), end="", flush=True)
    try:
        raw = call_llm(prompt)
        c = re.sub(r"^```json|^```|```$", "", raw.strip(), flags=re.MULTILINE).strip()
        si = c.find("{")
        ei = c.rfind("}") + 1
        result = json.loads(c[si:ei]) if si >= 0 and ei > si else {}
        
        filled = 0
        for n in nodes:
            cps = result.get(n["id"], [])
            good = [x.strip() for x in cps if x.strip() and len(x.strip()) > 10]
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

total = 0

# ================================================================
# 1. IB PYP - all 6 transdisciplinary themes
# ================================================================
pyp_themes = [
    ("who-we-are", "IB PYP Transdisciplinary Theme: Who We Are - inquiry into self, beliefs, health, human relationships"),
    ("where-we-are", "IB PYP Transdisciplinary Theme: Where We Are in Place and Time - orientation in place/time, personal histories, discoveries"),
    ("how-we-express", "IB PYP Transdisciplinary Theme: How We Express Ourselves - creativity, expression, arts, culture"),
    ("how-world-works", "IB PYP Transdisciplinary Theme: How the World Works - natural world, scientific principles, laws of nature"),
    ("how-we-organize", "IB PYP Transdisciplinary Theme: How We Organize Ourselves - systems, communities, economic activities, governance"),
    ("sharing-planet", "IB PYP Transdisciplinary Theme: Sharing the Planet - rights, peace, conflict resolution, resources, environment"),
]

for theme_id, theme_desc in pyp_themes:
    nodes = []
    fpath = "data/trees/ib/pyp/{}.json".format(theme_id)
    for f in sorted(glob.glob(fpath)):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                if not n.get("curriculum_points"):
                    nodes.append({
                        "id": n["id"], "name": n.get("name", ""),
                        "name_en": n.get("name_en", ""), 
                        "description": n.get("description", ""),
                        "file": f
                    })
    if nodes:
        total += fill(nodes, "IBPYP {}".format(theme_id.replace("-", " ").title()), theme_desc)
        time.sleep(1)

# ================================================================
# 2. MYP subjects without PDFs (use LLM knowledge)
# ================================================================
myp_subjects = [
    ("arts", "IBMYP Arts (Visual Art, Drama, Music, Media) - creative expression, aesthetic appreciation"),
    ("design", "IBMYP Design - design cycle, inquiry, problem-solving, practical creation"),
    ("sciences", "IBMYP Sciences (Biology, Chemistry, Physics) - scientific method, real-world application"),
]

for subj, desc in myp_subjects:
    nodes = []
    for f in sorted(glob.glob("data/trees/ib/myp/{}.json".format(subj))):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                if not n.get("curriculum_points"):
                    nodes.append({
                        "id": n["id"], "name": n.get("name", ""),
                        "name_en": n.get("name_en", ""),
                        "file": f
                    })
    if nodes:
        total += fill(nodes, "IBMYP {}".format(subj.title()), desc)
        time.sleep(1)

# ================================================================
# 3. DP subjects without PDFs
# ================================================================
dp_subjects = [
    ("economics", "IBDP Economics - micro/macro economics, global economy, economic theories"),
    ("history", "IBDP History - historical investigation, causes/effects, perspectives, interpretations"),
    ("english-a", "IBDP English A Language & Literature - textual analysis, literary criticism, language in cultural context"),
    ("tok", "IBDP Theory of Knowledge - areas of knowledge, ways of knowing, knowledge questions, critical thinking"),
    ("cas", "IBDP Creativity Activity Service - experiential learning, reflection, personal growth"),
    ("ee", "IBDP Extended Essay - research skills, academic writing, independent investigation"),
]

for subj, desc in dp_subjects:
    nodes = []
    for f in sorted(glob.glob("data/trees/ib/dp/{}.json".format(subj))):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                if not n.get("curriculum_points"):
                    nodes.append({
                        "id": n["id"], "name": n.get("name", ""),
                        "name_en": n.get("name_en", ""),
                        "file": f
                    })
    if nodes:
        total += fill(nodes, "IBDP {}".format(subj.upper()), desc)
        time.sleep(1)

# ================================================================
# FINAL COVERAGE
# ================================================================
print("\n=== TOTAL FILLED THIS ROUND: {} ===".format(total))
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
