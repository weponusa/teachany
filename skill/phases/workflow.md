# TeachAny Phase Workflow（精简版）

本文件给完整模式使用。快速模式只执行必要子集：模板 → 真实互动 → 验证 → 本地交付。

## Phase 0：定义与检索

目标：明确用户、主题、学段、课型、交付模式。

最少确认：
1. 学生年级/学段；
2. 知识点或问题；
3. 输出模式：快速 HTML / 完整课件 / 发布到 Gallery；
4. 是否需要 TTS、视频、PBL、地图等增强项。

操作：
- 查 `node_id`：`python3 scripts/find_nodes.py "主题"`。
- 若主题不在课标：先找相近节点，再注册；确实无法归类才 `free_mode`。
- 完整模式可跑 `python3 scripts/preflight-check.py` 检查 Python/Git/Node/ffmpeg/TTS。

## Phase 1：教学骨架

输出一个可执行教学计划：
- 课型：`new-concept` / `review` / `experiment` / `special-topic` / `inquiry-project`。
- 问题锚点：学生一进入页面先选择/输入要解决的问题。
- ABT 叙事：And（已有经验）→ But（冲突/困惑）→ Therefore（本课任务）。
- 互动设计：至少一个真实操作组件。
- 评估设计：前测/即时反馈/迁移题。

PBL 课用：问题 → 假设 → 尝试 → 暴露知识缺口 → 学习 → 再尝试 → 反思。

## Phase 2：构建

1. 复制模板：
   ```bash
   cp templates/course-skeleton.html <course>/index.html
   cp templates/manifest-template.json <course>/manifest.json
   ```
2. 填 `course-id`、`node_id`、学科、年级、先修/后续知识。
3. 保留标准模块挂载，不重复手写平台代码。
4. 加入问题锚点、主体 section、互动组件、练习反馈。
5. 完整模式补齐 Hero、TTS、视频/地图等资源。

## Phase 3：验证

快速模式：
- 本地打开 HTML；检查无 JS 报错、互动可用、移动端布局不崩。

完整模式：
```bash
node "$TEACHANY_SKILL/scripts/validate-courseware.cjs" "$COURSE_DIR"
python3 "$TEACHANY_SKILL/scripts/check_node_id.py" <node_id>
```
必要时浏览器验证：AI 学伴可打开、知识图谱 tooltip 可点击、音频/视频可播放。

## Phase 4：发布

仅在用户要求发布或任务本身是发布/维护时执行。

1. courseware 仓库提交 full courseware。
2. opensource 仓库放 redirect/manifest，运行：
   ```bash
   python3 scripts/rebuild-index.py
   ```
3. 提交并推送。
4. 用 GitHub Pages / raw URL 验证线上可访问。

## Gate 输出格式

交付时给出：
- 模式：快速 / 完整 / 维护；
- 关键文件；
- 验证命令与输出；
- 发布 URL（如有）；
- 未启用或降级项（如有）。
