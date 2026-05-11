#!/usr/bin/env python3
"""Fill ALL remaining IB nodes using LLM knowledge."""
import json, glob, os, re, time, requests

API_KEY = "sk-Ye5gTEaDbjlXaM2BlZGcjg"
API_URL = "https://llmapi.paratera.com/v1/chat/completions"

def call_llm(prompt):
    r = requests.post(API_URL,
        headers={"Authorization": "Bearer "+API_KEY, "Content-Type": "application/json"},
        json={"model": "DeepSeek-V3.2", "messages": [{"role": "user", "content": prompt}],
              "max_tokens": 8192, "temperature": 0.1}, timeout=300)
    if not r.ok:
        raise RuntimeError(str(r.status_code) + ": " + r.text[:300])
    return r.json()["choices"][0]["message"]["content"]

def fill(nodes, tag, context=""):
    if not nodes: return 0
    
    # Build prompt with string concatenation (avoid .format() issues)
    header = "You are an IB " + tag + " curriculum expert.\n"
    instruction = (
        "Below are knowledge points from the " + tag + " course tree.\n"
        "For EACH point, generate 1-2 official-sounding learning objectives or syllabus statements.\n"
        "Use formal IB curriculum language.\n"
        "Include subject-specific terminology and assessment objective references where appropriate.\n"
    )
    output_spec = (
        'Output ONLY valid JSON: {"node_id": ["objective1", "objective2"]}\n'
        "Use [] if unknown. Output ALL " + str(len(nodes)) + " entries.\n\n"
    )
    
    # Build node list
    node_lines = []
    for n in nodes:
        name_en = n.get("name_en") or n.get("name", "")
        node_lines.append(n["id"] + " | " + name_en)
    
    prompt_parts = [header, "", instruction, "", output_spec, "", tag + " points (" + str(len(nodes)) + "):"]
    prompt_parts.append("\n".join(node_lines))
    if context:
        prompt_parts.append(""); prompt_parts.append("Context: " + context)
    
    prompt = "\n".join(prompt_parts)
    
    print("\n[" + tag + "] (" + str(len(nodes)) + "pts)", end="", flush=True)
    
    try:
        raw = call_llm(prompt)
        # Extract JSON
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
            good = [c.strip() for c in cps if c.strip() and len(c.strip()) > 10]
            if good:
                td = json.load(open(n["file"]))
                changed = False
                for dom in td.get("domains", []):
                    for nd in dom.get("nodes", []):
                        if nd["id"] == n["id"]:
                            nd["curriculum_points"] = good
                            changed = True
                            break
                    if changed: break
                if changed:
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
# 1. IB DP: Chemistry, Math AI, EE, CAS, ToK
# ================================================================
print("=" * 60)
print("1. IB DP REMAINING")

dp_subjects = [
    ("dp/chemistry.json", "IB DP Chemistry (SL/HL core+option topics)"),
    ("dp/math-ai.json", "IB DP Math AI (SL/HL, statistics, calculus applications)"),
    ("dp/ee.json", "IB DP Extended Essay (research process, academic writing)"),
    ("dp/cas.json", "IB DP Creativity Activity Service (experiential learning, reflection)"),
    ("dp/tok.json", "IB DP Theory of Knowledge (AOK, WOK, knowledge questions)"),
]

for fpath, ctx in dp_subjects:
    nodes = []
    for f in sorted(glob.glob("data/trees/ib/" + fpath)):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                if not n.get("curriculum_points"):
                    nodes.append({"id": n["id"], "name": n.get("name", ""),
                                  "name_en": n.get("name_en", ""), "file": f})
    if nodes:
        total += fill(nodes, "DP " + fpath.replace(".json","").replace("dp/","").upper(), ctx)
        time.sleep(1)

# ================================================================
# 2. IB MYP remaining (Individuals & Societies, PE, Sciences)
# ================================================================
print("\n" + "="*60)
print("2. IB MYP REMAINING")

myp_subjects = [
    ("myp/individuals-societies.json", "IBMYP Individuals and Societies (history, geography, economics, civics)"),
    ("myp/pe.json", "IBMYP Physical and Health Education (fitness, health, wellbeing, movement)"),
    ("myp/sciences.json", "IBMYP Sciences (scientific inquiry, interdisciplinary science)"),
]

for fpath, ctx in myp_subjects:
    nodes = []
    for f in sorted(glob.glob("data/trees/ib/" + fpath)):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                if not n.get("curriculum_points"):
                    nodes.append({"id": n["id"], "name": n.get("name", ""),
                                  "name_en": n.get("name_en", ""), "file": f})
    if nodes:
        total += fill(nodes, "MYP " + fpath.replace(".json","").replace("myp/","").title(), ctx)
        time.sleep(1)

# ================================================================
# 3. IB PYP remaining (who-we-are, where-we-are, etc.)
# ================================================================
print("\n" + "="*60)
print("3. IB PYP REMAINING")

pyp_themes = [
    ("pyp/who-we-are.json", "IB PYP Who We Are (identity, beliefs, health, relationships)"),
    ("pyp/where-we-are.json", "IB PYP Where We Are (orientation in place/time, personal histories)"),
    ("pyp/how-we-express.json", "IB PYP How We Express Ourselves (creativity, expression, culture)"),
    ("pyp/how-world-works.json", "IB PYP How the World Works (scientific principles, nature, technology)"),
    ("pyp/how-we-organize.json", "IB PYP How We Organize Ourselves (systems, communities, economics, governance)"),
    ("pyp/sharing-planet.json", "IB PYP Sharing the Planet (rights, peace, resources, environment, conservation)"),
]

for fpath, ctx in pyp_themes:
    nodes = []
    for f in sorted(glob.glob("data/trees/ib/" + fpath)):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                if not n.get("curriculum_points"):
                    nodes.append({"id": n["id"], "name": n.get("name", ""),
                                  "name_en": n.get("name_en", ""), "file": f})
    if nodes:
        total += fill(nodes, "PYP " + fpath.replace(".json","").replace("pyp/","").replace("-"," ").title(), ctx)
        time.sleep(1)

# ================================================================
# FINAL COVERAGE
# ================================================================
print("\n" + "="*60)
print("TOTAL THIS ROUND: " + str(total))
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

# Grand total
t_all = w_all = 0
for curr in ["cn", "ap", "cambridge", "ib", "us"]:
    for f in glob.glob("data/trees/" + curr + "/**/*.json", recursive=True):
        d = json.load(open(f))
        for dom in d.get("domains", []):
            for n in dom.get("nodes", []):
                t_all += 1
                if n.get("curriculum_points"): w_all += 1
print("\nGrand total: " + str(w_all) + "/" + str(t_all) + " = " + "{:.1f}%".format(w_all*100.0/t_all))
