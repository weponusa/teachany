#!/usr/bin/env python3
"""
TeachAny Batch 5 课件升级脚本
为 chn-e-* 文科课件补充：
  #01 ABT引入, #02 前测, #05 后测, #11 前置知识链meta,
  #17 记忆锚点, #18 易错点, #14 AI多模态互动区

目标：每个课件从 <head> 注入缺失的 meta 标签，并在 </body> 前插入缺失的 section。
"""

import re
import os
import json

BASE = "/root/.openclaw/workspace/skills/teachany/examples"

# 课件配置：id, 标题关键词, prerequisites, domain, grade, 易错点来源
COURSES = {
    "chn-e-dictionary-skills": {
        "node": "dictionary-skills", "subject": "chinese", "domain": "literacy",
        "grade": "2", "prereqs": "pinyin-reading,char-recognition",
        "title": "查字典", "emoji": "🔍",
        "abt_and": "你已经学会了拼音，认识了不少汉字",
        "abt_but": "遇到不认识的字，不知道怎么查字典",
        "abt_therefore": "今天我们学习三种查字典方法：拼音查字法、部首查字法、笔画查字法",
        "pretest_q": "查字典时，如果知道一个字的读音，最方便的方法是？",
        "pretest_opts": ["A. 拼音查字法", "B. 部首查字法", "C. 笔画查字法", "D. 不知道"],
        "pretest_ans": "A",
        "pretest_q2": "查字典时，如果不知道读音也不认识偏旁，应该用哪种方法？",
        "pretest_opts2": ["A. 拼音查字法", "B. 部首查字法", "C. 笔画查字法", "D. 随机翻"],
        "pretest_ans2": "C",
        "posttest_q": "「虹」字，你不认识它，也不确定偏旁，你会用哪种方法查字典？",
        "posttest_opts": ["A. 拼音查字法（需要认识才能用）", "B. 部首查字法（「虹」的偏旁是「虫」）", "C. 笔画查字法（数笔画查）", "D. B或C都可以"],
        "posttest_ans": "D",
        "posttest_q2": "用部首查字法查「清」，它的部首是？",
        "posttest_opts2": ["A. 氵（三点水）", "B. 月", "C. 青", "D. 土"],
        "posttest_ans2": "A",
        "memory_anchor": "🎯 查字典三兄弟口诀：<br>知音用拼音，知旁用部首，两不知数笔画",
        "error_key": "err-ue-missing-dots",
        "error_desc": "查字典时搞错部首",
        "error_wrong": "查「清」字时，认为部首是「青」",
        "error_right": "「清」的部首是「氵」（三点水），左边偏旁才是部首。查字典的关键是正确找出部首",
        "error_diag": "找部首的方法：先看左边（左偏旁），再看上边（上部），最后看外框。「清」有左偏旁「氵」，所以部首是「氵」",
        "ai_prompt": "请用图片展示你在查字典，或上传一张汉字图片，让AI帮你分析应该用哪种方法查它",
    },
    "chn-e-essay-structure": {
        "node": "essay-structure", "subject": "chinese", "domain": "writing",
        "grade": "5", "prereqs": "paragraph-writing,narrative-writing",
        "title": "作文结构", "emoji": "📝",
        "abt_and": "你已经会写句子和段落了",
        "abt_but": "写作文时常常开头铺垫太长，结尾草草收场，不知道怎么安排结构",
        "abt_therefore": "今天学习作文结构「凤头猪肚豹尾」和审题三步法",
        "pretest_q": "「凤头猪肚豹尾」中「豹尾」指的是什么？",
        "pretest_opts": ["A. 结尾要有力量", "B. 开头要精彩", "C. 中间要丰富", "D. 全文要简短"],
        "pretest_ans": "A",
        "pretest_q2": "写作文前最重要的一步是什么？",
        "pretest_opts2": ["A. 先想好开头", "B. 认真审题", "C. 快速动笔", "D. 想好结尾"],
        "pretest_ans2": "B",
        "posttest_q": "题目「一件难忘的事」，以下审题分析正确的是？",
        "posttest_opts": ["A. 可以写三件有意义的事", "B. 只写一件事，且要写出为什么难忘", "C. 写任何有趣的事都可以", "D. 越长越好"],
        "posttest_ans": "B",
        "posttest_q2": "以下哪个开头方式最符合「凤头」的要求？",
        "posttest_opts2": ["A. 「今天天气很好，我去了公园……」", "B. 「砰！一声巨响把我从睡梦中惊醒……」", "C. 「我想写一件事情，这件事发生在……」", "D. 「记叙文有六要素，分别是……」"],
        "posttest_ans2": "B",
        "memory_anchor": "🎯 作文结构口诀：<br>凤头：开头精彩 2-3 句切入正题<br>猪肚：中间丰富，详写重点事件<br>豹尾：结尾有力，点题升华",
        "error_key": "err-essay-off-topic",
        "error_desc": "审题偏差，写的内容和题目要求不符",
        "error_wrong": "题目「一件难忘的事」→写了三件事都没有展开",
        "error_right": "「一件难忘的事」要求：①只写一件事②写出为什么难忘③详写经过",
        "error_diag": "审题三步：①圈关键词（一件+难忘+事）②确定范围（只能写一件）③找切入点（重点写「难忘」在哪里）",
        "ai_prompt": "请输入你的作文题目，AI将帮你分析关键词并给出结构建议",
    },
    "chn-e-figurative-language": {
        "node": "rhetoric-figures", "subject": "chinese", "domain": "grammar",
        "grade": "3-6", "prereqs": "sentence-writing,paragraph-writing",
        "title": "修辞手法", "emoji": "🌈",
        "abt_and": "你已经知道文章里有各种各样的句子",
        "abt_but": "遇到比喻、拟人、排比等修辞手法时，分不清楚，答题容易出错",
        "abt_therefore": "今天学习最常用的六种修辞手法：比喻、拟人、排比、夸张、设问、反问",
        "pretest_q": "「弯弯的月亮像小船」，这句话用了什么修辞手法？",
        "pretest_opts": ["A. 拟人", "B. 比喻", "C. 排比", "D. 夸张"],
        "pretest_ans": "B",
        "pretest_q2": "「花儿笑了，小鸟唱起了歌」，这句话用了什么修辞手法？",
        "pretest_opts2": ["A. 比喻", "B. 夸张", "C. 拟人", "D. 设问"],
        "pretest_ans2": "C",
        "posttest_q": "「他好像来过这里」，这句话是比喻句吗？",
        "posttest_opts": ["A. 是，因为有「好像」", "B. 不是，这只是表示猜测，没有比较两种不同事物", "C. 不确定", "D. 是排比句"],
        "posttest_ans": "B",
        "posttest_q2": "「我真的太喜欢这本书了，不知看了多少遍，书都快被翻烂了」，用了什么修辞手法？",
        "posttest_opts2": ["A. 比喻", "B. 拟人", "C. 夸张", "D. 排比"],
        "posttest_ans2": "C",
        "memory_anchor": "🎯 修辞识别口诀：<br>比较两物是比喻，人的动作给物品是拟人<br>反复强调排比句，程度过分是夸张<br>自问自答是设问，问而不答是反问",
        "error_key": "err-rhet-simile-metaphor",
        "error_desc": "把非比喻句当成比喻句，或混淆明喻和暗喻",
        "error_wrong": "「他好像来过这里」是比喻句（有「好像」就是比喻）",
        "error_right": "这不是比喻句，只是表示猜测。比喻的条件：①本体和喻体必须是两种不同事物②两者有相似点",
        "error_diag": "判断比喻句不能只看有没有「像」「好像」。必须同时满足：①有两种不同事物②两者有相似点③是比较不是猜测",
        "ai_prompt": "请输入一个句子，AI将帮你判断使用了什么修辞手法，并解释理由",
    },
    "chn-e-homophone-polysemy": {
        "node": "homophone-polysemy", "subject": "chinese", "domain": "literacy",
        "grade": "3-5", "prereqs": "char-recognition-1,dictionary-skills",
        "title": "同音字和多义字", "emoji": "🔤",
        "abt_and": "你已经认识了许多汉字",
        "abt_but": "遇到同音字时常常写错别字，多义字不知道在不同语境中选哪个意思",
        "abt_therefore": "今天学习同音字辨析方法和多义字语境理解策略",
        "pretest_q": "「再见」和「在家」，「再」和「在」是什么关系？",
        "pretest_opts": ["A. 多义字", "B. 同音字", "C. 形近字", "D. 反义字"],
        "pretest_ans": "B",
        "pretest_q2": "「老」在「老师」和「老虎」中，意思一样吗？",
        "pretest_opts2": ["A. 一样，都表示年纪大", "B. 不一样，是多义字的不同意思", "C. 一样，都是名词", "D. 不确定"],
        "pretest_ans2": "B",
        "posttest_q": "「她的脸色不好看」，「好看」在这里是什么意思？",
        "posttest_opts": ["A. 很好看，漂亮", "B. 难看，不体面", "C. 正在看", "D. 喜欢看"],
        "posttest_ans": "B",
        "posttest_q2": "辨析同音字「已」和「以」，「以往」的「以」能换成「已」吗？",
        "posttest_opts2": ["A. 能，两字同音可以互换", "B. 不能，「以往」表示从前，用「以」；「已经」的「已」表示完成", "C. 随意，都可以", "D. 不确定"],
        "posttest_ans2": "B",
        "memory_anchor": "🎯 同音字辨析口诀：<br>同音不同义，字形有区别<br>代入语境试一试，字义合理才是它",
        "error_key": "err-pos-adj-verb-mix",
        "error_desc": "多义字在不同语境中意思混淆",
        "error_wrong": "「他高兴地来了」中「高兴」和「高兴劲儿」中「高兴」意思相同",
        "error_right": "多义字要结合语境判断：「高兴地来」是副词用法（方式），「真有高兴劲儿」是名词用法（情绪状态）",
        "error_diag": "判断多义字意思：①找到这个词在句子中的位置②看它前后的搭配③代入每个意思，选择最通顺的",
        "ai_prompt": "请输入一个你觉得难辨析的同音字组或多义字，AI将用例句帮你区分",
    },
    "chn-e-idiom-proverb": {
        "node": "idiom-proverb", "subject": "chinese", "domain": "literacy",
        "grade": "3-6", "prereqs": "vocabulary-expansion,reading-comprehension-exam",
        "title": "成语与谚语", "emoji": "📜",
        "abt_and": "你已经积累了一些成语",
        "abt_but": "遇到成语时，不理解其来源，容易用错；谚语的道理也不好理解",
        "abt_therefore": "今天学习成语的故事来源和正确使用方法，以及谚语的含义与应用",
        "pretest_q": "「守株待兔」这个成语告诉我们什么道理？",
        "pretest_opts": ["A. 要珍惜食物", "B. 不要靠运气，要勤奋努力", "C. 兔子很聪明", "D. 种树有好处"],
        "pretest_ans": "B",
        "pretest_q2": "「一石二鸟」用来比喻什么？",
        "pretest_opts2": ["A. 打猎的技巧", "B. 做一件事得到两种收益", "C. 力气很大", "D. 石头很硬"],
        "pretest_ans2": "B",
        "posttest_q": "「他的学习成绩突飞猛进，真是士别三日，刮目相看」。「刮目相看」的意思是？",
        "posttest_opts": ["A. 闭上眼睛看", "B. 用新的眼光重新看待人", "C. 用眼药水", "D. 互相对视"],
        "posttest_ans": "B",
        "posttest_q2": "「不入虎穴，焉得虎子」这句谚语的道理是？",
        "posttest_opts2": ["A. 不要进入危险的地方", "B. 不经历艰难险阻，就无法成功", "C. 老虎有孩子", "D. 勇气很重要"],
        "posttest_ans2": "B",
        "memory_anchor": "🎯 成语学习三步法：<br>① 知故事（了解来源）→ ② 懂含义（理解寓意）→ ③ 会运用（在语境中正确使用）",
        "error_key": "err-rhet-rhetorical-set",
        "error_desc": "成语误用，把褒义成语用在贬义语境",
        "error_wrong": "「他这个人处理问题八面玲珑，大家都讨厌他」（八面玲珑用在贬义语境不当）",
        "error_right": "「八面玲珑」本是形容建筑四面通透，后形容人处世灵活圆滑，通常用于中性或贬义，需注意语境",
        "error_diag": "使用成语前要确认：①这个成语是褒义、贬义还是中性？②语境的感情色彩是否匹配？③有没有混淆近义成语？",
        "ai_prompt": "请输入一个你不确定用法的成语，AI将解释其来源、含义和正确用法，并举例",
    },
    "chn-e-initials": {
        "node": "initials", "subject": "chinese", "domain": "pinyin",
        "grade": "1", "prereqs": "simple-vowels",
        "title": "声母", "emoji": "🔤",
        "abt_and": "你已经知道汉语是用拼音来标注读音的",
        "abt_but": "23个声母形状相似的很多，容易搞混，比如b和d、p和q",
        "abt_therefore": "今天用有趣的口诀和图像记忆法，彻底记住23个声母",
        "pretest_q": "以下哪个是声母？",
        "pretest_opts": ["A. a", "B. b", "C. an", "D. ai"],
        "pretest_ans": "B",
        "pretest_q2": "「爸爸」的声母是什么？",
        "pretest_opts2": ["A. p", "B. b", "C. m", "D. f"],
        "pretest_ans2": "B",
        "posttest_q": "b、p、d、q 四个声母，「b」的圆在竖的哪一侧？",
        "posttest_opts": ["A. 右上方", "B. 右下方", "C. 左下方", "D. 左上方"],
        "posttest_ans": "B",
        "posttest_q2": "以下哪对声母在发音时主要区别是是否送气？",
        "posttest_opts2": ["A. b 和 d", "B. b 和 p", "C. m 和 n", "D. f 和 h"],
        "posttest_ans2": "B",
        "memory_anchor": "🎯 b p d q 记忆口诀：<br>右下圆是b，右上圆是p<br>左下圆是d，左上圆是q<br>口诀：b是爸爸（b—a—bā），p是泡泡（pàopào）",
        "error_key": "err-ei-ie-confusion",
        "error_desc": "b 和 d 混淆，形近声母写反",
        "error_wrong": "把「爸」写成 dà，把「大」拼成 bà",
        "error_right": "b 的竖在左，圆在右下方；d 的竖在右，圆在左下方",
        "error_diag": "区分 b 和 d 的口诀：b 像右脚踢球（竖在左，球在右），d 像左脚踢球（竖在右，球在左）",
        "ai_prompt": "请上传写有拼音声母的图片，AI将帮你检查书写是否正确",
    },
    "chn-e-listen-speak-basic": {
        "node": "listen-speak-basic", "subject": "chinese", "domain": "grammar",
        "grade": "1-2", "prereqs": "sentence-writing",
        "title": "听说基础", "emoji": "👂",
        "abt_and": "你在生活中每天都在听说，能进行基本交流",
        "abt_but": "在课堂上不知道怎么完整表达，听别人说话时也容易走神或听不全",
        "abt_therefore": "今天学习专注倾听的方法和完整表达的技巧",
        "pretest_q": "听别人说话时，以下哪个做法是对的？",
        "pretest_opts": ["A. 边听边想其他事情", "B. 眼睛看着说话的人，用心听", "C. 听到一半可以打断对方", "D. 不用听完就能猜出意思"],
        "pretest_ans": "B",
        "pretest_q2": "说话时，一句完整的话应该包括什么？",
        "pretest_opts2": ["A. 只需要说主要内容就行", "B. 谁+做什么（完整的主谓结构）", "C. 越短越好", "D. 任意说就行"],
        "pretest_ans2": "B",
        "posttest_q": "以下哪句话表达最完整？",
        "posttest_opts": ["A. 「在公园玩。」", "B. 「小明和我昨天下午在公园里捉蝴蝶。」", "C. 「玩了很开心。」", "D. 「公园。」"],
        "posttest_ans": "B",
        "posttest_q2": "老师说了一段话，你只听清了部分，你应该怎么办？",
        "posttest_opts2": ["A. 假装听懂了", "B. 礼貌地请老师再说一遍", "C. 问旁边同学", "D. 不管了"],
        "posttest_ans2": "B",
        "memory_anchor": "🎯 听说口诀：<br>听时：眼看嘴闭心专注<br>说时：说清谁，做了什么，在哪里",
        "error_key": "err-sent-incomplete",
        "error_desc": "说的话不完整，缺少主语或谓语",
        "error_wrong": "「在公园里玩。」（缺少主语——谁在玩？）",
        "error_right": "「我和小明在公园里玩。」完整句子要有主语（谁）+谓语（干什么）",
        "error_diag": "检查句子是否完整：读一读，能不能回答「谁」「干什么」两个问题",
        "ai_prompt": "请用语音或文字描述一件事，AI将帮你检查表达是否完整清晰",
    },
    "chn-e-main-idea-summary": {
        "node": "summarization", "subject": "chinese", "domain": "reading",
        "grade": "4-5", "prereqs": "paragraph-analysis,article-structure",
        "title": "概括主要内容", "emoji": "📋",
        "abt_and": "你已经学会了找段落中心句",
        "abt_but": "概括整篇文章的主要内容时，要么太长（变成缩写），要么太短（说不清楚），还常常把主要内容和中心思想搞混",
        "abt_therefore": "今天学习「谁+在什么情况下+做了什么+结果怎样」的主要内容概括公式",
        "pretest_q": "概括主要内容时，字数应该控制在多少字以内？",
        "pretest_opts": ["A. 越长越好", "B. 50字以内", "C. 200字", "D. 和原文一样长"],
        "pretest_ans": "B",
        "pretest_q2": "「这篇文章告诉我们要勤劳」，这是在回答主要内容还是中心思想？",
        "pretest_opts2": ["A. 主要内容", "B. 中心思想", "C. 都是", "D. 都不是"],
        "pretest_ans2": "B",
        "posttest_q": "《狐假虎威》的主要内容，以下哪个最准确？",
        "posttest_opts": ["A. 告诉我们不要仗势欺人", "B. 一只狐狸借助老虎的威势吓走了百兽，老虎没有发现狐狸的把戏", "C. 动物们都很害怕", "D. 森林里住着老虎和狐狸"],
        "posttest_ans": "B",
        "posttest_q2": "概括主要内容和复述课文，主要区别是什么？",
        "posttest_opts2": ["A. 没有区别", "B. 概括只要主干信息，复述要包含细节", "C. 概括要更长", "D. 复述不需要细节"],
        "posttest_ans2": "B",
        "memory_anchor": "🎯 概括公式：<br>谁 + 在什么情况下 + 做了什么 + 结果怎样<br>（控制在50字以内，去掉所有细节）",
        "error_key": "err-summary-theme-content",
        "error_desc": "混淆「主要内容」和「中心思想」",
        "error_wrong": "问「主要内容」时回答「这篇文章告诉我们要勤劳」",
        "error_right": "主要内容=文章讲了什么事（客观描述），中心思想=作者想表达什么（感情/道理）",
        "error_diag": "审题时看清问的是什么：「主要内容」→叙事式回答（讲了什么）；「中心思想」→总结式回答（告诉我们什么道理）",
        "ai_prompt": "请输入一段文章或故事，AI将帮你用50字内概括出主要内容",
    },
    "chn-e-narrative-writing": {
        "node": "narrative-writing", "subject": "chinese", "domain": "writing",
        "grade": "4-6", "prereqs": "paragraph-writing,sentence-writing",
        "title": "记叙文写作", "emoji": "✍️",
        "abt_and": "你已经会写段落，知道作文要有开头、中间和结尾",
        "abt_but": "写记叙文时总是写成「流水账」，每件事平均用力，读起来平淡没有感情",
        "abt_therefore": "今天学习「慢镜头放大法」和「融情入景法」，让记叙文有详有略，有真情实感",
        "pretest_q": "「流水账式」记叙文的主要问题是什么？",
        "pretest_opts": ["A. 太短了", "B. 每件事平均用力，没有详略", "C. 字太少", "D. 没有标点"],
        "pretest_ans": "B",
        "pretest_q2": "想让读者感受到你的感动，最好的方法是？",
        "pretest_opts2": ["A. 最后写「我非常感动」", "B. 通过具体细节描写，让感情自然流露", "C. 写很多感叹号", "D. 重复说「感动」"],
        "pretest_ans2": "B",
        "posttest_q": "以下哪句话用了「慢镜头放大法」（细节描写）？",
        "posttest_opts": ["A. 「他很紧张。」", "B. 「他的手抖个不停，嘴唇发白，眼神不断飘向钟表。」", "C. 「那天发生了一件事。」", "D. 「比赛开始了。」"],
        "posttest_ans": "B",
        "posttest_q2": "记叙文写「一件难忘的事」，以下结构安排最合理的是？",
        "posttest_opts2": ["A. 平均介绍当天所有事情", "B. 简单交代开头结尾，详写最重要的经过和感受", "C. 全部写感受，不写经过", "D. 只写开头，用省略号结尾"],
        "posttest_ans2": "B",
        "memory_anchor": "🎯 记叙文写作口诀：<br>选一件事，找重点，慢镜头放大关键场景<br>动作+语言+心理，感情融入细节中",
        "error_key": "err-narr-liushui",
        "error_desc": "记叙文写成「流水账」，每件事平均用力",
        "error_wrong": "「我早上起床，然后刷牙，然后吃饭，然后上学……」（全是平铺直叙）",
        "error_right": "记叙文要详略得当：选一个重点事件详写（动作、对话、心理写具体），其他一笔带过",
        "error_diag": "避免流水账：①选一个重点事件②用「慢镜头」放大关键场景（写动作、对话、心理）③其他事件一句话带过",
        "ai_prompt": "请输入你想写的作文题目，AI将帮你规划详略结构并给出关键场景的细节描写建议",
    },
    "chn-e-nasal-vowel-back": {
        "node": "nasal-vowel-back", "subject": "chinese", "domain": "pinyin",
        "grade": "1", "prereqs": "initials,nasal-vowel-front",
        "title": "后鼻韵母", "emoji": "🔊",
        "abt_and": "你已经学习了前鼻韵母 an、en、in 等",
        "abt_but": "后鼻韵母 ang、eng、ing、ong 和前鼻韵母长得很像，经常混淆，南方同学尤其容易搞错",
        "abt_therefore": "今天用嘴巴形状和手势来区分前鼻韵母和后鼻韵母",
        "pretest_q": "「星星」的韵母是什么？",
        "pretest_opts": ["A. in", "B. ing", "C. en", "D. eng"],
        "pretest_ans": "B",
        "pretest_q2": "发「ang」时，舌头的位置在哪里？",
        "pretest_opts2": ["A. 舌尖碰上齿龈", "B. 舌根碰软腭（后面）", "C. 舌尖放平", "D. 嘴巴闭上"],
        "pretest_ans2": "B",
        "posttest_q": "「风」的韵母是 ong，「根」的韵母是 en。这两个字，哪个是后鼻韵母？",
        "posttest_opts": ["A. 「根」（en）", "B. 「风」（ong）", "C. 两个都是", "D. 两个都不是"],
        "posttest_ans": "B",
        "posttest_q2": "「灯」的韵母是什么？",
        "posttest_opts2": ["A. en", "B. eng", "C. an", "D. ang"],
        "posttest_ans2": "B",
        "memory_anchor": "🎯 前后鼻韵母区分口诀：<br>前鼻：舌尖顶（an en in），嘴巴小<br>后鼻：舌根收（ang eng ing ong），嘴巴大<br>手势：前鼻指向前，后鼻指向后",
        "error_key": "err-in-ing-confusion",
        "error_desc": "前鼻韵母 in 和后鼻韵母 ing 混淆",
        "error_wrong": "「星」的韵母写成 in",
        "error_right": "「星」的韵母是 ing（xīng），ing 是后鼻韵母",
        "error_diag": "in 和 ing 的区别和 en/eng 类似：in 舌尖碰上齿龈（前），ing 舌根碰软腭（后）。多读多练就能分辨",
        "ai_prompt": "请朗读一句含有后鼻韵母的话，上传录音，AI将帮你判断发音是否准确",
    },
    "chn-e-nasal-vowel-front": {
        "node": "nasal-vowel-front", "subject": "chinese", "domain": "pinyin",
        "grade": "1", "prereqs": "initials,simple-vowels",
        "title": "前鼻韵母", "emoji": "👃",
        "abt_and": "你已经学会了基本韵母 a、o、e、i、u、ü",
        "abt_but": "加上鼻音 n 后，前鼻韵母 an、en、in、ün 的发音很难掌握，容易和后鼻韵母混淆",
        "abt_therefore": "今天用「舌尖轻抵牙龈」的发音技巧来掌握前鼻韵母",
        "pretest_q": "「山」的韵母是什么？",
        "pretest_opts": ["A. an", "B. ang", "C. en", "D. eng"],
        "pretest_ans": "A",
        "pretest_q2": "前鼻韵母发音时，舌头位置在哪里？",
        "pretest_opts2": ["A. 舌根抵软腭", "B. 舌尖抵上齿龈", "C. 舌头放平", "D. 嘴巴张大"],
        "pretest_ans2": "B",
        "posttest_q": "「盆」和「棚」，哪个用前鼻韵母？",
        "posttest_opts": ["A. 「棚」（péng，eng 是后鼻）", "B. 「盆」（pén，en 是前鼻）", "C. 两个都是前鼻", "D. 两个都是后鼻"],
        "posttest_ans": "B",
        "posttest_q2": "以下哪组都是前鼻韵母？",
        "posttest_opts2": ["A. an、ang、in", "B. an、en、in", "C. ang、eng、ing", "D. an、ang、eng"],
        "posttest_ans2": "B",
        "memory_anchor": "🎯 前鼻韵母记忆法：<br>an en in ün 都有字母 n 结尾<br>舌尖往前——轻轻抵上牙龈<br>「安、恩、音、晕」——四个代表字",
        "error_key": "err-an-ang-confusion",
        "error_desc": "前鼻韵母 an 和后鼻韵母 ang 混淆",
        "error_wrong": "「山」的韵母写成 ang",
        "error_right": "「山」的韵母是 an（shān），不是 ang",
        "error_diag": "an 和 ang 的区别：发 an 时舌尖抵上齿龈，嘴巴较小；发 ang 时舌根抵软腭，嘴巴张大。试：发「安」（an）嘴巴小，发「昂」（ang）嘴巴大",
        "ai_prompt": "请输入几个汉字，AI将帮你判断其韵母是前鼻还是后鼻，并解释发音方法",
    },
    "chn-e-nasal-vowels": {
        "node": "nasal-vowels", "subject": "chinese", "domain": "pinyin",
        "grade": "1", "prereqs": "initials,simple-vowels",
        "title": "鼻韵母", "emoji": "🔊",
        "abt_and": "你已经学会了基本单韵母和复韵母",
        "abt_but": "加上鼻音后，前鼻韵母和后鼻韵母容易混淆，尤其是南方口音地区的同学",
        "abt_therefore": "今天通过系统对比，彻底掌握前鼻韵母和后鼻韵母的发音和书写",
        "pretest_q": "以下哪个是前鼻韵母？",
        "pretest_opts": ["A. ang", "B. ing", "C. an", "D. ong"],
        "pretest_ans": "C",
        "pretest_q2": "以下哪个是后鼻韵母？",
        "pretest_opts2": ["A. en", "B. in", "C. an", "D. eng"],
        "pretest_ans2": "D",
        "posttest_q": "「明」和「民」的韵母分别是？",
        "posttest_opts": ["A. 两个都是 in", "B. 「明」是 ing（后鼻），「民」是 in（前鼻）", "C. 两个都是 ing", "D. 「明」是 in，「民」是 ing"],
        "posttest_ans": "B",
        "posttest_q2": "前鼻韵母和后鼻韵母，发音时最主要的区别是什么？",
        "posttest_opts2": ["A. 声调不同", "B. 舌头位置不同：前鼻舌尖抵前，后鼻舌根收后", "C. 嘴唇形状不同", "D. 声母不同"],
        "posttest_ans2": "B",
        "memory_anchor": "🎯 鼻韵母系统口诀：<br>前鼻：an en in ün（舌尖前，嘴小）<br>后鼻：ang eng ing ong（舌根后，嘴大）<br>对比记忆：「安/昂」「根/耕」「今/京」",
        "error_key": "err-en-eng-confusion",
        "error_desc": "前鼻韵母 en 和后鼻韵母 eng 混淆",
        "error_wrong": "「灯」的韵母写成 en",
        "error_right": "「灯」的韵母是 eng（dēng），eng 是后鼻韵母",
        "error_diag": "en 发音结束时舌尖碰上齿龈（前），eng 发音结束时舌根碰软腭（后）。「盆」是 en，「风」是 eng",
        "ai_prompt": "请输入一个词语，AI将帮你区分其中的鼻韵母是前鼻还是后鼻",
    },
    "chn-e-non-fiction-reading": {
        "node": "non-fiction-reading", "subject": "chinese", "domain": "reading",
        "grade": "4-6", "prereqs": "paragraph-analysis,article-structure",
        "title": "非虚构类文本阅读", "emoji": "📰",
        "abt_and": "你已经学会了阅读记叙文（故事类）",
        "abt_but": "科普文章、说明文等非虚构类文本结构不同，信息密度大，不知道怎么快速找到关键信息",
        "abt_therefore": "今天学习非虚构类文本的结构特征和信息提取策略：标题→主题句→关键词",
        "pretest_q": "读科普文章时，快速找到文章主要讲什么，应该先看哪里？",
        "pretest_opts": ["A. 最后一段", "B. 标题和每段的第一句话", "C. 全部细节", "D. 随机选一段"],
        "pretest_ans": "B",
        "pretest_q2": "说明文中，「首先……其次……最后……」表示什么？",
        "pretest_opts2": ["A. 比较关系", "B. 时间或步骤顺序关系", "C. 因果关系", "D. 并列关系"],
        "pretest_ans2": "B",
        "posttest_q": "读一篇关于「为什么天空是蓝色」的科普文章，找到核心解释后，你应该怎么总结？",
        "posttest_opts": ["A. 把整篇文章背下来", "B. 用一两句话说出：什么原因导致什么结果", "C. 只记住文章题目", "D. 记所有数字"],
        "posttest_ans": "B",
        "posttest_q2": "以下哪种方法有助于快速提取说明文的关键信息？",
        "posttest_opts2": ["A. 从头到尾每字必读", "B. 先看标题，划出每段主题句，找关键词", "C. 只看图片", "D. 随机挑一段读"],
        "posttest_ans2": "B",
        "memory_anchor": "🎯 非虚构文本阅读三步法：<br>① 看标题预测主题<br>② 找每段第一句（主题句）<br>③ 圈关键词，一句话总结",
        "error_key": "err-para-center-last",
        "error_desc": "认为中心句一定在段首，忽视段末和段中的中心句",
        "error_wrong": "做题时只找第一句当中心句",
        "error_right": "中心句可能在段首（总分）、段末（分总）或段中。需要找能概括全段意思的那一句",
        "error_diag": "找中心句：①读完全段②找能概括全段意思的句子③验证：其他句子是否都在说明这句话。中心句不一定在段首",
        "ai_prompt": "请粘贴一段说明文或科普文章，AI将帮你标注主题句和关键信息",
    },
    "chn-e-nursery-rhyme": {
        "node": "nursery-rhyme", "subject": "chinese", "domain": "reading",
        "grade": "1-2", "prereqs": "pinyin-reading,char-recognition-1",
        "title": "儿歌与童谣", "emoji": "🎵",
        "abt_and": "你已经认识了一些汉字，能读简单的句子",
        "abt_but": "儿歌和童谣里有押韵和节奏，不知道为什么有些词语在句末听起来特别顺耳",
        "abt_therefore": "今天学习儿歌的押韵规律，学会朗读有节奏感的儿歌",
        "pretest_q": "「小白兔，白又白，两只耳朵竖起来」，「白」和「来」押韵是指什么？",
        "pretest_opts": ["A. 它们都是白色的", "B. 它们的韵母相同或相似（ai）", "C. 它们都是动词", "D. 它们都很短"],
        "pretest_ans": "B",
        "pretest_q2": "朗读儿歌时，正确的方法是？",
        "pretest_opts2": ["A. 越快越好", "B. 注意节奏，押韵的地方稍微拉长", "C. 单调地读", "D. 不用管节奏"],
        "pretest_ans2": "B",
        "posttest_q": "「春天到，花儿笑，小鸟唱歌蝴蝶跳」，押韵的字是哪些？",
        "posttest_opts": ["A. 春天、花儿", "B. 笑、跳（韵母都是 ao）", "C. 小鸟、蝴蝶", "D. 春、花"],
        "posttest_ans": "B",
        "posttest_q2": "以下哪句话可以填入「小花猫，喵喵叫，__________」让它押韵？",
        "posttest_opts2": ["A. 「它很可爱」", "B. 「要吃老鼠跑不了」（韵母 ao）", "C. 「住在我家里」", "D. 「晒太阳睡大觉」也对（ao）"],
        "posttest_ans2": "D",
        "memory_anchor": "🎯 押韵口诀：<br>押韵=句末字的韵母相同或相似<br>朗读时：押韵处拉长，节奏处短停<br>感受：♩♩♩♪（强强强弱）",
        "error_key": "err-rhet-personify-simile",
        "error_desc": "把儿歌中的拟人当比喻",
        "error_wrong": "「花儿笑了」是比喻句",
        "error_right": "「花儿笑了」是拟人句，赋予花朵人的动作「笑」。比喻需要用另一种事物来比较",
        "error_diag": "区分比喻和拟人：比喻=A像B（两种不同事物对比），拟人=把事物当成人（赋予人的动作/情感）",
        "ai_prompt": "请输入一首儿歌，AI将帮你标注押韵的字并分析节奏",
    },
    "chn-e-oral-presentation": {
        "node": "oral-presentation", "subject": "chinese", "domain": "grammar",
        "grade": "3-5", "prereqs": "listen-speak-basic,sentence-writing",
        "title": "口头表达", "emoji": "🎤",
        "abt_and": "你已经能用完整的句子表达简单想法",
        "abt_but": "在课堂上发言、演讲或描述时，思路乱、表达不清楚，语速也不稳",
        "abt_therefore": "今天学习有条理的口头表达框架：「总-分-总」结构和连接词的运用",
        "pretest_q": "口头表达时，「总-分-总」结构是指？",
        "pretest_opts": ["A. 先总结，再分析，再总结", "B. 先说结论，再展开说明，最后再强调结论", "C. 只说总结", "D. 随意发挥"],
        "pretest_ans": "B",
        "pretest_q2": "表达时用「首先……其次……最后……」有什么好处？",
        "pretest_opts2": ["A. 让说话变长", "B. 让表达有条理，听者容易跟上", "C. 显得很正式", "D. 没有好处"],
        "pretest_ans2": "B",
        "posttest_q": "介绍你最喜欢的季节，以下哪个开头最好？",
        "posttest_opts": ["A. 「我喜欢秋天，因为……然后……还有……」（无结构）", "B. 「我最喜欢秋天，原因有三：第一……第二……第三……」（总分结构）", "C. 「秋天很好。」（太短）", "D. 「我不确定。」"],
        "posttest_ans": "B",
        "posttest_q2": "发言时声音太小，最好的改进方法是？",
        "posttest_opts2": ["A. 不用改，听不见是别人的问题", "B. 想象对面最后一排的同学，声音要让他听清楚", "C. 凑近说话", "D. 用麦克风"],
        "posttest_ans2": "B",
        "memory_anchor": "🎯 口头表达口诀：<br>总：先说结论/主题（一句话）<br>分：展开说 2-3 个理由（首先/其次/最后）<br>总：再强调一次观点",
        "error_key": "err-sent-incomplete",
        "error_desc": "口头表达时句子不完整，表意不清",
        "error_wrong": "「因为……所以……就……然后……」（思路混乱，无结构）",
        "error_right": "有条理的表达：先说「是什么/怎么看」，再用「首先/其次」展开，最后总结",
        "error_diag": "表达前先想：①我要说的核心是什么？②有几个理由？③用什么连接词串联？",
        "ai_prompt": "请输入一个话题，AI将帮你规划「总-分-总」的口头表达框架并给出开头示范",
    },
    "chn-e-paragraph-analysis": {
        "node": "paragraph-analysis", "subject": "chinese", "domain": "reading",
        "grade": "3-4", "prereqs": "sentence-comprehension,char-recognition-1",
        "title": "段落分析", "emoji": "🔎",
        "abt_and": "你已经能读懂单个句子的意思",
        "abt_but": "面对整个段落时，不知道怎么找中心句，概括段意时总是直接抄原文",
        "abt_therefore": "今天学习找中心句的三个位置（段首/段末/段中）和用自己的话概括段意的方法",
        "pretest_q": "一段话的中心句一定在第一句吗？",
        "pretest_opts": ["A. 是，中心句总在开头", "B. 不一定，可能在段首、段末或段中", "C. 一定在最后", "D. 没有中心句"],
        "pretest_ans": "B",
        "pretest_q2": "概括段意时，以下哪种方式最好？",
        "pretest_opts2": ["A. 直接抄第一句", "B. 用自己的话说出段落核心", "C. 把整段抄下来", "D. 随意写"],
        "pretest_ans2": "B",
        "posttest_q": "「秋天真美啊！金黄的叶子铺满了大地，空气中弥漫着果实的香甜，小松鼠忙着收集过冬的食物。」这段的中心句是？",
        "posttest_opts": ["A. 「金黄的叶子铺满了大地」", "B. 「秋天真美啊！」（第一句总写秋天美）", "C. 「小松鼠忙着收集食物」", "D. 没有中心句"],
        "posttest_ans": "B",
        "posttest_q2": "上段的段意，以下哪个概括最好？",
        "posttest_opts2": ["A. 「秋天真美啊！」（太短，直接抄）", "B. 「写了秋天美丽的景色：叶子、香气和动物」（用自己的话概括）", "C. 把整段抄一遍", "D. 「有金黄的叶子」"],
        "posttest_ans2": "B",
        "memory_anchor": "🎯 找中心句三问：<br>① 这段主要说了什么事/物？<br>② 哪句话能概括全段？<br>③ 其他句子是否都在补充、解释这句话？",
        "error_key": "err-para-center-last",
        "error_desc": "认为中心句一定在段首，忽视段末和段中的中心句",
        "error_wrong": "做题时只找第一句当中心句",
        "error_right": "中心句可能在段首（总分结构）、段末（分总结构）或段中",
        "error_diag": "找中心句：①读完全段②找能概括全段意思的句子③验证：其他句子是否都在说明这句话",
        "ai_prompt": "请粘贴一段文字，AI将帮你找出中心句并用一句话概括段落大意",
    },
    "chn-e-paragraph-structure": {
        "node": "paragraph-structure", "subject": "chinese", "domain": "reading",
        "grade": "4-5", "prereqs": "paragraph-analysis,article-structure",
        "title": "段落结构", "emoji": "🏗️",
        "abt_and": "你已经学会找段落中心句",
        "abt_but": "面对整篇文章时，不知道怎么分析段与段之间的关系，更看不出整篇文章的结构",
        "abt_therefore": "今天学习三种常见段落结构：总分结构、总分总结构、并列结构，并学会分析文章脉络",
        "pretest_q": "「总分结构」的段落特点是什么？",
        "pretest_opts": ["A. 先具体再总结", "B. 先提出观点，再用事例或理由支撑", "C. 全部并列说明", "D. 只有总结"],
        "pretest_ans": "B",
        "pretest_q2": "「并列结构」的文章，各段之间是什么关系？",
        "pretest_opts2": ["A. 先后因果关系", "B. 各段地位平等，分别介绍同一主题的不同方面", "C. 总结关系", "D. 对比关系"],
        "pretest_ans2": "B",
        "posttest_q": "一篇介绍「秋天」的文章，先总写秋天美丽，再分别写景色、气候、果实，最后再总结。这是什么结构？",
        "posttest_opts": ["A. 并列结构", "B. 总分总结构", "C. 只是总分结构", "D. 因果结构"],
        "posttest_ans": "B",
        "posttest_q2": "读一篇文章，发现每段都在介绍不同国家的节日，各段之间没有先后关系。这是什么结构？",
        "posttest_opts2": ["A. 总分结构", "B. 并列结构", "C. 总分总结构", "D. 递进结构"],
        "posttest_ans2": "B",
        "memory_anchor": "🎯 段落结构三种型：<br>总分：先观点后证明<br>总分总：先说再展开再收尾<br>并列：各段平等，互不包含",
        "error_key": "err-struct-six-elements",
        "error_desc": "梳理记叙文六要素时混淆「起因」和「经过」",
        "error_wrong": "把事情的全部过程都当作「起因」",
        "error_right": "起因=为什么发生这件事（事件的触发点），经过=事情怎样发展的（详细过程）",
        "error_diag": "六要素口诀：何时、何地、何人、为何（起因）、如何（经过）、结果。起因只回答「为什么」，通常只有一两句",
        "ai_prompt": "请输入一篇文章或几段文字，AI将帮你分析其段落结构类型",
    },
    "chn-e-paragraph-writing": {
        "node": "paragraph-writing", "subject": "chinese", "domain": "writing",
        "grade": "3-4", "prereqs": "sentence-writing,listen-speak-basic",
        "title": "段落写作", "emoji": "✍️",
        "abt_and": "你已经会写完整的句子",
        "abt_but": "把句子组成段落时，想到哪写到哪，没有条理，读起来让人摸不着头脑",
        "abt_therefore": "今天学习三种段落写作顺序：时间顺序、空间顺序、事情发展顺序，以及如何用连接词让段落有条理",
        "pretest_q": "「先……然后……接着……最后……」是什么顺序？",
        "pretest_opts": ["A. 空间顺序", "B. 时间顺序/步骤顺序", "C. 重要性顺序", "D. 随机顺序"],
        "pretest_ans": "B",
        "pretest_q2": "写「我的房间」时，用「从左到右」「由近及远」是什么顺序？",
        "pretest_opts2": ["A. 时间顺序", "B. 空间顺序", "C. 情感顺序", "D. 随机顺序"],
        "pretest_ans2": "B",
        "posttest_q": "写「放学回家做作业」，以下哪种写法最有条理？",
        "posttest_opts": ["A. 「回到家做了作业，然后玩了一会儿，吃了饭，其实我放学很累」（跳来跳去）", "B. 「放学后，我先整理书包，然后回到家，接着做完作业，最后才出去玩」（时间顺序）", "C. 「作业很多，累死了」（没有顺序）", "D. 「我做了作业」（太简单）"],
        "posttest_ans": "B",
        "posttest_q2": "以下哪个连接词表示「转折」关系？",
        "posttest_opts2": ["A. 首先、其次", "B. 但是、然而、却", "C. 因为、所以", "D. 比如、例如"],
        "posttest_ans2": "B",
        "memory_anchor": "🎯 段落写作三步骤：<br>① 想清楚用什么顺序（时间/空间/发展）<br>② 用连接词串联句子（首先/然后/最后）<br>③ 检查：读起来是否流畅有条理",
        "error_key": "err-para-no-order",
        "error_desc": "段落写作没有条理，想到哪写到哪",
        "error_wrong": "写做饭过程：「先炒菜，然后吃饭很好吃，妈妈洗菜，我帮忙切菜」（时间顺序混乱）",
        "error_right": "按时间顺序：「先洗菜，然后切菜，接着炒菜，最后端上桌」",
        "error_diag": "动笔前先想好顺序：①这件事/景物按什么顺序写？②用什么连接词？③写完读一遍检查顺序是否清晰",
        "ai_prompt": "请输入你要写的段落主题，AI将帮你规划写作顺序并给出一个段落示范",
    },
    "chn-e-parts-of-speech": {
        "node": "parts-of-speech", "subject": "chinese", "domain": "grammar",
        "grade": "4-6", "prereqs": "sentence-writing,sentence-types",
        "title": "词性", "emoji": "📚",
        "abt_and": "你已经认识了很多词语，知道词语有不同的意思",
        "abt_but": "分析句子成分时，分不清名词、动词、形容词等词性，尤其是心理活动词（喜欢/害怕）到底是动词还是形容词",
        "abt_therefore": "今天学习六大词性（名、动、形、数、量、代）的识别方法，重点掌握功能测试法",
        "pretest_q": "以下哪个词是名词？",
        "pretest_opts": ["A. 跑步", "B. 漂亮", "C. 学校", "D. 非常"],
        "pretest_ans": "C",
        "pretest_q2": "判断词性，最可靠的方法是？",
        "pretest_opts2": ["A. 看词语的意思", "B. 用语法功能测试（能不能带宾语，能不能被「很」修饰）", "C. 凭感觉", "D. 看词语的长度"],
        "pretest_ans2": "B",
        "posttest_q": "「喜欢」是什么词性？",
        "posttest_opts": ["A. 形容词（描述状态）", "B. 动词（心理活动动词，能带宾语：喜欢音乐）", "C. 名词", "D. 副词"],
        "posttest_ans": "B",
        "posttest_q2": "用「很」测试法：「很漂亮」说得通，「很跑步」说不通，这说明「漂亮」是？",
        "posttest_opts2": ["A. 动词", "B. 形容词（能被「很」修饰）", "C. 名词", "D. 量词"],
        "posttest_ans2": "B",
        "memory_anchor": "🎯 词性识别口诀：<br>能带宾语（做了什么）→动词<br>能被「很」修饰→形容词<br>表示事物名称→名词<br>心理活动词（喜欢/害怕）→动词（能带宾语）",
        "error_key": "err-pos-adj-verb-mix",
        "error_desc": "将表示心理活动的动词误判为形容词",
        "error_wrong": "「喜欢」「讨厌」「害怕」是形容词",
        "error_right": "「喜欢」「讨厌」「害怕」是动词（心理活动动词）。能带宾语的是动词——「喜欢音乐」「害怕考试」",
        "error_diag": "区分动词和形容词的关键：动词能带宾语（喜欢+XX），形容词不能直接带宾语（美丽+XX不通）",
        "ai_prompt": "请输入一个句子，AI将帮你标注每个词的词性并解释判断方法",
    },
    "chn-e-pathological-sentence": {
        "node": "sentence-transformations-zh", "subject": "chinese", "domain": "grammar",
        "grade": "5-8", "prereqs": "parts-of-speech,sentence-types",
        "title": "病句修改", "emoji": "🔧",
        "abt_and": "你已经学会了写完整的句子",
        "abt_but": "写作和考试中常常出现病句（语病），不知道怎么找出问题并改正",
        "abt_therefore": "今天学习六类常见病句：成分残缺、搭配不当、语义重复、语序不当、前后矛盾、不合逻辑",
        "pretest_q": "「他的写作水平有了很大的增长」，这句话有什么问题？",
        "pretest_opts": ["A. 没问题", "B. 「水平」和「增长」搭配不当，应改为「提高」", "C. 主语缺失", "D. 语序不当"],
        "pretest_ans": "B",
        "pretest_q2": "「我个人认为这件事大概可能是他做的」，这句话有什么问题？",
        "pretest_opts2": ["A. 没有问题", "B. 语义重复（「我个人认为」「大概」「可能」表示同样的不确定性）", "C. 主谓不搭配", "D. 缺少宾语"],
        "pretest_ans2": "B",
        "posttest_q": "「能否考上重点高中，关键是努力学习」，这句话有什么问题？",
        "posttest_opts": ["A. 没问题", "B. 前后矛盾：「能否」（包含能和不能两种情况），但「关键」只说了一种情况，改为「关键在于是否努力学习」", "C. 主语缺失", "D. 语序不当"],
        "posttest_ans": "B",
        "posttest_q2": "「他的语文、数学和各科成绩都不错」，这句话有什么病？",
        "posttest_opts2": ["A. 没有问题", "B. 「语文、数学」包含在「各科」中，语义重复，改为「他各科成绩都不错」", "C. 搭配不当", "D. 语序不当"],
        "posttest_ans2": "B",
        "memory_anchor": "🎯 病句六类口诀：<br>残缺（缺主语/谓语/宾语）、搭配不当、重复啰嗦<br>语序不当、前后矛盾、不合逻辑<br>修改步骤：读句子→找异常→对应类型→改通顺",
        "error_key": "err-trans-ba-bei-swap",
        "error_desc": "改病句时找错问题类型",
        "error_wrong": "「水平增长」不当→误以为是主语缺失而非搭配不当",
        "error_right": "「水平」应与「提高/提升」搭配，「增长」搭配「数量/数字」，这是搭配不当的病句",
        "error_diag": "找搭配不当病句：把句子拆成「主语+动词+宾语」「名词+动词/形容词」，检查每对搭配是否自然通顺",
        "ai_prompt": "请输入一个句子，AI将帮你检查是否有语病，并指出病因和改正方法",
    },
}


