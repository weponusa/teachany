# 十五、视频与音频制作流水线

> 本文件是 SKILL_CN.md 的「十五、视频与音频制作流水线」章节的详细内容，按需加载以节省上下文。
> 触发条件：需要生成 **TTS 音频**、口播视频或 SRT 字幕时。

---


TeachAny 在互动 HTML 课件之上，支持可选的**视频 + AI 配音**增强层。本节定义从自动化环境搭建、语音生成到双语字幕渲染的完整流水线。

> ⚠️ **核心原则**：用户只需要说"我要视频/配音"，**AI 自动完成所有环境检测、依赖安装、代码生成和渲染执行**。用户不需要手动输入任何 `npm install` 或 `pip install` 命令。

### 15.1 架构分层

| 层级 | 产物 | 依赖 | AI 自动安装 | 是否必选 |
|:-----|:-----|:-----|:------|:---------|
| **L1 — 互动课件** | `index.html`（+ 用户要求时 `index_en.html`） | 无（零依赖） | 不需要 | ✅ 始终提供（默认仅中文） |
| **L2 — 教学动画** | `assets/*.mp4`（Remotion 渲染） | Node.js ≥ 18、npm、ffmpeg | ✅ AI 自动检测安装 | ✅ **默认必选**（v5.12 起升级，Section 0 硬规则 #32） |
| **L3 — AI 语音讲解** | `tts/*.mp3` + `tts/*.srt` | Python 3.8+、edge-tts | ✅ AI 自动检测安装 | ✅ **默认必选** |
| **L4 — 课件打包** | `*.teachany` 包 | Node.js（pack-courseware.cjs） | ✅ AI 自动执行 | ✅ **默认必选** |

**L1 + L2 + L3 + L4 全部默认自动执行。v5.12 起 L2 从"渐进式增强"升级为"基线必选"。**

### 15.2 L2 环境自动搭建（Remotion）

> **v5.12 起：L2 为基线能力，Phase 0.5 阶段必须自动执行以下全部步骤，不等待用户确认。仅当安装彻底失败且用户书面豁免时才能跳过。**

#### 自动化流程（AI 逐步执行）

```text
┌─────────────────────────────────────────────────────────┐
│  L2 自动安装流程（AI 在终端中依次执行）                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. 检测 Node.js                                        │
│     → node -v                                           │
│     → 缺失/版本不足？安装：install_binary node 20.19.0  │
│                                                         │
│  2. 检测 ffmpeg                                         │
│     → ffmpeg -version                                   │
│     → 缺失？                                           │
│       macOS: brew install ffmpeg                        │
│       Linux: sudo apt install ffmpeg -y                 │
│       Windows: choco install ffmpeg -y                  │
│     → 安装失败？标注"L2 渲染不可用，仅生成代码"           │
│                                                         │
│  2.5 安装中文字体（Noto Sans SC）                         │
│     → 检测字体：fc-list :lang=zh 2>/dev/null            │
│     → 无中文字体？                                      │
│       macOS: 系统自带 PingFang SC，跳过                  │
│       Linux: sudo apt install -y fonts-noto-cjk         │
│              或 下载 Noto Sans SC 到 ~/.local/share/fonts│
│       Windows: 系统自带 Microsoft YaHei，跳过            │
│     → 安装后刷新缓存：fc-cache -fv                       │
│     → ⚠️ 必须确保 Remotion 渲染时能找到中文字体         │
│                                                         │
│  3. 生成 package.json（含 Remotion 依赖）                │
│                                                         │
│  4. 执行 npm install                                    │
│                                                         │
│  5. 生成配置文件                                         │
│     → tsconfig.json                                     │
│     → remotion.config.ts                                │
│                                                         │
│  6. 生成音效：node generate-sfx.js                      │
│                                                         │
│  7. 编写动画组件代码                                     │
│     → src/compositions/*.tsx                            │
│     → src/Root.tsx / SfxPlayer.tsx / SubtitleTrack.tsx   │
│                                                         │
│  8. 渲染视频：npm run build:all                         │
│                                                         │
│  ✅ 完成 → 输出 out/*.mp4                               │
│  ⚠️ 渲染失败 → 代码已生成，提示用户手动执行渲染          │
└─────────────────────────────────────────────────────────┘
```

