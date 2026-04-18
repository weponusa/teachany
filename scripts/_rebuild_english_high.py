#!/usr/bin/env python3
"""批次3-2：高中英语按 2017 修订 2020 版高中英语课标重构"""
import json
from pathlib import Path

p = Path('data/trees/english-high.json')
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

# 域1：词汇
vocab = {
    'id': 'vocabulary-h', 'name': '词汇', 'color': '#f59e0b',
    'nodes': [
        pick('eng-h-word-formation-h',        [], 10, name='构词法（派生/合成/转化）'),
        pick('eng-h-vocab-3500',              ['eng-h-word-formation-h'], 11, name='高中 3500 词汇'),
        pick('eng-h-context-vocab',           ['eng-h-vocab-3500'], 12, name='语境词义推断'),
    ]
}

# 域2：语法
grammar = {
    'id': 'grammar-h', 'name': '语法', 'color': '#8b5cf6',
    'nodes': [
        pick('eng-h-tense-system',            [], 10, name='时态与语态系统'),
        pick('eng-h-noun-clauses',            ['eng-h-tense-system'], 10, name='名词性从句'),
        pick('eng-h-attributive-clauses-h',   ['eng-h-tense-system'], 10, name='定语从句'),
        pick('eng-h-adverbial-clauses-h',     ['eng-h-tense-system'], 10, name='状语从句'),
        pick('eng-h-advanced-grammar',        ['eng-h-adverbial-clauses-h'], 10, name='语法综合进阶'),
        pick('eng-h-non-finite-h',            ['eng-h-tense-system'], 11, name='非谓语动词'),
        pick('eng-h-subjunctive-mood',        ['eng-h-noun-clauses'], 11, name='虚拟语气'),
        pick('eng-h-special-sentences',       ['eng-h-non-finite-h', 'eng-h-attributive-clauses-h'], 12, name='特殊句式（倒装/强调/省略）'),
    ]
}

# 域3：阅读理解
reading = {
    'id': 'reading-h', 'name': '阅读理解', 'color': '#10b981',
    'nodes': [
        pick('eng-h-reading-detail-h',        ['eng-h-vocab-3500'], 10, name='阅读细节题'),
        pick('eng-h-reading-inference-h',     ['eng-h-reading-detail-h'], 10, name='阅读推理题'),
        pick('eng-h-reading-purpose',         ['eng-h-reading-inference-h'], 11, name='阅读主旨与目的题'),
        pick('eng-h-reading-7-choose-5',      ['eng-h-reading-purpose'], 11, name='七选五语篇填空'),
        pick('eng-h-reading-comprehension-advanced',['eng-h-reading-7-choose-5', 'eng-h-advanced-grammar'], 12, name='高阶阅读综合'),
    ]
}

# 域4：完形填空
cloze = {
    'id': 'cloze-test', 'name': '完形填空', 'color': '#06b6d4',
    'nodes': [
        pick('eng-h-cloze-narrative',         ['eng-h-vocab-3500'], 10, name='完形填空（记叙型）'),
        pick('eng-h-cloze-comprehensive',     ['eng-h-cloze-narrative', 'eng-h-context-vocab'], 11, name='完形填空综合'),
    ]
}

# 域5：写作（应用文 + 读后续写 + 概要）
writing = {
    'id': 'writing-h-en', 'name': '写作', 'color': '#ec4899',
    'nodes': [
        pick('eng-h-application-letter',      ['eng-h-tense-system'], 10, name='应用文写作（书信/邮件）'),
        pick('eng-h-essay-writing',           ['eng-h-application-letter', 'eng-h-advanced-grammar'], 10, name='议论文/记叙文写作'),
        pick('eng-h-continuation-writing',    ['eng-h-essay-writing', 'eng-h-attributive-clauses-h'], 11, name='读后续写'),
        pick('eng-h-summary-writing',         ['eng-h-continuation-writing', 'eng-h-reading-purpose'], 12, name='概要写作'),
    ]
}

# 域6：听力
listening = {
    'id': 'listening-h', 'name': '听力', 'color': '#f97316',
    'nodes': [
        pick('eng-h-listening-short-h',       [], 10, name='短对话听力'),
        pick('eng-h-listening-long-h',        ['eng-h-listening-short-h', 'eng-h-adverbial-clauses-h'], 11, name='长对话与独白听力'),
    ]
}

new_domains = []
for d in [vocab, grammar, reading, cloze, writing, listening]:
    d['nodes'] = [n for n in d['nodes'] if n is not None]
    new_domains.append(d)

t['domains'] = new_domains
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)

print(f"✅ 高中英语重构：{len(new_domains)} 域")
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