def make_meta_block(cfg):
    """生成需要插入 <head> 的 meta 标签块"""
    return f"""<meta name="teachany-node" content="{cfg['node']}">
<meta name="teachany-subject" content="{cfg['subject']}">
<meta name="teachany-domain" content="{cfg['domain']}">
<meta name="teachany-grade" content="{cfg['grade']}">
<meta name="teachany-prerequisites" content="{cfg['prereqs']}">
<meta name="teachany-version" content="2.0">
<meta name="teachany-author" content="TeachAny">
<meta name="teachany-difficulty" content="medium">
<meta name="course-prereqs" content="{cfg['prereqs']}">"""


def make_abt_section(cfg):
    """生成 ABT 引入 section"""
    return f"""
<!-- ===== #01 ABT 叙事引入 ===== -->
<section class="section" id="s-abt" style="min-height:auto;padding:40px 20px;">
  <div style="width:100%;max-width:720px;margin:0 auto;">
    <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:20px;padding-left:14px;border-left:4px solid var(--primary,#ff6b6b);">💭 为什么要学这个？</h2>
    <div class="card" style="background:linear-gradient(135deg,#fff9f0,#fff);border-left:5px solid var(--primary,#ff6b6b);max-width:700px;">
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div style="padding:16px;background:#fff3e0;border-radius:14px;">
          <span style="font-size:1.2rem;font-weight:800;color:#e65100;">✅ 你已经知道</span>
          <p style="margin-top:8px;font-size:1.05rem;line-height:1.7;">{cfg['abt_and']}</p>
        </div>
        <div style="padding:16px;background:#fce4ec;border-radius:14px;">
          <span style="font-size:1.2rem;font-weight:800;color:#c62828;">⚠️ 但问题是</span>
          <p style="margin-top:8px;font-size:1.05rem;line-height:1.7;">{cfg['abt_but']}</p>
        </div>
        <div style="padding:16px;background:#e8f5e9;border-radius:14px;">
          <span style="font-size:1.2rem;font-weight:800;color:#2e7d32;">🎯 所以今天</span>
          <p style="margin-top:8px;font-size:1.05rem;line-height:1.7;">{cfg['abt_therefore']}</p>
        </div>
      </div>
    </div>
  </div>
</section>"""