#### 降级策略

| 情况 | 处理方式 |
|:---|:---|
| Node.js 不可用且无法安装 | 仅生成 Remotion 代码文件，提示用户安装 Node.js 后执行 `npm install && npm run build:all` |
| ffmpeg 不可用 | 生成代码 + 预览（`npm run start`），提示用户安装 ffmpeg 后执行 `npm run build:all` 渲染 |
| npm install 失败（网络问题） | 保留 package.json，提示用户检查网络后重新执行 `npm install` |

#### 标准 package.json

```json
{
  "name": "teachany-course",
  "scripts": {
    "start": "remotion studio",
    "build": "remotion render src/index.tsx",
    "build:all": "node scripts/render-all.js",
    "generate-sfx": "node generate-sfx.js",
    "generate-tts": "python3 scripts/generate-tts.py"
  },
  "dependencies": {
    "remotion": "^4.0.409",
    "@remotion/cli": "^4.0.409",
    "@remotion/bundler": "^4.0.409",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0"
  }
}
```

#### 第 4 步：生成音效

```bash
node generate-sfx.js
# 创建 sfx/{pop,step,highlight,success,whoosh,ding,error}.wav
```

`generate-sfx.js` 是纯 Node.js WAV 编码器，零第三方依赖，生成 7 种教学动画音效，由 `SfxPlayer` 组件调用。

#### 第 5 步：创建配置文件

`remotion.config.ts`：
```typescript
import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
```

`tsconfig.json`：
```json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "commonjs",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

### 15.3 Remotion Composition 规范

每个教学动画遵循以下结构：

```text
src/
├── index.tsx          # Remotion 入口
├── Root.tsx           # Composition 注册
├── SfxPlayer.tsx      # 音效播放器组件
├── compositions/
│   ├── Episode01.tsx  # 每集一个 Composition
│   ├── Episode02.tsx
│   └── ...
└── SubtitleTrack.tsx  # 双语字幕叠加层
```

**Composition 注册**（`Root.tsx`）：
```tsx
<Composition
  id="Episode01"
  component={Episode01}
  durationInFrames={600}  // 30fps 下 20 秒
  fps={30}
  width={1920}
  height={1080}
