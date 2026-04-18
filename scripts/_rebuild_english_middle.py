#!/usr/bin/env python3
"""批次2-2：初中英语按 2022 版英语课标重构"""
import json
from pathlib import Path

p = Path('data/trees/english-middle.json')
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

# 语音与词汇
phonics_vocab = {
    'id': 'phonics', 'name': '语音与拼写', 'color': '#f43f5e',
    'nodes': [
        pick('eng-m-ipa-transcription',      [], 7, name='国际音标（IPA）'),
    ]
}

vocabulary = {
    'id': 'vocabulary', 'name': '词汇与语块', 'color': '#f59e0b',
    'nodes': [
        pick('eng-m-curriculum-vocabulary',  [], 7, name='课标核心词汇（1600词）'),
        pick('eng-m-word-formation-en',      ['eng-m-curriculum-vocabulary'], 8, name='构词法（前缀/后缀/合成）'),
        pick('eng-m-theme-vocabulary',       ['eng-m-curriculum-vocabulary'], 8, name='主题词汇（校园/家庭/社会/自然）'),
        pick('eng-m-phrasal-verbs',          ['eng-m-word-formation-en', 'eng-m-theme-vocabulary'], 9, name='动词短语'),
    ]
}

# 语法（时态优先，然后从句）
grammar = {
    'id': 'grammar', 'name': '语法与句法', 'color': '#8b5cf6',
    'nodes': [
        pick('eng-m-nouns-articles',         ['eng-m-curriculum-vocabulary'], 7, name='名词、代词与冠词'),
        pick('eng-m-tenses-present',         ['eng-m-nouns-articles'], 7, name='一般现在时与现在进行时'),
        pick('eng-m-tenses-past',            ['eng-m-tenses-present'], 7, name='一般过去时与过去进行时'),
        pick('eng-m-tenses-future',          ['eng-m-tenses-present'], 8, name='一般将来时与过去将来时'),
        pick('eng-m-modal-verbs',            ['eng-m-tenses-present'], 8, name='情态动词（can/may/must/should）'),
        pick('eng-m-tenses-perfect',         ['eng-m-tenses-past', 'eng-m-tenses-future'], 8, name='现在完成时与过去完成时'),
        pick('eng-m-passive-voice',          ['eng-m-tenses-perfect', 'eng-m-modal-verbs'], 8, name='被动语态'),
        pick('eng-m-sentence-patterns',      ['eng-m-tenses-perfect'], 8, name='基本句型与复合句'),
        pick('eng-m-object-clause',          ['eng-m-sentence-patterns'], 8, name='宾语从句'),
        pick('eng-m-attributive-clause',     ['eng-m-sentence-patterns'], 9, name='定语从句'),
        pick('eng-m-adverbial-clause',       ['eng-m-sentence-patterns'], 9, name='状语从句'),
    ]
}

# 语篇与读写
reading_writing = {
    'id': 'reading-writing', 'name': '语篇理解与书面表达', 'color': '#10b981',
    'nodes': [
        pick('eng-m-reading-strategies',     ['eng-m-theme-vocabulary', 'eng-m-tenses-present'], 7, name='阅读策略（略读/扫读/精读）'),
        pick('eng-m-text-types',             ['eng-m-reading-strategies'], 8, name='语篇类型识别（记叙/说明/议论）'),
        pick('eng-m-cloze-test',             ['eng-m-reading-strategies', 'eng-m-word-formation-en'], 8, name='完形填空'),
        pick('eng-m-basic-writing',          ['eng-m-text-types', 'eng-m-tenses-perfect', 'eng-m-passive-voice'], 9, name='基础写作（短文/书信/邮件）'),
    ]
}

# 听说
listening_speaking = {
    'id': 'communication', 'name': '听说交流', 'color': '#f97316',
    'nodes': [
        pick('eng-m-listening-basic',        ['eng-m-theme-vocabulary'], 7, name='基础听力（对话/短文）'),
        pick('eng-m-listening-long',         ['eng-m-listening-basic', 'eng-m-text-types'], 8, name='长对话与语段听力'),
        pick('eng-m-oral-topic',             ['eng-m-listening-long', 'eng-m-sentence-patterns'], 9, name='话题口语表达'),
    ]
}

new_domains = []
for d in [phonics_vocab, vocabulary, grammar, reading_writing, listening_speaking]:
    d['nodes'] = [n for n in d['nodes'] if n is not None]
    new_domains.append(d)

t['domains'] = new_domains
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)

print(f"✅ 初中英语重构：{len(new_domains)} 域")
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