def make_pretest_section(cfg):
    """生成前测 section"""
    opts = cfg['pretest_opts']
    ans = cfg['pretest_ans']
    opts2 = cfg['pretest_opts2']
    ans2 = cfg['pretest_ans2']
    
    q1_options = ""
    for opt in opts:
        letter = opt[0]
        text = opt[3:]
        selected_style = ' style="background:var(--primary,#ff6b6b)33;border-color:var(--primary,#ff6b6b);"' if letter == ans else ""
        q1_options += f'<div class="quiz-option" onclick="checkPretest(this,\'{letter}\',\'{ans}\',\'pt1\')" data-val="{letter}"{selected_style}>{opt}</div>\n          '

    q2_options = ""
    for opt in opts2:
        letter = opt[0]
        q2_options += f'<div class="quiz-option" onclick="checkPretest(this,\'{letter}\',\'{ans2}\',\'pt2\')" data-val="{letter}">{opt}</div>\n          '

    return f"""
<!-- ===== #02 前测 ===== -->
<section class="section" id="s-pretest" style="min-height:auto;padding:40px 20px;">
  <div style="width:100%;max-width:720px;margin:0 auto;">
    <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:8px;padding-left:14px;border-left:4px solid var(--secondary,#4ecdc4);">🧪 前测：你已经知道什么？</h2>
    <p style="color:#636e72;margin-bottom:20px;padding-left:18px;">测一测，帮助我们了解你的基础（不计入成绩）</p>
    
    <div class="card" style="max-width:700px;margin-bottom:16px;">
      <p style="font-weight:700;margin-bottom:12px;">题1：{cfg['pretest_q']}</p>
      <div id="pt1" style="display:flex;flex-direction:column;gap:8px;">
        {q1_options}
      </div>
      <div id="pt1-fb" style="margin-top:10px;display:none;padding:10px;border-radius:10px;font-size:0.95rem;"></div>
    </div>
    
    <div class="card" style="max-width:700px;margin-bottom:20px;">
      <p style="font-weight:700;margin-bottom:12px;">题2：{cfg['pretest_q2']}</p>
      <div id="pt2" style="display:flex;flex-direction:column;gap:8px;">
        {q2_options}
      </div>
      <div id="pt2-fb" style="margin-top:10px;display:none;padding:10px;border-radius:10px;font-size:0.95rem;"></div>
    </div>
    
    <p style="color:#636e72;font-size:0.9rem;text-align:center;">💡 无论答对答错，继续学习都会有收获！</p>
  </div>
</section>"""


