#!/usr/bin/env python3
import json, glob, os, requests, re, time

GEMINI_KEY = "AIzaSyCJd7qZoi6g3WEa6yzfujSsc0KtgXoOL-M"
GURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
PKEY = "sk-Ye5gTEaDbjlXaM2BlZGcjg"
PURL = "https://llmapi.paratera.com/v1/chat/completions"

md = open('/Users/wepon/CodeBuddy/一次函数/books/课标-整理版/us/common-core-math.md').read()
k5s = md.find('Kindergarten', 22600); k5e = md.find('Grade 6', k5s+100) if md.find('Grade 6', k5s+100)>0 else len(md)
mks = md[k5s:k5e] if k5e>0 else ""
ms_s = md.find('Grade 6'); mse = md.find('High School')
mms = md[ms_s:mse] if mse>0 else ""
hsb = md[mse:] if mse>0 else ""
hm = re.search(r'N[-.]?RN\.A\.', hsb)
mhs = hsb[hm.start()-200:hm.start()+5000] if hm else (hsb[:15000] if hsb else "")

ela = open('/Users/wepon/CodeBuddy/一次函数/books/课标-整理版/us/common-core-ela.md').read()
e5e = ela.find('Grade 6', 50000); ek5 = ela[:max(e5e,1)]
ems = ela.find('Grade 6') if ela.find('Grade 6')>0 else 50000; eme = ela.find('High School') if ela.find('High School')>0 else len(ela)
ems = ela[ems:eme] if eme>0 else ela[ems:ems+50000]
ehs = ela[max(eme,50000):]

ngss = open('/Users/wepon/CodeBuddy/一次函数/books/课标-整理版/us/ngss.md').read()
nhs = ngss[400000:600000]; nms = ngss[200000:350000]; nk5 = ngss[:100000]

tm = {
    ('math','k5'): mks, ('math','ms'): mms, ('math','hs'): mhs,
    ('algebra','hs'): mhs, ('geometry','hs'): mhs, ('precalc','hs'): mhs,
    ('ela','k5'): ek5, ('ela','ms'): ems, ('ela','hs'): ehs,
    ('biology','hs'): nhs[:12000], ('chemistry','hs'): nhs[:12000],
    ('physics','hs'): nhs[:12000], ('science','k5'): nk5,
    ('science','ms'): nms, ('science','hs'): nhs,
}

bk = {}
for f in sorted(glob.glob('data/trees/us/**/*.json', recursive=True)):
    d = json.load(open(f))
    st = f.split('/')[3] if '/' in f else ''
    sj = os.path.splitext(os.path.basename(f))[0]
    for dom in d.get('domains', []):
        for n in dom.get('nodes', []):
            if not n.get('curriculum_points'):
                bk.setdefault((sj,st),[]).append({'id':n['id'],'name':n.get('name',''),'ne':n.get('name_en',''),'file':f})

print(f"Remaining: {sum(len(v) for v in bk.values())}")
tot=0

for (sj,st), nodes in sorted(bk.items()):
    text = tm.get((sj,st),'')
    if not text or len(text)<200:
        print(f"SKIP [{sj}/{st}]"); continue
    nl = "\n".join(f"{n['id']}|{n['ne'] or n['name']}" for n in nodes[:45])
    is_s = sj in ('bio','chem','phys','science')
    sn = {"bio":"Biology(NGSS)","chem":"Chemistry(NGSS)","phys":"Physics(NGSS)","science":"Science(NGSS)",
          "math":"Mathematics","algebra":"Algebra","geometry":"Geometry","precalc":"Precalculus",
          "ela":"English Language Arts"}.get(sj,sj)
    prompt = (f"You are a US CCSS/NGSS expert. Extract exact standard clauses for each point.\n"
             f"Output pure JSON: {{\"node_id\":[\"full standard with code + description\"]}}\n\n{sn} - {st.upper()} ({len(nodes)}):\n{nl}\n\nCurriculum:\n{text[:13000]}")
    
    tag=f"[{sj}/{st}] ({len(nodes)}pts)"
    print(f"\n📡 {tag} txt={len(text)}")
    try:
        r=requests.post(PURL, headers={"Authorization":f"Bearer {PKEY}","Content-Type":"application/json"},
            json={"model":"DeepSeek-V3.2","messages":[{"role":"user","content":prompt}],
                "max_tokens":4096,"temperature":0.1},timeout=120)
        if not r.ok: raise RuntimeError(f"P {r.status_code}: {r.text[:300]}")
        raw=r.json()["choices"][0]["message"]["content"]
        cl=re.sub(r'^```json|^```|```$','',raw.strip(),flags=re.MULTILINE).strip()
        si=cl.find('{'); ei=cl.rfind('}')+1
        res=json.loads(cl[si:ei]) if si>=0 and ei>si else {}
        fl=0
        for n in nodes:
            cps=res.get(n['id'],[])
            good=[c.strip() for c in cps if c.strip() and len(c.strip())>12]
            if good:
                td=json.load(open(n['file'])); ch=False
                for dom in td.get('domains',[]):
                    for nd in dom.get('nodes',[]):
                        if nd['id']==n['id']: nd['curriculum_points']=good; ch=True; break
                    if ch: break
                with open(n['file'],'w') as fo: json.dump(td,fo,ensure_ascii=False,indent=2); fl+=1
        tot+=fl; print(f"  OK {fl}/{len(nodes)}")
        sc=0
        for nid,cp in list(res.items()):
            if any(len(c)>12 for c in cp):
                print(f"  [{nid}] {cp[0][:90]}"); sc+=1
                if sc>=2: break
    except Exception as e: print(f"  FAIL {e}")
    time.sleep(1)

print(f"\n=== DONE: {tot} / {sum(len(v) for v in bk.values())} ===")