/>
```

**动画规范**：
- 分辨率：1920×1080，30fps
- 单 Composition：480-720 帧（16-24 秒）
- 每个 Composition 3-5 个场景
- 动画风格：`interpolate` + `spring`，渐入渐出
- 配色与 HTML 课件 CSS 变量保持统一
- 通过 `SfxPlayer` 组件按帧触发音效
- **中文字体**：SubtitleTrack 的 fontFamily 必须包含 `'Noto Sans SC'` 降级（见 15.5），渲染前确保系统已安装中文字体（见 15.2 步骤 2.5）

### 15.4 Edge TTS 集成（默认）

> **L3 是默认必选项。L1 课件生成完毕后，AI 必须立即自动执行以下全部步骤生成语音讲解，不等待用户确认。**
> **唯一跳过条件**：用户在下达任务时明确说了"不要语音/不要配音/不要TTS"。

> ⚠️ **默认引擎**：**Edge TTS**（微软免费云端 TTS）。
> 
> **支持平台**：
> - ✅ **全平台**：macOS / Windows / Linux（需网络）
> 
> **为什么选择 Edge TTS**：
> - ✅ 全平台支持，无需关心操作系统差异
> - ✅ 高质量神经网络语音（24kHz，zh-CN-XiaoxiaoNeural）
> - ✅ 完全免费，微软提供
> - ✅ 安装简单：`pip3 install edge-tts`
> - ✅ 语音自然度远超系统内置 TTS
> 
> **降级方案**（网络不可用时）：
> - macOS：使用系统 `say` 命令
> - Windows：使用 `pyttsx3`（SAPI5 引擎）

#### L3 自动安装流程（AI 在终端中执行）

```text
┌─────────────────────────────────────────────────────────┐
│  L3 Edge TTS 自动安装流程                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. 检测 Python 环境                                     │
│     → python3 --version                                 │
│     → 缺失？安装：install_binary python 3.12.0          │
│                                                         │
│  2. 安装 edge-tts                                        │
│     → pip3 install edge-tts                             │
│     → 验证：edge-tts --list-voices                      │
│                                                         │
│  3. 编写旁白脚本                                         │
│     → scripts/narration_zh.json（+ narration_en.json）  │
│                                                         │
│  4. 执行语音生成                                         │
│     → python3 scripts/generate-tts.py zh                │
│     → python3 scripts/generate-tts.py en（如双语）      │
│                                                         │
│  5. 生成 SRT 字幕                                       │
│     → python3 scripts/generate-srt.py zh                │
│     → python3 scripts/generate-srt.py en（如双语）      │
│                                                         │
│  ✅ 完成 → 输出 tts/*.mp3 + *.srt                       │
│  ⚠️ 失败 → 降级到本地系统 TTS                           │
└─────────────────────────────────────────────────────────┘
```

#### 降级策略

| 情况 | 处理方式 |
|:---|:---|
| 网络不可用 | 降级到本地系统 TTS：macOS 使用 `say`，Windows 使用 `pyttsx3` |
| edge-tts 安装失败 | 保留旁白脚本 JSON，降级到本地 TTS，提示用户联网后执行 `pip3 install edge-tts` |
| Python 不可用 | 生成旁白脚本 JSON + generate-tts.py，提示用户安装 Python 3.12+ 后执行 |
| edge-tts 生成失败（网络中断） | 保留脚本文件，提示用户在网络正常时重新执行 |

**注意**：Edge TTS **完全免费**——微软免费提供。无 API Key、无配额限制。

#### 语音选择

##### Edge TTS 推荐语音

| 语言 | Voice 名称 | 风格 | 推荐 |
|:-----|:---------|:-----|:-----|
| **中文（女声）** | `zh-CN-XiaoxiaoNeural` | 温暖清晰，K-12 推荐 | ⭐ 默认 |
| **中文（女声）** | `zh-CN-XiaohanNeural` | 年轻活泼 | |
| **中文（男声）** | `zh-CN-YunxiNeural` | 沉稳可靠 | |
| **英文（女声）** | `en-US-AriaNeural` | 清晰标准美式 | ⭐ 默认 |
| **英文（女声）** | `en-US-JennyNeural` | 自然流畅 | |

##### 降级方案：本地系统语音

| 平台 | Voice 名称 | 使用命令 |
|:-----|:---------|:---------|
| **macOS** | `Tingting`（中文）/ `Samantha`（英文） | `say -v Tingting "text"` |
| **Windows** | `Microsoft Huihui`（中文）/ `Microsoft Zira`（英文） | `pyttsx3` |

**语音质量对比**：

| 特性 | Edge TTS | macOS say | Windows pyttsx3 |
|:---|:---:|:---:|:---:|
| 音质 | ⭐⭐⭐⭐⭐ 24kHz 神经网络 | ⭐⭐⭐⭐ 48kHz | ⭐⭐⭐ 16kHz |
| 自然度 | ⭐⭐⭐⭐⭐ 最佳 | ⭐⭐⭐ | ⭐⭐ |
| 跨平台 | ✅ 全平台 | ❌ 仅 macOS | ❌ 仅 Windows |
| 网络依赖 | ⚠️ 需网络 | ✅ 离线 | ✅ 离线 |
| 成本 | ✅ 免费 | ✅ 免费 | ✅ 免费 |

#### TTS 脚本格式

以 JSON 格式创建旁白脚本（与 edge-tts 格式兼容）：

`scripts/narration_zh.json`：
```json
[
  {
    "episode": "Episode01",
    "segments": [
      {
        "id": "seg01",
        "text": "大家好，今天我们来学习二次函数的概念。",
        "startFrame": 0,
        "endFrame": 90
      },
      {
        "id": "seg02",
        "text": "先从一个简单的例子开始：正方形的面积。",
        "startFrame": 100,
        "endFrame": 180
      }
    ]
  }
]
```

#### Edge TTS 生成脚本

`scripts/generate-tts.py`（已预置）：
```python
#!/usr/bin/env python3
"""
Edge TTS 生成器
- 全平台支持（macOS / Windows / Linux）
- 使用微软免费神经网络语音
- 默认语音：zh-CN-XiaoxiaoNeural
"""
# 完整脚本见：scripts/generate-tts.py

# 使用示例
# python3 scripts/generate-tts.py zh
# python3 scripts/generate-tts.py en --voice en-US-AriaNeural
# python3 scripts/generate-tts.py zh --rate +10%
```

**使用方法**：
```bash
# 安装 edge-tts
pip3 install edge-tts

# 生成中文语音（默认：zh-CN-XiaoxiaoNeural）
python3 scripts/generate-tts.py zh

# 生成英文语音（默认：en-US-AriaNeural）
python3 scripts/generate-tts.py en

# 自定义语音
python3 scripts/generate-tts.py zh --voice zh-CN-YunxiNeural

# 调整语速
python3 scripts/generate-tts.py zh --rate +10%

# 覆盖已存在的音频
python3 scripts/generate-tts.py zh --overwrite
```

**降级方案（网络不可用时）**：
- macOS：使用 `scripts/generate-tts-local.py`（系统 `say` 命令）
- Windows：使用 `scripts/generate-tts-local.py`（`pyttsx3` 引擎）

### 15.5 双语字幕系统

#### SubtitleTrack 组件

`src/SubtitleTrack.tsx`：
```tsx
import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface SubtitleEntry {
  startFrame: number;
  endFrame: number;
  zh: string;
  en: string;
}

interface Props {
  subtitles: SubtitleEntry[];
  showZh?: boolean;  // 默认：true
  showEn?: boolean;  // 默认：true
}

export const SubtitleTrack: React.FC<Props> = ({
  subtitles, showZh = true, showEn = true
}) => {
  const frame = useCurrentFrame();
  const current = subtitles.find(
    s => frame >= s.startFrame && frame <= s.endFrame
  );
  if (!current) return null;

  const fadeIn = interpolate(
    frame, [current.startFrame, current.startFrame + 5], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{
      position: "absolute", bottom: 60, left: 0, right: 0,
      textAlign: "center", opacity: fadeIn,
    }}>
      {showZh && (
        <div style={{
          fontSize: 36, color: "#f8fafc", fontWeight: 600,
          textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'Noto Sans CJK SC', sans-serif",
        }}>
          {current.zh}
        </div>
      )}
      {showEn && (
        <div style={{
          fontSize: 28, color: "#94a3b8", marginTop: 4,
          textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          fontFamily: "'Segoe UI', Roboto, sans-serif",
        }}>
          {current.en}
        </div>
      )}
    </div>
  );
};
```

#### 字幕数据格式

```tsx
const subtitles: SubtitleEntry[] = [
  {
    startFrame: 0, endFrame: 90,
    zh: "大家好，今天我们来学习二次函数的概念",
    en: "Hello everyone, today we'll learn about quadratic functions"
  },
  {
    startFrame: 100, endFrame: 180,
    zh: "先从一个简单的例子开始：正方形的面积",
    en: "Let's start with a simple example: the area of a square"
  },
];
```

#### SRT 导出脚本

`scripts/generate-srt.py`：
```python
#!/usr/bin/env python3
"""从旁白 JSON 生成 SRT 字幕文件。"""
import json
import sys

def frames_to_timecode(frame, fps=30):
    total_seconds = frame / fps
    hours = int(total_seconds // 3600)
    minutes = int((total_seconds % 3600) // 60)
    seconds = int(total_seconds % 60)
    milliseconds = int((total_seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"

def generate_srt(narration_file, lang, output_path):
    with open(narration_file, "r", encoding="utf-8") as f:
        episodes = json.load(f)
    
    idx = 1
    lines = []
    for ep in episodes:
        for seg in ep["segments"]:
            start = frames_to_timecode(seg["startFrame"])
            end = frames_to_timecode(seg["endFrame"])
            lines.append(f"{idx}")
            lines.append(f"{start} --> {end}")
            lines.append(seg["text"])
            lines.append("")
            idx += 1
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"✅ {output_path}")

if __name__ == "__main__":
    lang = sys.argv[1] if len(sys.argv) > 1 else "zh"
    generate_srt(f"scripts/narration_{lang}.json", lang, f"tts/subtitles_{lang}.srt")
```

### 15.6 语言配置

执行 TeachAny 时，用户可指定语言偏好：

| 参数 | 可选值 | 默认值 | 影响范围 |
|:-----|:-------|:-------|:---------|
| **课件语言** | `zh` / `en` | `zh` | HTML 内容语言 |
| **配音语言** | `zh` / `en` / `none` | `zh` | TTS 旁白语言 |
| **字幕模式** | `zh-only` / `en-only` / `bilingual` / `none` | `bilingual` | Remotion 中的字幕显示 |

**用户指令示例**：
- "做一个中文数学课件，中文配音，双语字幕" → 默认配置
- "做一个英文生物课件，英文配音，只显示英文字幕" → `en` / `en` / `en-only`
- "做一个中文课件，不需要视频" → 仅 L1，跳过 L2/L3

### 15.7 完整项目文件结构

```text
{course-id}/                            # 课件根目录（如 math-linear-function/）
├── index.html                          # L1：互动课件（中文）
├── index_en.html                       # L1：互动课件（英文，用户要求时生成）
├── manifest.json                       # 课件元数据（必须）
├── tts/                                # L3：TTS 语音和字幕
│   ├── seg01_zh.mp3
│   ├── seg02_zh.mp3
│   ├── ...
│   ├── subtitles_zh.srt
│   └── subtitles_en.srt               # （双语时生成）
├── assets/                             # 插图/图片（按需）
│   └── *.png
├── sfx/                                # 音效文件（L2 需要时）
│   ├── pop.wav
│   ├── step.wav
│   └── ...
├── scripts/                            # TTS/动画生成脚本
│   ├── generate-tts.py                 # Edge TTS 生成器
│   ├── generate-srt.py                 # SRT 字幕导出器
│   ├── narration_zh.json               # 中文旁白脚本
│   └── narration_en.json               # 英文旁白脚本
├── src/                                # L2：Remotion 动画源码（按需）
│   ├── index.tsx
│   ├── Root.tsx
│   └── compositions/
│       └── *.tsx
└── out/                                # L2：渲染输出视频（按需）
    └── *.mp4
```

> **⚠️ 重要**：课件文件**不使用 `public/` 子目录**。`index.html`、`tts/`、`assets/` 等直接放在课件根目录下。这确保课件推送到 GitHub 仓库后，GitHub Pages 能正确服务所有文件。`registry.json` 中的 `path` 字段直接指向课件根目录（如 `examples/math-linear-function`），Gallery 会拼接为 `./examples/math-linear-function/index.html` 来访问课件。
>
> **⚠️ 禁止为单个课件创建独立 GitHub 仓库**。所有课件必须存放在 `teachany-opensource/examples/{course-id}/` 目录下，通过主站 `deploy-pages.yml` 统一部署到 GitHub Pages。禁止在单课件目录中创建 `gallery.html`、`knowledge-map.html` 等主站功能页面——Gallery 和知识地图由主站统一提供，课件仅包含 `index.html` + `tts/` + `assets/` 等教学内容文件。

### 15.8 快速启动命令

```bash
# 完整安装（一次性）
npm install                             # 安装 Remotion
pip3 install edge-tts                   # 安装 Edge TTS
node generate-sfx.js                    # 生成音效

# 开发预览
npm run start                           # 打开 Remotion Studio（预览）

# 生产构建
python3 scripts/generate-tts.py zh      # 生成中文旁白
python3 scripts/generate-tts.py en      # 生成英文旁白
python3 scripts/generate-srt.py zh      # 导出中文 SRT
python3 scripts/generate-srt.py en      # 导出英文 SRT
npm run build:all                       # 渲染所有集数为 MP4
```

---