def make_posttest_section(cfg):
    """生成后测 section"""
    opts = cfg['posttest_opts']
    ans = cfg['posttest_ans']
    opts2 = cfg['posttest_opts2']
    ans2 = cfg['posttest_ans2']
    
    q1_options = ""
    for opt in opts:
        letter = opt[0]
        q1_options += f'<div class="quiz-option" onclick="checkPosttest(this,\'{letter}\',\'{ans}\',\'post1\')" data-val="{letter}">{opt}</div>\n          '

    q2_options = ""
    for opt in opts2:
        letter = opt[0]
        q2_options += f'<div class="quiz-option" onclick="checkPosttest(this,\'{letter}\',\'{ans2}\',\'post2\')" data-val="{letter}">{opt}</div>\n          '

    return f"""
<!-- ===== #05 后测 ===== -->
<section class="section" id="s-posttest" style="min-height:auto;padding:40px 20px;">
  <div style="width:100%;max-width:720px;margin:0 auto;">
    <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:8px;padding-left:14px;border-left:4px solid var(--accent,#ffe66d);">📝 后测：学会了吗？</h2>
    <p style="color:#636e72;margin-bottom:20px;padding-left:18px;">和前测对比，看看你进步了多少！</p>
    
    <div class="card" style="max-width:700px;margin-bottom:16px;">
      <p style="font-weight:700;margin-bottom:12px;">题1：{cfg['posttest_q']}</p>
      <div id="post1" style="display:flex;flex-direction:column;gap:8px;">
        {q1_options}
      </div>
      <div id="post1-fb" style="margin-top:10px;display:none;padding:10px;border-radius:10px;font-size:0.95rem;"></div>
    </div>
    
    <div class="card" style="max-width:700px;margin-bottom:20px;">
      <p style="font-weight:700;margin-bottom:12px;">题2：{cfg['posttest_q2']}</p>
      <div id="post2" style="display:flex;flex-direction:column;gap:8px;">
        {q2_options}
      </div>
      <div id="post2-fb" style="margin-top:10px;display:none;padding:10px;border-radius:10px;font-size:0.95rem;"></div>
    </div>
    
    <div id="posttest-summary" style="display:none;padding:20px;background:linear-gradient(135deg,#e8f5e9,#f3e5f5);border-radius:16px;text-align:center;">
      <div style="font-size:2rem;margin-bottom:8px;">🎉</div>
      <p style="font-weight:800;font-size:1.2rem;">后测完成！</p>
      <p id="posttest-msg" style="color:#636e72;margin-top:8px;"></p>
    </div>
  </div>
</section>"""


