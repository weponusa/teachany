#!/usr/bin/env python3
import json, glob, os, requests, re, base64, time

GEMINI_KEY = "AIzaSyCJd7qZoi6g3WEa6yzfujSsc0KtgXoOL-M"
URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

def call_gem(pdf_path, prompt):
    with open(pdf_path,"rb") as f: b64 = base64.b64encode(f.read()).decode()
    payload = {
        "contents": [{"parts": [
            {"inline_data": {"mime_type": "application/pdf", "data": b64}},
            {"text": prompt}
        ]}],
        "generationConfig": {"maxOutputTokens": 8192, "temperature": 0.1}
    }
    r = requests.post(f"{URL}?key={GEMINI_KEY}",
        headers={"Content-Type": "application/json"},
        data=json.dumps(payload).encode(),
        timeout=300)
    if not r.ok:
        raise RuntimeError(f"Gemini {r.status_code}: {r.text[:300]}")
    c = r.json()["candidates"][0]["content"]
    return c["parts"][0]["text"] if "parts" in c else str(c)

# ── collect missing nodes by (subject, stage) ──
by_key = {}
for f in sorted(glob.glob('data/trees/us/**/*.json', recursive=True)):
    d = json.load(open(f))
    parts = f.split('/')
    if len(parts) < 5: continue
    stage = parts[3]
    subj = os.path.splitext(parts[4])[0]
    for dom in d.get('domains', []):
        for n in dom.get('nodes', []):
            if not n.get('curriculum_points'):
                by_key.setdefault((subj, stage), []).append(
                    {'id': n['id'], 'name': n.get('name',''), 'name_en': n.get('name_en',''), 'file': f})

print(f"Total missing: {sum(len(v) for v in by_key.values())}")

# ── PDF mapping: (subject, stage) -> pdf filename ──
pdf_base = "/Users/wepon/CodeBuddy/一次函数/books/课标-整理版/us"
pm = {
    ('math','k5'): 'common-core-math.pdf',
    ('math','ms'): 'common-core-math.pdf',
    ('math','hs'): 'common-core-math.pdf',
    ('algebra','hs'): 'common-core-math.pdf',
    ('geometry','hs'): 'common-core-math.pdf',
    ('precalc','hs'): 'common-core-math.pdf',
    ('ela','k5'): 'common-core-ela.pdf',
    ('ela','ms'): 'common-core-ela.pdf',
    ('ela','hs'): 'common-core-ela.pdf',
    ('biology','hs'): 'ngss.pdf',
    ('chemistry','hs'): 'ngss.pdf',
    ('physics','hs'): 'ngss.pdf',
    ('science','k5'): 'ngss.pdf',
    ('science','ms'): 'ngss.pdf',
    ('science','hs'): 'ngss.pdf',
}

total_filled = 0
for (subj, stage), nodes in sorted(by_key.items()):
    pn = pm.get((subj, stage))
    fp = os.path.join(pdf_base, pn) if pn else ''
    if not fp or not os.path.exists(fp):
        print(f"\nSKIP [{subj}/{stage}]: no PDF")
        continue

    # Split into batches of 50 to avoid token limits
    batches = [nodes[i:i+50] for i in range(0, len(nodes), 50)]

    for bi, batch in enumerate(batches):
        nl = "\n".join(f"{n['id']} | {n.get('name_en','') or n['name']}" for n in batch)
        is_sci = subj in ('biology', 'chemistry', 'physics', 'science')
        stype = "NGSS Next Generation Science Standards" if is_sci else "Common Core State Standards (CCSS)"
        sname_map = {
            'math': 'Mathematics', 'algebra': 'Algebra', 'geometry': 'Geometry', 'precalc': 'Precalculus',
            'ela': 'English Language Arts & Literacy',
            'biology': 'Biology (NGSS)', 'chemistry': 'Chemistry (NGSS)',
            'physics': 'Physics (NGSS)', 'science': 'Science (NGSS)',
        }
        sname = sname_map.get(subj, subj)

        prompt = (
            f"You are a US {stype} expert.\n\n"
            f"Read this PDF carefully. For EACH knowledge point listed below,\n"
            f"extract the EXACT matching standard clause text from the PDF.\n\n"
            f"Rules:\n"
            f"- Each entry must be the COMPLETE original standard text including code and description\n"
            f"- Math/ELA format: e.g. 'CCSS.MATH.CONTENT.K.CC.A.1: Count to 100...'\n"
            f"- NGSS format: e.g. 'K-LS1-1: Use observations...'\n"
            f"- Use empty array [] if no match found\n"
            f"- Output ONLY pure JSON: {{\"node_id\": [\"full standard text\"]}}\n"
            f"- You MUST provide results for ALL {len(batch)} entries\n\n"
            f"{sname} - {stage.upper()} ({len(batch)} points):\n"
            f"{nl}\n"
        )

        tag = f"[{subj}/{stage}]#{bi+1}"
        print(f"\n{tag} ({len(batch)} nodes from {pn})")

        try:
            raw = call_gem(fp, prompt)
            cleaned = re.sub(r'^```json|^```|```$', '', raw.strip(), flags=re.MULTILINE).strip()
            s = cleaned.find('{')
            e = cleaned.rfind('}') + 1
            result = json.loads(cleaned[s:e]) if s >= 0 and e > s else {}

            filled = 0
            for n in batch:
                cps = result.get(n['id'], [])
                good = [c.strip() for c in cps if c.strip() and len(c.strip()) > 12]
                if good:
                    td = json.load(open(n['file']))
                    chg = False
                    for dom in td.get('domains', []):
                        for nd in dom.get('nodes', []):
                            if nd['id'] == n['id']:
                                nd['curriculum_points'] = good
                                chg = True; break
                        if chg:
                            break
                    if chg:
                        with open(n['file'], 'w') as fo:
                            json.dump(td, fo, ensure_ascii=False, indent=2)
                        filled += 1

            total_filled += filled
            print(f"  OK {filled}/{len(batch)}")

            # Show samples
            sc = 0
            for nid, cps in list(result.items()):
                if any(len(c) > 12 for c in cps):
                    print(f"  [{nid}] {cps[0][:90]}")
                    sc += 1
                    if sc >= 2:
                        break

        except Exception as ex:
            print(f"  FAIL {ex}")

        time.sleep(2)

print(f"\n=== DONE: total_filled={total_filled} / {sum(len(v) for v in by_key.values())} ===")
