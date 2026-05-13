# 四大发明与中国古代科技 PLAN

## 1. 教学目标与范围

本课面向高中历史科技史专题，围绕四大发明的发明、成熟、外传和世界影响展开，引导学生理解古代中国技术创新能力与近代科学方法论之间的差异。

## 2. 模块级媒体策划表

| # | 模块名 | 知识点 | 媒体形式 | 资产文件名 | 生成命令 | 校验命令 |
|---|---|---|---|---|---|---|
| 1 | 故事开场 | 四大发明的世界传播问题 | 标准模块 | inline-abt-opening | python3 gen_html.py | python3 scripts/validate-courseware.py hist-h-four-great-inventions |
| 2 | 四大发明详解 | 造纸、印刷、指南针、火药 | SVG 插图 | inline-route-svg | python3 gen_html.py | grep -n "四大发明世界传播路线" index.html |
| 3 | 古代科技群星 | 天文历法、数学、农学、医学 | 标准模块 | inline-tech-grid | python3 gen_html.py | grep -n "古代科技群星" index.html |
| 4 | 李约瑟之问 | 技术创新与科学方法论差异 | 标准模块 | inline-compare-table | python3 gen_html.py | grep -n "李约瑟之问" index.html |
| 5 | 练习与迁移 | 基础、应用、迁移挑战 | 标准模块 | inline-quiz-blocks | python3 gen_html.py | grep -n "迁移挑战" index.html |
| 6 | 知识图谱 | 高中历史科技史节点挂载 | 标准公共模块 | data-teachany-kg="hist-h-science-technology-h" | python3 gen_html.py | python3 scripts/check-knowledge-graph.py community/hist-h-four-great-inventions |

## 3. 五件套自检清单

- [x] Hero/开场情境已提供，并以核心问题导入。
- [x] 核心知识讲解覆盖四大发明、古代科技群星和李约瑟之问。
- [x] 互动练习包含前测、基础题、史料分析题和开放迁移题。
- [x] 知识图谱使用 TeachAny 标准公共模块挂载。
- [x] 课程注册信息写入 manifest，并能通过 rebuild-index.py 挂载到知识树。

## 4. Subagent 派遣记录

本课未派遣独立 subagent，采用主流程直接生成和修复。后续如补充 TTS、Remotion 视频和高质量 Hero 图，可拆分给媒体生成 subagent。

## 5. 质量校验记录

已执行 `python3 gen_html.py` 生成 `index.html`；已执行 `python3 scripts/rebuild-index.py` 将课程挂载到 `hist-h-science-technology-h`；提交前由 pre-commit 继续执行结构、PLAN、质量和知识图谱四项检查。

## 6. 发布记录

课程目录为 `community/hist-h-four-great-inventions/`，线上路径为 `https://weponusa.github.io/teachany/community/hist-h-four-great-inventions/`，知识树节点为高中历史 `hist-h-science-technology-h`。
