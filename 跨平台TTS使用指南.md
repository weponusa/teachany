# 跨平台本地 TTS 使用指南

## 📌 概述

TeachAny 现已支持 **macOS 和 Windows 双平台**的本地 TTS 语音生成！完全离线、高质量、免费无限制。

---

## ✨ 核心优势

| 特性 | 跨平台本地 TTS | Edge TTS（已弃用） |
|:---|:---:|:---:|
| **支持平台** | macOS + Windows | 全平台（需网络） |
| **音质** | ⭐⭐⭐⭐⭐ 48kHz (macOS) / 16kHz (Windows) | ⭐⭐⭐ 24kHz |
| **速度** | ⭐⭐⭐⭐⭐ 1-2秒/段 | ⭐⭐ 5-10秒/段 |
| **稳定性** | ⭐⭐⭐⭐⭐ 100%（离线） | ⭐⭐⭐ 70-90%（依赖网络） |
| **用户体验** | ✅ 无感自动安装 | ❌ 网络连接失败 |
| **成本** | ✅ 免费无限制 | ✅ 免费但有配额 |

---

## 🚀 快速开始

### 1. macOS 用户

#### 自动化（推荐）⭐

AI 生成课件时会**自动执行**以下步骤：

```bash
# 1. 生成旁白脚本（自动）
# scripts/narration_zh.json

# 2. 生成语音（自动）
python3 scripts/generate-tts-cross-platform.py zh

# 3. 生成字幕（自动）
python3 scripts/generate-srt.py zh
```

**完全无需手动操作！** ✅

#### 手动安装推荐语音（可选，提升音质）

```
系统偏好设置
  → 辅助功能
    → 语音
      → 系统语音
        → 自定（点击 "+"）
          → 选择 "简体中文 - Tingting"
          → 下载（约 300MB）
```

**效果对比**：
- 系统默认中文语音：⭐⭐⭐
- Tingting 高质量语音：⭐⭐⭐⭐⭐

---

### 2. Windows 用户

#### 自动化（推荐）⭐

AI 生成课件时会**自动执行**以下步骤：

```bash
# 1. 自动安装依赖（首次运行）
pip install pyttsx3

# 2. 生成语音
python3 scripts/generate-tts-cross-platform.py zh

# 3. 生成字幕
python3 scripts/generate-srt.py zh
```

**首次运行约需 5 秒安装依赖，之后无需等待！** ✅

#### 安装高质量中文语音包（可选）

```
Windows 设置
  → 时间和语言
    → 语音
      → 添加语音
        → 中文（简体，中国）
          → 下载语音包
```

**可用语音**：
- Microsoft Huihui（女声，默认）
- Microsoft Yaoyao（女声，高级）
- Microsoft Kangkang（男声）

---

## 🎤 语音选择

### macOS 推荐语音

| 语言 | 语音名称 | 风格 | 音质 |
|:---|:---|:---|:---:|
| **中文** | Tingting | 温暖清晰，K-12 最佳 | ⭐⭐⭐⭐⭐ |
| 中文 | Meijia | 年轻清脆，小学低年级 | ⭐⭐⭐⭐ |
| **英文** | Samantha | 标准美式，通用 | ⭐⭐⭐⭐⭐ |
| 英文 | Alex | 系统默认 | ⭐⭐⭐⭐ |

### Windows 推荐语音

| 语言 | 语音名称 | 风格 | 音质 |
|:---|:---|:---|:---:|
| **中文** | Microsoft Huihui | SAPI5 标准女声 | ⭐⭐⭐⭐ |
| 中文 | Microsoft Yaoyao | SAPI5 高级女声 | ⭐⭐⭐⭐⭐ |
| **英文** | Microsoft Zira | SAPI5 标准女声 | ⭐⭐⭐⭐ |
| 英文 | Microsoft David | SAPI5 标准男声 | ⭐⭐⭐⭐ |

---

## 🔧 高级使用

### 手动生成语音