def make_memory_anchor_section(cfg):
    """生成记忆锚点 section（插入到已有内容中的结尾）"""
    return f"""
<!-- ===== #17 记忆锚点 ===== -->
<section class="section" id="s-memory-anchor" style="min-height:auto;padding:40px 20px;">
  <div style="width:100%;max-width:720px;margin:0 auto;">
    <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:20px;padding-left:14px;border-left:4px solid #a29bfe;">🧠 记忆锚点</h2>
    <div class="card" style="max-width:700px;background:linear-gradient(135deg,#f3e5f5,#e8eaf6);border:none;">
      <div style="text-align:center;padding:12px;">
        <div style="font-size:2.5rem;margin-bottom:12px;">🎯</div>
        <div style="font-size:1.15rem;line-height:1.9;font-weight:600;color:#4a148c;">{cfg['memory_anchor']}</div>
      </div>
    </div>
    <div style="max-width:700px;margin-top:16px;padding:16px;background:#fffde7;border-radius:14px;border-left:4px solid #f9ca24;">
      <p style="font-size:0.95rem;color:#636e72;font-weight:600;">💡 类比记忆：把今天的知识和你已经知道的事物联系起来，记得更牢！</p>
    </div>
  </div>
</section>"""


def make_error_section(cfg):
    """生成易错点 section"""
    return f"""
<!-- ===== #18 易错点 ===== -->
<section class="section" id="s-error-prone" style="min-height:auto;padding:40px 20px;">
  <div style="width:100%;max-width:720px;margin:0 auto;">
    <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:20px;padding-left:14px;border-left:4px solid #e17055;">🚨 易错点诊断室</h2>
    <div class="card" style="max-width:700px;border-left:5px solid #e17055;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <span style="font-size:1.5rem;">⚠️</span>
        <span style="font-weight:800;font-size:1.05rem;color:#c0392b;">高频易错：{cfg['error_desc']}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
        <div style="padding:14px;background:#ffebee;border-radius:12px;">
          <p style="font-size:0.8rem;font-weight:700;color:#c62828;margin-bottom:6px;">❌ 常见错误</p>
          <p style="font-size:0.95rem;line-height:1.6;">{cfg['error_wrong']}</p>
        </div>
        <div style="padding:14px;background:#e8f5e9;border-radius:12px;">
          <p style="font-size:0.8rem;font-weight:700;color:#2e7d32;margin-bottom:6px;">✅ 正确做法</p>
          <p style="font-size:0.95rem;line-height:1.6;">{cfg['error_right']}</p>
        </div>
      </div>
      <div style="padding:12px;background:#fff8e1;border-radius:10px;border-left:3px solid #f9ca24;">
        <p style="font-size:0.9rem;color:#636e72;line-height:1.7;"><strong>🩺 错因诊断：</strong>{cfg['error_diag']}</p>
      </div>
    </div>
  </div>
</section>"""


