---
name: TeachAny
version: 7.17.0
description: "K-12 interactive courseware creation for lesson pages, animations, AI tutor, TTS, knowledge graph, PBL paths, and TeachAny publishing."
allowed-tools: Read,Write,Edit,Bash,Glob,Grep
---

# TeachAny – K12 Interactive Courseware Skill

This repository root file is a lightweight pointer. The executable skill lives in `./teachany/`.

Read first:

- `./teachany/SKILL.md` — concise execution summary and routing table

Load only when needed:

- `./teachany/phases/workflow.md` — full workflow
- `./teachany/phases/packaging.md` — publish / registry / Gallery
- `./teachany/references/baseline-rules.md` and `./teachany/RULES.md` — complete baseline and hard rules
- `./teachany/templates/` — courseware skeletons
- `./teachany/scripts/` — validation, TTS, map, hero, **`hang_tree.py`** (挂树/发布，无需事先 clone courseware)

Full website (Gallery, PBL, knowledge map, APIs) lives in the courseware repository:

- Repo: https://github.com/weponusa/teachany-courseware
- Site: https://www.teachany.cn/
