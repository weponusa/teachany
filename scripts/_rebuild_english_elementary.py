#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批次1-2：小学英语按 2022 版义务教育英语课标重构
主题组织：语音 / 词汇 / 语法 / 语篇（对话与阅读）/ 写作 / 听说"""
import json
from pathlib import Path

p = Path('data/trees/english-elementary.json')
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

# 域1：语音与自然拼读（字母 → 音素 → 拼读）
phonics = {
    'id': 'phonics', 'name': '语音与自然拼读', 'color': '#f43f5e',
    'nodes': [
        pick('eng-e-alphabet',                 [], 3, name='26个英文字母'),
        pick('eng-e-consonant-sounds',         ['eng-e-alphabet'], 3, name='辅音音素'),
        pick('eng-e-vowel-sounds',             ['eng-e-alphabet'], 3, name='元音音素'),
        pick('eng-e-phonics-consonants',       ['eng-e-consonant-sounds'], 3, name='辅音字母组合拼读'),
        pick('eng-e-phonics-vowels',           ['eng-e-vowel-sounds'], 4, name='元音字母组合拼读'),
        pick('eng-e-phonics-rules',            ['eng-e-phonics-consonants', 'eng-e-phonics-vowels'], 4, name='自然拼读基本规律'),
        pick('eng-e-phonics-blends',           ['eng-e-phonics-rules'], 4, name='辅元混合拼读'),
        pick('eng-e-word-reading',             ['eng-e-phonics-blends'], 5, name='单词见字读音'),
    ]
}

# 域2：词汇（按课标 600 词，按话题渐进）
vocabulary = {
    'id': 'vocabulary', 'name': '词汇', 'color': '#f59e0b',
    'nodes': [
        pick('eng-e-numbers-colors',           ['eng-e-alphabet'], 3, name='数字与颜色'),
        pick('eng-e-vocab-family-school',      ['eng-e-phonics-rules'], 3, name='家庭与校园词汇'),
        pick('eng-e-vocab-daily-life',         ['eng-e-vocab-family-school'], 4, name='日常生活词汇'),
        pick('eng-e-vocab-nature-society',     ['eng-e-vocab-daily-life'], 5, name='自然与社会词汇'),
        pick('eng-e-vocab-600-words',          ['eng-e-vocab-nature-society'], 6, name='小学 600 词累积'),
    ]
}

# 域3：语法
grammar = {
    'id': 'grammar', 'name': '语法', 'color': '#8b5cf6',
    'nodes': [
        pick('eng-e-nouns-articles',           ['eng-e-vocab-family-school'], 3, name='名词与冠词 a/an/the'),
        pick('eng-e-pronouns-be-verbs',        ['eng-e-nouns-articles'], 3, name='人称代词与 be 动词'),
        pick('eng-e-prepositions',             ['eng-e-nouns-articles'], 4, name='方位介词'),
        pick('eng-e-there-be',                 ['eng-e-pronouns-be-verbs', 'eng-e-prepositions'], 4, name='There be 句型'),
        pick('eng-e-present-simple',           ['eng-e-pronouns-be-verbs'], 4, name='一般现在时'),
        pick('eng-e-present-continuous',       ['eng-e-present-simple'], 5, name='现在进行时'),
        pick('eng-e-past-simple',              ['eng-e-present-simple'], 5, name='一般过去时'),
        pick('eng-e-future-simple',            ['eng-e-present-continuous', 'eng-e-past-simple'], 6, name='一般将来时'),
        pick('eng-e-tenses-primary',           ['eng-e-future-simple'], 6, name='小学阶段时态综合'),
        pick('eng-e-simple-sentences',         ['eng-e-pronouns-be-verbs'], 3, name='简单句结构'),
    ]
}

# 域4：语篇与阅读（对话 + 阅读）
reading = {
    'id': 'reading-writing', 'name': '语篇与阅读', 'color': '#10b981',
    'nodes': [
        pick('eng-e-greetings-classroom',      ['eng-e-alphabet'], 3, name='课堂用语与问候语'),
        pick('eng-e-greetings-intro',          ['eng-e-pronouns-be-verbs'], 3, name='打招呼与自我介绍'),
        pick('eng-e-daily-topics-basic',       ['eng-e-greetings-intro'], 4, name='日常话题简单对话'),
        pick('eng-e-asking-directions',        ['eng-e-prepositions', 'eng-e-daily-topics-basic'], 4, name='问路与指路'),
        pick('eng-e-topic-conversation',       ['eng-e-asking-directions'], 5, name='话题式对话'),
        pick('eng-e-short-passage',            ['eng-e-vocab-daily-life', 'eng-e-present-simple'], 4, name='简单语篇阅读'),
        pick('eng-e-passage-questions',        ['eng-e-short-passage'], 5, name='语篇理解答题'),
        pick('eng-e-reading-skills-primary',   ['eng-e-passage-questions'], 5, name='小学阅读技能'),
        pick('eng-e-story-retelling',          ['eng-e-topic-conversation', 'eng-e-reading-skills-primary'], 6, name='故事复述'),
    ]
}

# 域5：写作
writing = {
    'id': 'writing', 'name': '写作', 'color': '#ec4899',
    'nodes': [
        pick('eng-e-simple-writing',           ['eng-e-passage-questions', 'eng-e-future-simple'], 6, name='看图写话与简单作文'),
        pick('eng-e-writing-skills-primary',   ['eng-e-simple-writing'], 6, name='小学写作技能'),
    ]
}

# 域6：听说
listening_speaking = {
    'id': 'listening-speaking', 'name': '听说', 'color': '#f97316',
    'nodes': [
        pick('eng-e-listening-speaking',       ['eng-e-greetings-intro'], '3-6', name='听说训练综合'),
    ]
}

new_domains = []
for d in [phonics, vocabulary, grammar, reading, writing, listening_speaking]:
    d['nodes'] = [n for n in d['nodes'] if n is not None]
    new_domains.append(d)

t['domains'] = new_domains
with open(p, 'w', encoding='utf-8') as f:
    json.dump(t, f, ensure_ascii=False, indent=2)

print(f"✅ 小学英语重构：{len(new_domains)} 域")
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