def make_ai_interaction_section(cfg):
    """生成 AI 多模态互动区 section"""
    return f"""
<!-- ===== #14 AI 多模态互动区 ===== -->
<section class="section" id="ai-interaction" style="min-height:auto;padding:40px 20px;">
  <div style="width:100%;max-width:720px;margin:0 auto;">
    <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:8px;padding-left:14px;border-left:4px solid #00b894;">🤖 AI 多模态互动区</h2>
    <p style="color:#636e72;margin-bottom:20px;padding-left:18px;">把你的问题告诉 AI，或上传图片让 AI 帮你分析</p>
    
    <div class="card" style="max-width:700px;">
      <div style="margin-bottom:16px;">
        <label style="display:block;font-weight:700;margin-bottom:8px;font-size:0.95rem;">💬 提示词建议：</label>
        <div style="padding:12px;background:#f0f4ff;border-radius:10px;font-size:0.9rem;color:#5c6bc0;cursor:pointer;" onclick="copyPrompt(this)">
          {cfg['ai_prompt']}
          <span style="font-size:0.75rem;color:#9e9e9e;display:block;margin-top:6px;">点击复制此提示词 →</span>
        </div>
      </div>
      
      <div style="margin-bottom:16px;">
        <label style="display:block;font-weight:700;margin-bottom:8px;font-size:0.95rem;">✍️ 输入你的问题：</label>
        <textarea id="ai-input" placeholder="在这里输入你的问题，或粘贴需要分析的文字..." 
          style="width:100%;height:100px;padding:12px;border:2px solid #dfe6e9;border-radius:12px;font-size:0.95rem;font-family:inherit;resize:vertical;outline:none;transition:border-color 0.2s;"
          onfocus="this.style.borderColor='var(--primary,#ff6b6b)'" 
          onblur="this.style.borderColor='#dfe6e9'"></textarea>
      </div>
      
      <div style="margin-bottom:16px;">
        <label style="display:block;font-weight:700;margin-bottom:8px;font-size:0.95rem;">🖼️ 上传图片（可选）：</label>
        <div id="ai-upload-area" style="border:2px dashed #dfe6e9;border-radius:12px;padding:20px;text-align:center;cursor:pointer;transition:all 0.2s;"
          onclick="document.getElementById('ai-file-input').click()"
          ondragover="event.preventDefault();this.style.borderColor='var(--primary,#ff6b6b)'"
          ondrop="handleAiDrop(event)">
          <span style="font-size:2rem;">📎</span>
          <p style="color:#636e72;margin-top:8px;font-size:0.9rem;">点击或拖拽图片到这里</p>
        </div>
        <input type="file" id="ai-file-input" accept="image/*" style="display:none" onchange="previewAiImage(event)">
        <div id="ai-preview" style="display:none;margin-top:12px;text-align:center;">
          <img id="ai-preview-img" style="max-width:100%;max-height:200px;border-radius:10px;border:2px solid #dfe6e9;" src="" alt="预览">
        </div>
      </div>
      
      <button onclick="submitAiQuestion()" style="width:100%;padding:14px;background:linear-gradient(135deg,#00b894,#26de81);color:#fff;border:none;border-radius:14px;font-size:1rem;font-weight:700;cursor:pointer;transition:transform 0.15s;" 
        onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform=''">
        🚀 发送给 AI（打开你的 AI 助手粘贴）
      </button>
    </div>
    
    <div id="ai-copied-tip" style="display:none;margin-top:12px;padding:12px;background:#e8f5e9;border-radius:10px;text-align:center;color:#2e7d32;font-weight:600;">
      ✅ 提示词已复制到剪贴板，请打开 AI 助手粘贴！
    </div>
  </div>
  
  <script>
  function copyPrompt(el) {{
    const text = el.innerText.replace('点击复制此提示词 →','').trim();
    navigator.clipboard.writeText(text).then(() => {{
      document.getElementById('ai-copied-tip').style.display = 'block';
      setTimeout(() => document.getElementById('ai-copied-tip').style.display = 'none', 3000);
    }}).catch(() => {{
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      document.getElementById('ai-copied-tip').style.display = 'block';
      setTimeout(() => document.getElementById('ai-copied-tip').style.display = 'none', 3000);
    }});
  }}
  function previewAiImage(event) {{
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {{
      document.getElementById('ai-preview-img').src = e.target.result;
      document.getElementById('ai-preview').style.display = 'block';
    }};
    reader.readAsDataURL(file);
  }}
  function handleAiDrop(event) {{
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {{
      const reader = new FileReader();
      reader.onload = e => {{
        document.getElementById('ai-preview-img').src = e.target.result;
        document.getElementById('ai-preview').style.display = 'block';
      }};
      reader.readAsDataURL(file);
    }}
  }}
  function submitAiQuestion() {{
    const q = document.getElementById('ai-input').value.trim();
    const prompt = `{cfg['ai_prompt']}\\n\\n学生问题：${{q}}`;
    navigator.clipboard.writeText(prompt).then(() => {{
      document.getElementById('ai-copied-tip').style.display = 'block';
      document.getElementById('ai-copied-tip').innerText = '✅ 问题已复制！请打开你的 AI 助手（如 ChatGPT/文心一言）粘贴并发送。';
      setTimeout(() => document.getElementById('ai-copied-tip').style.display = 'none', 5000);
    }});
  }}
  </script>
</section>"""


