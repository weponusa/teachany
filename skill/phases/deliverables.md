# 输出物要求与 L2/L3 触发机制

> **所属**：TeachAny 技能 · 卫星文档
> **触发时机**：L2 / L3 交付决策点
> **主文档**：[../SKILL_CN.md](../SKILL_CN.md)
>
> 本文件从 SKILL_CN.md 主文拆出，按需加载以避免上下文爆炸。

---

## 十二、输出物要求与 L2/L3 触发机制

### 输出层级

| 层级 | 名称 | 是否必选 | 触发条件 |
|:---|:---|:---|:---|
| **L1** | 互动课件 | ✅ **必选** | 所有任务都必须生成 |
| **L2** | 教学动画 | 🔶 **显式决策** | 用户要求，或 Generation Gate 标注"需要" |
| **L3** | AI 语音讲解 | ✅ **默认必选** | 自动执行，除非用户明确拒绝 |
| **L4** | 课件打包（.teachany） | ✅ **默认必选** | Phase 3.5 自动执行 |
| **L5** | PPTX 导出 | 🔶 **显式触发** | 用户在 Phase 0 第 8 步要求 PPT/PPTX/幻灯片/讲义版时触发，默认跳过 |

> 💡 **v5.34 起**：L5 为"离线讲解派生层"，由 `scripts/export-pptx.py` 从已完成的 HTML 课件派生生成，不替代 L1-L4 任何基线能力。互动组件（Canvas/知识图谱/AI 学伴/音频播放）在 PPTX 中自动降级为"扫码/点链接回到 HTML 版"的占位页。

### L1 — 互动课件（必选，不可跳过）

- `index.html`：完整互动网页课件（中文）
- `index_en.html`：完整互动网页课件（英文）— **用户明确要求双语时生成**，默认仅中文
- 必须包含：练习题与答案反馈设计、前测/后测题组、模块化教学文案
- 推荐包含：开放任务量规

**L1 最低完整性标准**：
- [ ] 有 ABT 引入（每个核心模块）
- [ ] 有互动练习（不只选择题）
- [ ] 有诊断性反馈（不只"正确/错误"）
- [ ] 有前测和后测
- [ ] Bloom 覆盖 ≥ 3 级
- 不满足以上任何一项 = L1 未完成，禁止交付。

### L2 — 教学动画（默认必选，自动执行）

> v5.12 起：L2 从"显式触发"升级为基线能力，与 L3 同级。每个课件必须交付至少一段 Remotion 渲染的 mp4。

**触发方式**：
- ✅ 默认始终触发（Phase 0 基线清单中勾选开启）
- ⛔ 仅当满足以下**全部**条件时可跳过：
  1. Node.js 环境彻底不可用且 AI 自动安装失败
  2. Generation Gate 中明确记录失败原因
  3. 用户书面确认豁免

**文件清单**：
- `src/compositions/*.tsx`：教学动画组件（文科可用意境/诵读/历史演变；理工可用过程/实验/证明）
- `src/Root.tsx`：Remotion 注册文件
- `src/SfxPlayer.tsx`：音效播放器组件
- `src/SubtitleTrack.tsx`：双语字幕叠加组件
- `generate-sfx.js`：音效生成器
- `package.json` / `tsconfig.json` / `remotion.config.ts`：项目配置
- **`assets/video/*.mp4`：渲染产出，必须被 HTML `<video>` 标签嵌入到对应 section**

### L3 — AI 语音讲解（默认必选，自动执行）

> ⚠️ **L3 与 L1 同为必选层级**。每个课件生成后，AI 必须自动安装 edge-tts 并生成语音文件，无需等待用户确认。
> **唯一跳过条件**：用户在下达任务时明确说了"不要语音""不要配音""不要TTS""不需要音频"等拒绝性表述。
>
> ⛔ **严禁在课件中自行手写 Web Speech API（`window.speechSynthesis`）代码块**。TTS 朗读必须通过标准模块 `teachany-tts-narrator.js` 实现（该模块内部使用 Web Speech API 作为零 mp3 回退是允许的，但 AI 不得在课件 HTML 中手写 `speechSynthesis` 代码）。L3 TTS 必须使用 edge-tts 生成独立的 mp3 文件存放在 `tts/` 目录下。任何在 HTML 中手写 `speechSynthesis` 代码块的课件，Completeness Gate 直接判定 L3 不通过。

**自动执行流程**（L1 课件完成后立即执行）：
1. 检测 Python → 缺失则自动安装
2. 检测 edge-tts → 缺失则自动 `pip3 install edge-tts`
3. 从课件内容中提取各模块的讲解文案，生成旁白脚本 JSON
4. 执行 `python3 scripts/generate-tts.py` 生成 mp3 语音文件
5. 执行 `python3 scripts/generate-srt.py zh` 生成 SRT 字幕
6. 将语音文件路径嵌入课件 HTML 的 `<audio>` 标签中

**降级策略**：
| 情况 | 处理方式 |
|:---|:---|
| edge-tts 安装失败（网络问题） | 保留旁白脚本 JSON，在课件中标注"语音文件待生成"，提示用户联网后执行 `pip3 install edge-tts && python3 scripts/generate-tts.py` |
| TTS 生成失败（网络中断） | 保留脚本文件，提示用户在网络正常时重新执行 |
| Python 不可用且无法安装 | 生成旁白脚本 JSON + generate-tts.py，提示用户安装 Python 后执行 |
| ⛔ **任何情况都不得降级为 Web Speech API** | Web Speech API 不是合法的降级方案。宁可不带语音，也不用浏览器合成 |

**文件清单**：
- `scripts/narration_zh.json`：中文旁白脚本（含帧时间戳）
- `scripts/narration_en.json`：英文旁白脚本（含帧时间戳）
- `scripts/generate-tts.py`：Edge TTS 生成脚本
- `scripts/generate-srt.py`：SRT 字幕导出脚本
- `tts/*.mp3`：生成的语音音频文件
- `tts/*.srt`：生成的字幕文件

### L2 主动建议规则

L3 已默认执行，无需建议。以下规则仅适用于 L2 教学动画。即使用户未要求 L2，如果课件内容中存在以下情况，**必须在 Phase 4 交付时主动提示**：

| 课件内容特征 | 建议 |
|:---|:---|
| 理科实验过程（物理/化学/生物实验） | 建议 L2 动画演示实验过程 |
| 数学函数图像变化、几何变换 | 建议 L2 动画展示动态变化 |
| 地理气候变化、板块运动等过程 | 建议 L2 动画展示时空变化 |

---

