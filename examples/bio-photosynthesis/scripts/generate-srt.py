#!/usr/bin/env python3
"""TeachAny SRT subtitle generator.

Usage examples:
  python3 scripts/generate-srt.py zh
  python3 scripts/generate-srt.py en --fps 30 --output public/tts/subtitles_en.srt
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT_TEMPLATE = "scripts/narration_{lang}.json"
DEFAULT_OUTPUT_TEMPLATE = "public/tts/subtitles_{lang}.srt"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate TeachAny SRT subtitles from narration JSON")
    parser.add_argument("lang", nargs="?", default="zh", help="Language code, e.g. zh / en")
    parser.add_argument("--input", dest="input_path", help="Narration JSON path")
    parser.add_argument("--output", dest="output_path", help="Output SRT path")
    parser.add_argument("--fps", type=float, default=30.0, help="Frames per second, default 30")
    return parser


def frames_to_timecode(frame: float, fps: float) -> str:
    total_seconds = max(frame, 0) / fps
    hours = int(total_seconds // 3600)
    minutes = int((total_seconds % 3600) // 60)
    seconds = int(total_seconds % 60)
    milliseconds = int(round((total_seconds - int(total_seconds)) * 1000))
    if milliseconds == 1000:
        seconds += 1
        milliseconds = 0
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"


def load_episode_script(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"旁白脚本不存在：{path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("旁白脚本必须是数组")
    return data


def build_srt_lines(episodes: List[Dict[str, Any]], fps: float) -> List[str]:
    lines: List[str] = []
    index = 1
    for episode in episodes:
        for segment in episode.get("segments", []):
            start = frames_to_timecode(float(segment.get("startFrame", 0)), fps)
            end = frames_to_timecode(float(segment.get("endFrame", 0)), fps)
            text = str(segment.get("text", "")).strip()
            if not text:
                continue
            lines.extend([
                str(index),
                f"{start} --> {end}",
                text,
                "",
            ])
            index += 1
    return lines


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    input_path = Path(args.input_path) if args.input_path else ROOT / DEFAULT_INPUT_TEMPLATE.format(lang=args.lang)
    output_path = Path(args.output_path) if args.output_path else ROOT / DEFAULT_OUTPUT_TEMPLATE.format(lang=args.lang)

    try:
        episodes = load_episode_script(input_path)
    except Exception as exc:
        print(f"读取旁白脚本失败：{exc}")
        return 2

    lines = build_srt_lines(episodes, args.fps)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"✅ 已生成字幕：{output_path.relative_to(ROOT) if output_path.is_absolute() else output_path}")
    print(f"🧾 共输出 {max(len(lines) // 4, 0)} 条字幕")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