def make_pretest_js():
    """生成前测和后测的 JS 逻辑"""
    return """
<script>
// ===== 前测 JS =====
function checkPretest(el, selected, correct, groupId) {
  const group = document.getElementById(groupId);
  if (group.dataset.answered) return;
  group.dataset.answered = '1';
  const fb = document.getElementById(groupId + '-fb');
  const opts = group.querySelectorAll('.quiz-option');
  opts.forEach(opt => {
    opt.style.pointerEvents = 'none';
    if (opt.dataset.val === correct) opt.style.background = '#e8f5e9';
    if (opt.dataset.val === selected && selected !== correct) opt.style.background = '#ffebee';
  });
  fb.style.display = 'block';
  if (selected === correct) {
    fb.style.background = '#e8f5e9'; fb.style.color = '#2e7d32';
    fb.innerHTML = '✅ 太棒了！答对了！';
  } else {
    fb.style.background = '#fff3e0'; fb.style.color = '#e65100';
    fb.innerHTML = '💡 还没学到没关系，学完后你一定会！';
  }
}

// ===== 后测 JS =====
let posttestScore = 0;
let posttestTotal = 0;
function checkPosttest(el, selected, correct, groupId) {
  const group = document.getElementById(groupId);
  if (group.dataset.answered) return;
  group.dataset.answered = '1';
  posttestTotal++;
  const fb = document.getElementById(groupId + '-fb');
  const opts = group.querySelectorAll('.quiz-option');
  opts.forEach(opt => {
    opt.style.pointerEvents = 'none';
    if (opt.dataset.val === correct) opt.style.background = '#e8f5e9';
    if (opt.dataset.val === selected && selected !== correct) opt.style.background = '#ffebee';
  });
  fb.style.display = 'block';
  if (selected === correct) {
    posttestScore++;
    fb.style.background = '#e8f5e9'; fb.style.color = '#2e7d32';
    fb.innerHTML = '✅ 正确！学以致用，很棒！';
  } else {
    fb.style.background = '#ffebee'; fb.style.color = '#c62828';
    fb.innerHTML = '❌ 不对哦，回顾一下上面的知识点再试试？';
  }
  if (posttestTotal === 2) {
    const summary = document.getElementById('posttest-summary');
    const msg = document.getElementById('posttest-msg');
    summary.style.display = 'block';
    if (posttestScore === 2) msg.innerText = '🎉 全对！你已经完全掌握了本课的核心内容！';
    else if (posttestScore === 1) msg.innerText = '👍 答对了一半，再复习一下易错点吧！';
    else msg.innerText = '💪 没关系，重新学一遍效果会更好！';
    if (typeof addStars === 'function') addStars(posttestScore * 10);
  }
}
</script>"""


