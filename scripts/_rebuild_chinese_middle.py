#!/usr/bin/env python3
"""批次1-3：初中语文按 2022 版义务教育语文课标重构"""
import json
from pathlib import Path

p = Path('data/trees/chinese-middle.json')
t = json.load(open(p, encoding='utf-8'))

id2node = {}
for d in t['domains']:
    for n in d['nodes']:
        id2node[n['id']] = n

def pick(nid, prereqs=None, grade=None, name=None):
    if nid not in id2node: return None
    n = dict(id2node[nid])
    if prereqs is not None: n['prerequisites'] = prereqs
    if grade is not None: n['grade'] = grade
    if name is not None: n['name'] = name
    n['extends'] = []; n['parallel'] = []
    return n

# 域1：语言文字运用（识字写字+语法修辞）
language_use = {
    'id': 'language-use', 'name': '语言文字运用', 'color': '#06b6d4',
    'nodes': [
        pick('chn-m-word-usage',               [], 7, name='词语辨析与运用'),
        pick('chn-m-sentence-components',      [], 7, name='句子成分分析'),
        pick('chn-m-rhetoric-figures',         [], 7, name='常见修辞手法'),
        pick('chn-m-rhetoric-analysis',        ['chn-m-rhetoric-figures', 'chn-m-word-usage'], 7, name='修辞手法赏析'),
        pick('chn-m-sentence-transformations-zh',['chn-m-sentence-components'], 8, name='句式变换与病句修改'),
        pick('chn-m-sentence-logic',           ['chn-m-rhetoric-analysis', 'chn-m-sentence-transformations-zh'], 8, name='句子逻辑与连贯'),
        pick('chn-m-comprehensive-language',   ['chn-m-sentence-logic'], 9, name='综合性语言运用'),
    ]
}

# 域2：现代文阅读
modern_reading = {
    'id': 'modern-reading', 'name': '现代文阅读', 'color': '#10b981',
    'nodes': [
        pick('chn-m-narrative-reading',        [], 7, name='记叙文阅读'),
        pick('chn-m-expository-reading',       ['chn-m-narrative-reading'], 7, name='说明文阅读'),
        pick('chn-m-prose-reading',            ['chn-m-narrative-reading'], 8, name='散文阅读'),
        pick('chn-m-novel-reading',            ['chn-m-narrative-reading'], 8, name='小说阅读'),
        pick('chn-m-argumentative-reading',    ['chn-m-expository-reading'], 8, name='议论文阅读'),
        pick('chn-m-literary-appreciation',    ['chn-m-argumentative-reading', 'chn-m-prose-reading', 'chn-m-novel-reading'], 9, name='文学类作品鉴赏'),
    ]
}

# 域3：古诗文阅读（合并 classical-chinese + poetry）
classical = {
    'id': 'classical-chinese', 'name': '古诗文阅读', 'color': '#a855f7',
    'nodes': [
        pick('chn-m-classical-words',          [], 7, name='文言实词与虚词'),
        pick('chn-m-classical-sentences',      ['chn-m-classical-words'], 8, name='文言特殊句式'),
        pick('chn-m-classical-translation',    ['chn-m-classical-sentences'], 8, name='文言文翻译'),
        pick('chn-m-classical-prose',          ['chn-m-classical-translation'], 8, name='经典文言文精读'),
        pick('chn-m-classical-appreciation',   ['chn-m-classical-prose'], 9, name='文言文综合鉴赏'),
        pick('chn-m-poetry-recitation',        [], 7, name='初中古诗词背诵'),
        pick('chn-m-poetry-appreciation',      ['chn-m-poetry-recitation', 'chn-m-classical-words'], 7, name='古诗词赏析入门'),
        pick('chn-m-poetry-imagery',           ['chn-m-poetry-appreciation'], 8, name='古诗词意象与意境'),
        pick('chn-m-poetry-techniques',        ['chn-m-poetry-imagery'], 8, name='古诗词表现手法'),
        pick('chn-m-poetry-comparison',        ['chn-m-poetry-techniques'], 9, name='古诗词比较阅读'),
    ]
}

# 域4：写作
writing = {
    'id': 'writing-middle', 'name': '写作', 'color': '#ec4899',
    'nodes': [
        pick('chn-m-narrative-writing-m',      [], 7, name='记叙文写作'),
        pick('chn-m-descriptive-writing',      ['chn-m-narrative-writing-m'], 7, name='描写方法与细节'),
        pick('chn-m-argumentative-writing-m',  ['chn-m-argumentative-reading', 'chn-m-descriptive-writing'], 8, name='议论文写作'),
        pick('chn-m-essay-comprehensive',      ['chn-m-argumentative-writing-m'], 9, name='综合性作文'),
    ]
}

# 域5：整本书阅读 + 名著阅读
whole_book = {
    'id': 'famous-works', 'name': '整本书阅读与名著导读', 'color': '#f59e0b',
    'nodes': [
        pick('chn-m-whole-book-reading',       ['chn-m-narrative-reading'], 7, name='整本书阅读方法'),
        pick('chn-m-journey-west',             ['chn-m-whole-book-reading'], 7, name='《西游记》'),
        pick('chn-m-erta-stories',             ['chn-m-whole-book-reading'], 7, name='《朝花夕拾》'),
        pick('chn-m-erta-tales-heroes',        ['chn-m-novel-reading'], 8, name='《骆驼祥子》/《水浒传》'),
        pick('chn-m-erta-foreign-novel',       ['chn-m-novel-reading'], 8, name='外国名著（《海底两万里》等）'),
        pick('chn-m-erta-essay-collection',    ['chn-m-poetry-comparison', 'chn-m-prose-reading'], 9, name='散文杂文集'),
        pick('chn-m-dream-red-mansions',       ['chn-m-literary-appreciation', 'chn-m-erta-tales-heroes'], 9, name='《红楼梦》选读'),
    ]
}

new_domains = []
for d in [language_use, modern_reading, classical, writing, whole_book]:
    d['nodes'] = [n for n in d['nodes'] if n is not None]
    new_domains.append(d)

t['domains'] = new_domains
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)

print(f"✅ 初中语文重构：{len(new_domains)} 域")
total = 0
for d in new_domains:
    print(f"  【{d['name']}】{len(d['nodes'])} 节点")
    total += len(d['nodes'])
print(f"节点总数：{total}")

old_ids = set(id2node.keys())
new_ids = set(n['id'] for d in new_domains for n in d['nodes'])
orphan = old_ids - new_ids
if orphan: print(f"⚠ 未分配：{orphan}")
else: print("✅ 全部节点已归位")
