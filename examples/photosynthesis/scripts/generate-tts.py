#!/usr/bin/env python3
"""TeachAny Edge TTS generator.

Usage examples:
  python3 scripts/generate-tts.py zh
  python3 scripts/generate-tts.py en --voice en-US-GuyNeural
  python3 scripts/generate-tts.py zh --input scripts/narration_zh.json --output public/tts --overwrite
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT_TEMPLATE = "scripts/narration_{lang}.json"
DEFAULT_OUTPUT_DIR = ROOT / "public" / "tts"
VOICE_MAP = {
    "zh": "zh-CN-XiaoxiaoNeural",
    "en": "en-US-JennyNeural",
}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate TeachAny narration audio with Edge TTS")
    parser.add_argument("lang", nargs="?", default="zh", help="Language code, e.g. zh / en")
    parser.add_argument("--input", dest="input_path", help="Narration JSON path")
    parser.add_argument("--output", dest="output_dir", help="Output directory, defaults to public/tts")
    parser.add_argument("--voice", help="Override Edge TTS voice")
    parser.add_argument("--rate", default="+0%", help="Voice rate, e.g. +10%% / -5%%")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing mp3 files")
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


async def save_segment_audio(edge_tts: Any, text: str, voice: str, rate: str, output_path: Path) -> None:
    communicator = edge_tts.Communicate(text=text, voice=voice, rate=rate)
    await communicator.save(str(output_path))


async def generate_episode(edge_tts: Any, episode: Dict[str, Any], voice: str, rate: str, output_dir: Path, overwrite: bool) -> int:
    ensure_episode_shape(episode)
    episode_dir = output_dir / str(episode["episode"])
    episode_dir.mkdir(parents=True, exist_ok=True)

    generated = 0
    for segment in episode["segments"]:
        output_path = episode_dir / f"{segment['id']}.mp3"
        if output_path.exists() and not overwrite:
            print(f"↷ 跳过已有文件：{output_path.relative_to(ROOT)}")
            continue
        await save_segment_audio(edge_tts, str(segment["text"]), voice, rate, output_path)
        generated += 1
        print(f"✅ {output_path.relative_to(ROOT)}")
    return generated


async def async_main(args: argparse.Namespace) -> int:
    try:
        import edge_tts  # type: ignore
    except ImportError:
        print("未安装 edge-tts。请先执行：pip3 install edge-tts", file=sys.stderr)
        return 2

    input_path = Path(args.input_path) if args.input_path else ROOT / DEFAULT_INPUT_TEMPLATE.format(lang=args.lang)
    output_dir = Path(args.output_dir) if args.output_dir else DEFAULT_OUTPUT_DIR
    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        episodes = load_episode_script(input_path)
    except Exception as exc:
        print(f"读取旁白脚本失败：{exc}", file=sys.stderr)
        return 2

    voice = args.voice or VOICE_MAP.get(args.lang, VOICE_MAP["zh"])
    total = 0

    print(f"🎤 使用语音：{voice}")
    print(f"📄 输入脚本：{input_path.relative_to(ROOT) if input_path.is_absolute() and input_path.exists() else input_path}")
    print(f"📁 输出目录：{output_dir.relative_to(ROOT) if output_dir.is_absolute() else output_dir}")

    for episode in episodes:
        try:
            generated = await generate_episode(edge_tts, episode, voice, args.rate, output_dir, args.overwrite)
        except Exception as exc:
            print(f"生成 episode {episode.get('episode', '<unknown>')} 失败：{exc}", file=sys.stderr)
            return 1
        total += generated

    print(f"\n🎉 完成，共生成 {total} 个音频片段")
    return 0


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return asyncio.run(async_main(args))


if __name__ == "__main__":
    raise SystemExit(main())
