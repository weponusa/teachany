#!/usr/bin/env python3
"""TeachAny 本地系统 TTS 生成器（使用 macOS say 命令）

优势：
- 完全离线，无需网络
- 高质量音频（48kHz）
- 免费无限制
- 速度快

使用方法：
  python3 scripts/generate-tts-local.py zh
  python3 scripts/generate-tts-local.py en --voice Samantha
  python3 scripts/generate-tts-local.py zh --input scripts/narration_zh.json --output public/tts --overwrite
"""
from __future__ import annotations

import argparse
import json
import platform
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT_TEMPLATE = "scripts/narration_{lang}.json"
DEFAULT_OUTPUT_DIR = ROOT / "public" / "tts"

# macOS 系统语音配置（高质量）
VOICE_MAP = {
    "zh": "Tingting",      # 中文（普通话）- 女声
    "zh-HK": "Sinji",      # 中文（粤语）- 女声
    "en": "Samantha",      # 英语（美）- 女声
    "en-GB": "Daniel",     # 英语（英）- 男声
}

# 备选语音
ALTERNATIVE_VOICES = {
    "zh": ["Meijia", "Tingting"],          # 中文备选
    "en": ["Samantha", "Alex", "Karen"],   # 英文备选
}


def check_macos_tts() -> bool:
    """检查是否为 macOS 系统且 say 命令可用"""
    if platform.system() != "Darwin":
        return False
    
    try:
        result = subprocess.run(
            ["say", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0
    except Exception:
        return False


def get_available_voices() -> List[str]:
    """获取系统可用的语音列表"""
    try:
        result = subprocess.run(
            ["say", "-v", "?"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode != 0:
            return []
        
        voices = []
        for line in result.stdout.split('\n'):
            if line.strip():
                # 格式: "Tingting               zh_CN    # 你好，我叫婷婷。我讲中文普通话。"
                parts = line.split()
                if parts:
                    voices.append(parts[0])
        return voices
    except Exception:
        return []


def select_best_voice(lang: str, preferred_voice: str | None = None) -> str:
    """选择最佳可用语音"""
    available = get_available_voices()
    
    # 如果用户指定了语音且可用，直接使用
    if preferred_voice and preferred_voice in available:
        return preferred_voice
    
    # 尝试默认语音
    default_voice = VOICE_MAP.get(lang, VOICE_MAP["zh"])
    if default_voice in available:
        return default_voice
    
    # 尝试备选语音
    alternatives = ALTERNATIVE_VOICES.get(lang, [])
    for voice in alternatives:
        if voice in available:
            return voice
    
    # 都不可用时，返回默认值（让 say 命令使用系统默认语音）
    return default_voice


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="使用 macOS 系统 TTS 生成课件旁白音频")
    parser.add_argument("lang", nargs="?", default="zh", help="语言代码，如 zh / en")
    parser.add_argument("--input", dest="input_path", help="旁白脚本 JSON 路径")
    parser.add_argument("--output", dest="output_dir", help="输出目录，默认为 public/tts")
    parser.add_argument("--voice", help="指定语音名称（如 Tingting / Samantha）")
    parser.add_argument("--rate", type=int, default=180, help="语速（单词/分钟），默认 180")
    parser.add_argument("--overwrite", action="store_true", help="覆盖已有文件")
    parser.add_argument("--list-voices", action="store_true", help="列出系统可用语音")
    return parser


def load_episode_script(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"旁白脚本不存在：{path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("旁白脚本必须是数组，每个元素对应一个 episode")
    return data


def ensure_episode_shape(episode: Dict[str, Any]) -> None:
    if not isinstance(episode, dict):
        raise ValueError("episode 条目必须是对象")
    if not episode.get("episode"):
        raise ValueError("episode 条目缺少 episode 字段")
    segments = episode.get("segments")
    if not isinstance(segments, list) or not segments:
        raise ValueError(f"episode {episode.get('episode')} 缺少 segments 数组")
    for segment in segments:
        if not isinstance(segment, dict):
            raise ValueError(f"episode {episode.get('episode')} 存在非法 segment")
        if not segment.get("id"):
            raise ValueError(f"episode {episode.get('episode')} 的 segment 缺少 id")
        if not segment.get("text"):
            raise ValueError(f"episode {episode.get('episode')} 的 segment {segment.get('id')} 缺少 text")


def generate_segment_audio(text: str, voice: str, rate: int, output_path: Path) -> bool:
    """使用 say 命令生成音频"""
    try:
        # macOS say 命令参数：
        # -v 语音名称
        # -r 语速（单词/分钟）
        # -o 输出文件（AIFF 格式）
        # --file-format=mp4f 输出为 AAC/M4A（更小）
        
        # 先生成临时 AIFF 文件
        temp_aiff = output_path.with_suffix('.aiff')
        
        cmd = [
            "say",
            "-v", voice,
            "-r", str(rate),
            "-o", str(temp_aiff),
            text
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode != 0:
            print(f"❌ say 命令失败：{result.stderr}", file=sys.stderr)
            return False
        
        # 使用 ffmpeg 转换为 MP3（如果可用）
        if subprocess.run(["which", "ffmpeg"], capture_output=True).returncode == 0:
            ffmpeg_cmd = [
                "ffmpeg", "-y",
                "-i", str(temp_aiff),
                "-acodec", "libmp3lame",
                "-b:a", "128k",
                str(output_path)
            ]
            subprocess.run(ffmpeg_cmd, capture_output=True, timeout=30)
            temp_aiff.unlink()  # 删除临时文件
        else:
            # 如果没有 ffmpeg，直接使用 AIFF（或重命名为 mp3）
            temp_aiff.rename(output_path)
            print(f"⚠️  未安装 ffmpeg，输出为 AIFF 格式（建议安装：brew install ffmpeg）")
        
        return True
        
    except subprocess.TimeoutExpired:
        print(f"❌ 生成超时：{text[:50]}...", file=sys.stderr)
        return False
    except Exception as exc:
        print(f"❌ 生成失败：{exc}", file=sys.stderr)
        return False


def generate_episode(episode: Dict[str, Any], voice: str, rate: int, output_dir: Path, overwrite: bool) -> int:
    ensure_episode_shape(episode)
    episode_dir = output_dir / str(episode["episode"])
    episode_dir.mkdir(parents=True, exist_ok=True)

    generated = 0
    for segment in episode["segments"]:
        output_path = episode_dir / f"{segment['id']}.mp3"
        if output_path.exists() and not overwrite:
            print(f"↷ 跳过已有文件：{output_path.relative_to(ROOT)}")
            continue
        
        if generate_segment_audio(str(segment["text"]), voice, rate, output_path):
            generated += 1
            print(f"✅ {output_path.relative_to(ROOT)}")
        else:
            print(f"❌ 生成失败：{segment['id']}", file=sys.stderr)
    
    return generated


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    
    # 列出可用语音
    if args.list_voices:
        print("📢 系统可用语音：\n")
        voices = get_available_voices()
        if not voices:
            print("未找到可用语音")
            return 1
        
        # 按语言分组显示
        print("中文语音：")
        for voice in voices:
            if any(v in voice for v in ["Ting", "Mei", "Sin"]):
                print(f"  - {voice}")
        
        print("\n英文语音：")
        for voice in voices:
            if any(v in voice for v in ["Samantha", "Alex", "Karen", "Daniel", "Tom"]):
                print(f"  - {voice}")
        
        return 0
    
    # 检查系统支持
    if not check_macos_tts():
        print("❌ 错误：此脚本仅支持 macOS 系统", file=sys.stderr)
        print("提示：如需跨平台支持，请使用 scripts/generate-tts.py（基于 edge-tts）", file=sys.stderr)
        return 2
    
    input_path = Path(args.input_path) if args.input_path else ROOT / DEFAULT_INPUT_TEMPLATE.format(lang=args.lang)
    output_dir = Path(args.output_dir) if args.output_dir else DEFAULT_OUTPUT_DIR
    output_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        episodes = load_episode_script(input_path)
    except Exception as exc:
        print(f"读取旁白脚本失败：{exc}", file=sys.stderr)
        return 2
    
    voice = select_best_voice(args.lang, args.voice)
    total = 0
    
    print(f"🎤 使用语音：{voice}")
    print(f"📄 输入脚本：{input_path.relative_to(ROOT) if input_path.is_absolute() and input_path.exists() else input_path}")
    print(f"📁 输出目录：{output_dir.relative_to(ROOT) if output_dir.is_absolute() else output_dir}")
    print(f"⚡ 语速：{args.rate} 单词/分钟\n")
    
    for episode in episodes:
        try:
            generated = generate_episode(episode, voice, args.rate, output_dir, args.overwrite)
        except Exception as exc:
            print(f"生成 episode {episode.get('episode', '<unknown>')} 失败：{exc}", file=sys.stderr)
            return 1
        total += generated
    
    print(f"\n🎉 完成，共生成 {total} 个音频片段")
    print(f"💡 提示：如需更好的音质，建议安装 ffmpeg（brew install ffmpeg）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
