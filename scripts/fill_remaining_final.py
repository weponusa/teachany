#!/usr/bin/env python3
"""Fill ALL remaining ~36 nodes in one go, LLM fallback."""
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

def fill(nodes, context, tag):
    if not nodes: return 0
    
    # Build prompt with simple concatenation
    p = "You are a curriculum expert for " + tag + ".\n"
    p += "Below are knowledge points from the course tree.\n"
    p += "For EACH point, generate 1-2 appropriate learning objectives or syllabus statements.\n"
    p += "Use formal curriculum language. Include subject-specific terminology.\n"
    p += 'Output ONLY valid JSON: {"node_id": ["objective"]}\n'
    p += "Use [] if unknown. Output ALL " + str(len(nodes)) + " entries.\n\n"
    p += tag + " points (" + str(len(nodes)) + "):\n"
    for n in nodes:
        name = n.get("name_en") or n.get("name", "")
        p += n["id"] + " | " + name + "\n"
    if context:
        p += "\nContext: " + context + "\n"
    
    print("\n[" + tag + "] (" + str(len(nodes)) + "pts)", end="", flush=True)
    
    try:
        raw = call_llm(p)
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
# Collect ALL remaining nodes across all curricula
# ================================================================
print("=" * 60)
print("COLLECTING ALL REMAINING NODES...")
print("=" * 60)

all_remaining = {}

# Cambridge
for f in sorted(glob.glob("data/trees/cambridge/**/*.json", recursive=True)):
    d = json.load(open(f))
    parts = f.split("/")
    if len(parts) < 5: continue
    stage = parts[3]
    subj = parts[4].replace(".json", "")
    for dom in d.get("domains", []):
        for n in dom.get("nodes", []):
            if not n.get("curriculum_points"):
                key = "cam/" + stage + "/" + subj
                all_remaining.setdefault(key, []).append({
                    "id": n["id"], "name": n.get("name", ""),
                    "name_en": n.get("name_en", ""), "file": f
                })

# IB
for f in sorted(glob.glob("data/trees/ib/**/*.json", recursive=True)):
    d = json.load(open(f))
    parts = f.split("/")
    if len(parts) < 5: continue
    stage = parts[3]
    subj = parts[4].replace(".json", "")
    for dom in d.get("domains", []):
        for n in dom.get("nodes", []):
            if not n.get("curriculum_points"):
                key = "ib/" + stage + "/" + subj
                all_remaining.setdefault(key, []).append({
                    "id": n["id"], "name": n.get("name", ""),
                    "name_en": n.get("name_en", ""), "file": f
                })

# US
for f in sorted(glob.glob("data/trees/us/**/*.json", recursive=True)):
    d = json.load(open(f))
    parts = f.split("/")
    if len(parts) < 5: continue
    stage = parts[3]
    subj = parts[4].replace(".json", "")
    for dom in d.get("domains", []):
        for n in dom.get("nodes", []):
            if not n.get("curriculum_points"):
                key = "us/" + stage + "/" + subj
                all_remaining.setdefault(key, []).append({
                    "id": n["id"], "name": n.get("name", ""),
                    "name_en": n.get("name_en", ""), "file": f
                })

print("Found remaining nodes:")
for k, v in sorted(all_remaining.items()):
    print("  " + k + ": " + str(len(v)))

# ================================================================
# Fill ALL remaining nodes
# ================================================================
print("\n" + "=" * 60)
print("FILLING ALL REMAINING NODES...")
print("=" * 60)

contexts = {
    "cam": "Cambridge IGCSE/Lower Secondary/Primary curriculum",
    "ib": "IB Diploma Programme / Middle Years Programme curriculum",
    "us": "US Common Core / C3 Framework curriculum",
}

for key, nodes in sorted(all_remaining.items()):
    curr = key.split("/")[0]
    tag = key.replace("/", " ").title()
    ctx = contexts.get(curr, "")
    total += fill(nodes, ctx, tag)
    time.sleep(1)

# ================================================================
# FINAL COVERAGE
# ================================================================
print("\n" + "=" * 60)
print("TOTAL THIS ROUND: " + str(total))
print("=" * 60)
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
print("\nGrand total: " + str(w_all) + "/" + str(t_all) + " = " + "{:.2f}%".format(w_all * 100.0 / t_all))
