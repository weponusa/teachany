#!/usr/bin/env python3
"""
TeachAny TTS 生成脚本（v6 · Edge TTS）

用法：
  python3 generate-tts.py <课件目录> [--script narration.json] [--voice zh-CN-YunxiNeural]

narration.json 格式：
  {
    "hero": "欢迎来到唐朝课……",
    "objectives": "本节课我们要达成三个目标……",
    "introduction": "公元 751 年……",
    ...
  }

生成到 <课件目录>/tts/<key>.mp3 + tts/manifest.json

首次安装：
  pip3 install edge-tts

默认 voice:
  zh-CN-YunxiNeural (云希，温暖男声，适合历史/地理)
  可选：zh-CN-XiaoxiaoNeural (晓晓，女声)、zh-CN-XiaoyiNeural (晓伊，少女声)
"""
import asyncio
import json
import os
import sys
from pathlib import Path


def check_edge_tts():
    try:
        import edge_tts  # noqa
        return True
    except ImportError:
        print("❌ edge-tts 未安装。正在安装...")
        os.system(f"{sys.executable} -m pip install --quiet edge-tts")
        try:
            import edge_tts  # noqa
            print("✅ edge-tts 安装成功")
            return True
        except ImportError:
            print("❌ 安装失败，请手动执行：pip3 install edge-tts")
            return False


async def synth(text: str, out: Path, voice: str):
    import edge_tts
    communicate = edge_tts.Communicate(text, voice=voice, rate="+0%", volume="+0%")
    await communicate.save(str(out))


async def main():
    if len(sys.argv) < 2:
        print("用法: python3 generate-tts.py <课件目录> [--script narration.json] [--voice VOICE]")
        sys.exit(1)

    course_dir = Path(sys.argv[1]).resolve()
    script_path = None
    voice = "zh-CN-YunxiNeural"

    args = sys.argv[2:]
    i = 0
    while i < len(args):
        if args[i] == "--script" and i + 1 < len(args):
            script_path = Path(args[i + 1])
            i += 2
        elif args[i] == "--voice" and i + 1 < len(args):
            voice = args[i + 1]
            i += 2
        else:
            i += 1

    if script_path is None:
        # 默认找 course_dir/narration.json
        candidate = course_dir / "narration.json"
        if candidate.exists():
            script_path = candidate
        else:
            print(f"❌ 未找到旁白脚本。请提供 {course_dir}/narration.json 或用 --script")
            sys.exit(1)

    narration = json.loads(script_path.read_text(encoding="utf-8"))
    tts_dir = course_dir / "tts"
    tts_dir.mkdir(exist_ok=True)

    print(f"[TTS] 课件目录: {course_dir}")
    print(f"[TTS] 旁白来源: {script_path}")
    print(f"[TTS] 声音: {voice}")
    print(f"[TTS] 章节数: {len(narration)}")
    print()

    manifest = {"version": "v6", "voice": voice, "sections": {}}

    for key, text in narration.items():
        out_file = tts_dir / f"{key}.mp3"
        print(f"  🎙️  {key}: {text[:40]}...")
        try:
            await synth(text, out_file, voice)
            manifest["sections"][key] = f"tts/{key}.mp3"
            print(f"     ✅ {out_file.name} ({out_file.stat().st_size // 1024} KB)")
        except Exception as e:
            print(f"     ❌ 失败: {e}")

    (tts_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print()
    print(f"✅ 完成，共 {len(manifest['sections'])} 段音频")
    print(f"   清单: {tts_dir / 'manifest.json'}")


if __name__ == "__main__":
    if not check_edge_tts():
        sys.exit(1)
    asyncio.run(main())