```bash
# 生成中文语音
python3 scripts/generate-tts-cross-platform.py zh

# 生成英文语音
python3 scripts/generate-tts-cross-platform.py en

# 自定义语速（默认 180）
python3 scripts/generate-tts-cross-platform.py zh --rate 200

# 覆盖已存在的音频
python3 scripts/generate-tts-cross-platform.py zh --overwrite

# 列出系统可用语音
python3 scripts/generate-tts-cross-platform.py zh --list-voices
```

---

## 🐛 常见问题

### Q1: Windows 首次运行报错 "No module named 'pyttsx3'"

**解决**：脚本会自动安装，等待 5 秒即可。如自动安装失败：

```bash
pip install pyttsx3
```

---

### Q2: macOS 提示 "Tingting 语音未安装"

**解决**：按照上面的步骤安装 Tingting 语音包，或使用系统默认语音（功能正常，音质略低）。

---

### Q3: 生成的音频文件格式是什么？

**macOS**：
- 有 ffmpeg：输出 MP3（192kbps）
- 无 ffmpeg：输出 AIFF（无损，文件较大）

**Windows**：
- 输出 WAV（16kHz，16bit）

**建议**：macOS 用户安装 ffmpeg 优化输出格式：
```bash
brew install ffmpeg
```

---

### Q4: Linux 用户怎么办？

**当前版本（v6.2.0）**：暂不支持 Linux。

**计划版本（v6.3.0）**：将支持 espeak/espeak-ng。

**临时方案**：可继续使用 `scripts/generate-tts.py`（Edge TTS，需网络）。

---

### Q5: 能否同时使用中英文双语语音？

**支持！** 分别生成：

```bash
# 生成中文
python3 scripts/generate-tts-cross-platform.py zh

# 生成英文
python3 scripts/generate-tts-cross-platform.py en
```

课件会自动支持双语切换！

---

## 📊 技术实现

### 架构

```
generate-tts-cross-platform.py
├── 检测操作系统
│   ├── macOS → 使用 say 命令
│   ├── Windows → 使用 pyttsx3（自动安装）
│   └── Linux → 报错（暂不支持）
├── 加载旁白脚本
│   └── scripts/narration_{zh|en}.json
├── 生成音频
│   ├── macOS: say -v Tingting -o output.aiff
│   ├── Windows: engine.save_to_file(text, output.wav)
│   └── 可选 ffmpeg 转换为 MP3
└── 输出
    └── public/tts/*.mp3（或 .wav / .aiff）
```

### 依赖

**macOS**：
- ✅ 系统内置 `say` 命令（无需安装）
- 🔧 可选：`ffmpeg`（优化输出格式）

**Windows**：
- ✅ Python 3.8+（系统预装）
- 📦 自动安装：`pyttsx3`（首次运行）

---

## 🎉 总结

### ✅ 已实现

1. ✅ **macOS 完全支持**：48kHz 高质量音频，使用 Tingting 语音
2. ✅ **Windows 完全支持**：16kHz 标准音频，自动安装 pyttsx3
3. ✅ **自动化流程**：AI 生成课件时无感集成
4. ✅ **离线运行**：100% 成功率，无网络依赖
5. ✅ **降级策略**：语音缺失时自动使用系统默认

### 🚧 待实现（v6.3.0）

- ❌ Linux 支持（espeak/espeak-ng）
- ❌ 更多语音选项（方言、多语言）
- ❌ 实时语音预览

---

## 📝 版本历史

| 版本 | 日期 | 更新内容 |
|:---|:---|:---|
| v6.2.0 | 2026-04-14 | 新增跨平台 TTS（macOS + Windows） |
| v6.1.0 | 2026-04-13 | 仅支持 macOS 本地 TTS |
| v6.0.0 | 2026-03-01 | 使用 Edge TTS（已弃用） |

---

## 💬 反馈

遇到问题？请在 GitHub Issues 提交：
https://github.com/weponusa/teachany/issues