def make_quiz_option_style():
    """确保 quiz-option 有样式"""
    return """
<style>
.quiz-option{padding:12px 16px;border:2px solid #dfe6e9;border-radius:12px;cursor:pointer;font-size:0.95rem;transition:all 0.2s;background:#fff;}
.quiz-option:hover{border-color:var(--primary,#ff6b6b);background:#fff5f5;}
</style>"""


def upgrade_courseware(course_id, cfg):
    html_path = os.path.join(BASE, course_id, "index.html")
    if not os.path.exists(html_path):
        print(f"  ❌ 文件不存在: {html_path}")
        return False
    
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    original_html = html
    
    # 1. 注入 meta 标签（在 </head> 前）
    meta_block = make_meta_block(cfg)
    if 'teachany-node' not in html:
        html = html.replace('</head>', meta_block + '\n</head>', 1)
    
    # 2. 注入 quiz-option 样式
    if 'quiz-option' not in html:
        html = html.replace('</style>', make_quiz_option_style() + '\n</style>', 1)
    
    # 3. 收集需要插入 </body> 前的内容
    new_sections = []
    new_js = []
    
    # ABT 引入
    if 'id="s-abt"' not in html and 'id="abt"' not in html:
        new_sections.append(make_abt_section(cfg))
    
    # 前测
    if 'id="s-pretest"' not in html and 'id="pretest"' not in html:
        new_sections.append(make_pretest_section(cfg))
        new_js.append(make_pretest_js())
    
    # 后测
    if 'id="s-posttest"' not in html and 'id="posttest"' not in html:
        new_sections.append(make_posttest_section(cfg))
    
    # 记忆锚点
    if 'id="s-memory-anchor"' not in html and '记忆锚点' not in html and 'memory-anchor' not in html:
        new_sections.append(make_memory_anchor_section(cfg))
    
    # 易错点
    if 'id="s-error-prone"' not in html and '易错点' not in html and 'error-prone' not in html:
        new_sections.append(make_error_section(cfg))
    
    # AI 互动区
    if 'id="ai-interaction"' not in html:
        new_sections.append(make_ai_interaction_section(cfg))
    
    # 将所有新 section 和 JS 插入 </body> 前
    if new_sections or new_js:
        insert_content = '\n'.join(new_sections) + '\n'.join(new_js)
        html = html.replace('</body>', insert_content + '\n</body>', 1)
    
    # 写回文件
    if html != original_html:
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html)
        return True
    return False


def main():
    print("=" * 60)
    print("TeachAny Batch 5 课件升级")
    print("=" * 60)
    
    for course_id, cfg in COURSES.items():
        print(f"\n📚 升级 {course_id}...")
        ok = upgrade_courseware(course_id, cfg)
        if ok:
            print(f"  ✅ 已写入")
        else:
            print(f"  ⚠️  未修改（已存在或文件不存在）")
    
    print("\n✅ 升级完成！")


if __name__ == "__main__":
    main()
