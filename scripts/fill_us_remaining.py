#!/usr/bin/env python3
"""Fill remaining US curriculum points - short text version for timeout fixes."""
import json, glob, os, requests, re, time

API_KEY = "sk-Ye5gTEaDbjlXaM2BlZGcjg"
API_URL = "https://llmapi.paratera.com/v1/chat/completions"
MODEL = "DeepSeek-V3.2"

def call_llm(prompt):
    r = requests.post(API_URL,
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
        json={"model": MODEL, "messages": [{"role": "user", "content": prompt}],
             "max_tokens": 4096, "temperature": 0.1}, timeout=180)
    if not r.ok:
        raise RuntimeError(f"Paratera {r.status_code}: {r.text[:300]}")
    return r.json()["choices"][0]["message"]["content"]

# Collect still-missing
still_missing = []
for f in sorted(glob.glob("data/trees/us/**/*.json", recursive=True)):
    d = json.load(open(f))
    stage = f.split("/")[3] if "/" in f else ""
    subj = os.path.splitext(os.path.basename(f))[0]
    for dom in d.get("domains", []):
        for n in dom.get("nodes", []):
            if not n.get("curriculum_points"):
                still_missing.append({"id": n["id"], "name": n.get("name", ""),
                    "name_en": n.get("name_en", ""), "file": f, "stage": stage, "subj": subj})

print(f"Remaining: {len(still_missing)}")

# Load source texts
md_math = open("/Users/wepon/CodeBuddy/一次函数/books/课标-整理版/us/common-core-math.md").read()
md_ela = open("/Users/wepon/CodeBuddy/一次函数/books/课标-整理版/us/common-core-ela.md").read()
md_ngss = open("/Users/wepon/CodeBuddy/一次函数/books/课标-整理版/us/ngss.md").read()

# Precise extraction per stage
def get_math(stage):
    if stage == "k5":
        s = md_math.find("Kindergarten", 22600)
        e = md_math.find("Grade 6", s + 100)
        return md_math[s:e][:8000] if e > s else md_math[s:s+8000]
    elif stage == "ms":
        s = md_math.find("Grade 6"); e = md_math.find("High School")
        return md_math[s:e][:8000] if e > s else md_math[s:s+8000]
    else:
        # HS - find actual standards after TOC
        for pat in ["N-RN.A", "A-SSE.A", "G-CO.A"]:
            m = re.search(pat, md_math[130000:])
            if m:
                start = 130000 + m.start() - 100
                return md_math[start:start+15000]
        return md_math[-15000:]

def get_ela(stage):
    if stage == "k5":
        e = md_ela.find("Grade 6", 30000)
        return md_ela[:max(e, 5000)][:8000]
    elif stage == "ms":
        s = md_ela.find("Grade 6"); e = md_ela.find("High School")
        return md_ela[s:e][:8000] if e > s else md_ela[s:s+8000]
    else:
        # find CCSS codes like RL.9-10 or RI.11-12
        for pat in ["RL.9", "RI.9", "W.9"]:
            m = re.search(pat, md_ela[40000:])
            if m:
                return md_ela[40000+m.start()-200:40000+m.start()+12000]
        return md_ela[-12000:]

def get_ngss(stage):
    if stage == "k5": return md_ngss[:8000]
    elif stage == "ms": return md_ngss[200000:208000]
    else: return md_ngss[400000:412000]

# Group by subject+stage
by_key = {}
for n in still_missing:
    by_key.setdefault((n["subj"], n["stage"]), []).append(n)

total_filled = 0

for (s, st), nodes in sorted(by_key.items()):
    # Map to text source
    if s in ("math", "algebra", "geometry", "precalc"):
        text = get_math(st)
    elif s == "ela":
        text = get_ela(st)
    elif s in ("biology", "chemistry", "physics", "science"):
        text = get_ngss(st)
    else:
        print(f"SKIP [{s}/{st}] ({len(nodes)}) no source")
        continue

    if not text or len(text) < 100:
        print(f"SKIP [{s}/{st}] text too short")
        continue

    nl = "\n".join(f"{n['id']} | {n.get('name_en','') or n['name']}" for n in nodes)

    is_sci = s in ("biology", "chemistry", "physics", "science")
    stype = "NGSS Science" if is_sci else "Common Core"

    prompt = (
        f"You are a US {stype} expert.\n\n"
        f"Extract the EXACT standard clause text for each knowledge point below from the curriculum excerpt.\n"
        f"Format: pure JSON only: {{\"node_id\": [\"full standard with code + description\"]}}\n"
        f"Use [] if no match found. Output ALL {len(nodes)} entries.\n\n"
        f"{s.upper()} [{st.upper()}] ({len(nodes)} pts):\n{nl}\n\n"
        f"Curriculum excerpt:\n{text}"
    )

    tag = f"[{s}/{st}] ({len(nodes)}pts)"
    print(f"\n{tag} txt={len(text)}", end="", flush=True)

    try:
        raw = call_llm(prompt)
        cleaned = re.sub(r"^```json|^```|```$", "", raw.strip(), flags=re.MULTILINE).strip()
        si = cleaned.find("{"); ei = cleaned.rfind("}") + 1
        result = json.loads(cleaned[si:ei]) if si >= 0 and ei > si else {}

        filled = 0
        for n in nodes:
            cps = result.get(n["id"], [])
            good = [c.strip() for c in cps if c.strip() and len(c.strip()) > 10]
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
        total_filled += filled
        print(f" -> OK {filled}/{len(nodes)}")
    except Exception as e:
        print(f" -> FAIL {e}")
    time.sleep(1.5)

print(f"\n=== DONE: {total_filled} / {len(still_missing)} ===")
