# TeachAny Baseline Rules（精简版）

完整模式的基线能力按“学习闭环 + 平台发布闭环”组织。快速模式可暂缓增强项，但不得破坏核心学习体验。

## 快速模式最低基线

1. 问题锚点：学生先选择/输入问题。
2. 真实互动：至少一个 Canvas/SVG/DOM 操作组件。
3. 即时反馈：至少一组练习或判断反馈。
4. 标准模块占位：AI 学伴、知识图谱、section hints、TTS narrator 按模板挂载。
5. 移动端可用：按钮 ≥44px、无 hover-only 核心功能。

## 完整模式 19 项基线

1. TTS 旁白音频或标准 narrator。
2. 至少一个教学动画/视频（课型需要时）。
3. Canvas/SVG 真实互动。
4. 学科插图或场景图。
5. Hero 知识结构图。
6. 音频播放器或连续讲解入口。
7. 标准知识图谱模块。
8. 标准 AI 学伴入口卡片。
9. section hints。
10. TTS narrator。
11. AI tutor JS。
12. knowledge graph JS/CSS。
13. 五件套完整挂载。
14. manifest 元信息完整。
15. 顶部 TeachAny 品牌栏与版本。
16. 历史/地理使用标准地图模块与地图库。
17. 发布注册：registry / community index / knowledge graph manifest。
18. 问题锚点模块。
19. 移动端与小程序 web-view 准备。

## 关键禁令

- 禁止用静态图伪装互动。
- 禁止手写知识图谱、AI 学伴卡片、TTS 控制器来替代标准模块。
- 禁止手改 registry 类生成文件。
- 禁止把完整课件 HTML 放入 opensource 仓库。
- 禁止在没有证据时声称线上可访问。

## 常用验证

```bash
node "$TEACHANY_SKILL/scripts/validate-courseware.cjs" "$COURSE_DIR"
python3 "$TEACHANY_SKILL/scripts/find_nodes.py" "知识点"
python3 "$TEACHANY_SKILL/scripts/find-map.py" 唐
python3 scripts/find-hero.py <course-id>
python3 scripts/rebuild-index.py
```

## 反模式速查

| 反模式 | 正确做法 |
|---|---|
| 先写漂亮页面再补教学 | 先问题锚点和学习闭环 |
| 全文讲解无操作 | 每个核心概念至少一个可操作点 |
| AI 学伴只放 FAB | 正文靠前加导师卡片 |
| 图谱手写 SVG | 用 `data-teachany-kg` 标准模块 |
| 地图手写 Leaflet | 用 TeachAny 地图模块和 `find-map.py` |
| 只本地保存 | 正式模式必须发布并验证 URL |
