#!/usr/bin/env python3
"""批次2-3：高中语文按 2017 修订 2020 版高中语文课标重构"""
import json
from pathlib import Path

p = Path('data/trees/chinese-high.json')
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

# 域1：语言文字运用
language_use = {
    'id': 'language-use-h', 'name': '语言文字运用', 'color': '#06b6d4',
    'nodes': [
        pick('chn-h-idiom-usage-h',            [], 10, name='成语辨析与运用'),
        pick('chn-h-sentence-revision-h',      ['chn-h-idiom-usage-h'], 10, name='病句修改与句式变换'),
        pick('chn-h-language-expression-h',    ['chn-h-sentence-revision-h'], 11, name='语言表达简明连贯得体'),
    ]
}

# 域2：现代文阅读
modern_reading = {
    'id': 'modern-reading-h', 'name': '现代文阅读', 'color': '#10b981',
    'nodes': [
        pick('chn-h-info-reading',             [], 10, name='实用类文本（论述类/信息类）'),
        pick('chn-h-literary-reading-h',       ['chn-h-info-reading'], 10, name='文学类文本阅读'),
        pick('chn-h-practical-reading',        ['chn-h-info-reading'], 10, name='非连续性实用文本'),
        pick('chn-h-literary-deep-analysis',   ['chn-h-literary-reading-h', 'chn-h-practical-reading'], 11, name='文学类深度鉴赏'),
    ]
}

# 域3：古诗文阅读（合并 classical-chinese + classical-chinese-h + poetry-h）
classical = {
    'id': 'classical-chinese-h', 'name': '古诗文阅读', 'color': '#a855f7',
    'nodes': [
        pick('chn-h-classical-vocab-h',        [], 10, name='文言实词'),
        pick('chn-h-classical-function-words', ['chn-h-classical-vocab-h'], 10, name='文言虚词'),
        pick('chn-h-classical-grammar-h',      ['chn-h-classical-function-words'], 10, name='文言句式与语法'),
        pick('chn-h-classical-translation-h',  ['chn-h-classical-grammar-h'], 11, name='文言文翻译'),
        pick('chn-h-classical-prose-advanced', ['chn-h-classical-translation-h'], 11, name='古文经典精读'),
        pick('chn-h-classical-comprehensive',  ['chn-h-classical-prose-advanced'], 12, name='文言文综合鉴赏'),
        pick('chn-h-poetry-imagery-h',         ['chn-h-classical-vocab-h'], 10, name='古诗词意象与意境'),
        pick('chn-h-poetry-expression-h',      ['chn-h-poetry-imagery-h'], 10, name='古诗词表现手法'),
        pick('chn-h-poetry-emotion',           ['chn-h-poetry-expression-h'], 11, name='古诗词情感主旨'),
        pick('chn-h-poetry-comparison-h',      ['chn-h-poetry-emotion'], 12, name='古诗词比较阅读'),
    ]
}

# 域4：写作
writing = {
    'id': 'writing-h', 'name': '写作', 'color': '#ec4899',
    'nodes': [
        pick('chn-h-essay-structure-h',        [], 10, name='作文审题立意与结构'),
        pick('chn-h-argumentative-essay',      ['chn-h-essay-structure-h', 'chn-h-info-reading'], 10, name='议论文写作'),
        pick('chn-h-advanced-composition',     ['chn-h-argumentative-essay'], 11, name='高级写作技巧'),
        pick('chn-h-task-driven-writing',      ['chn-h-advanced-composition'], 11, name='任务驱动型作文'),
        pick('chn-h-gaokao-essay',             ['chn-h-task-driven-writing'], 12, name='高考作文综合训练'),
    ]
}

# 域5：整本书阅读
whole_book = {
    'id': 'famous-works-h', 'name': '整本书阅读', 'color': '#f59e0b',
    'nodes': [
        pick('chn-h-countryside-china',        ['chn-h-info-reading'], 10, name='《乡土中国》（学术论著阅读）'),
        pick('chn-h-red-chamber',              ['chn-h-countryside-china', 'chn-h-literary-reading-h'], 11, name='《红楼梦》（长篇小说阅读）'),
        pick('chn-h-foreign-classics',         ['chn-h-red-chamber'], 12, name='外国文学经典'),
    ]
}

new_domains = []
for d in [language_use, modern_reading, classical, writing, whole_book]:
    d['nodes'] = [n for n in d['nodes'] if n is not None]
    new_domains.append(d)

t['domains'] = new_domains
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)

print(f"✅ 高中语文重构：{len(new_domains)} 域")
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
