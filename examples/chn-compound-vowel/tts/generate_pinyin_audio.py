#!/usr/bin/env python3
"""Generate compound vowel pronunciation audio using Edge TTS."""
import asyncio
import os
import edge_tts

VOICE = "zh-CN-XiaoxiaoNeural"
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# 9 compound vowels with their pronunciation characters
VOWELS = [
    ("ai", "哎"),
    ("ei", "诶"),
    ("ao", "奥"),
    ("ou", "欧"),
    ("iu", "优"),
    ("ie", "耶"),
    ("ve", "约"),   # üe → ve in filename
    ("er", "耳"),
    ("ui", "威"),
]


async def generate(pinyin_id: str, char: str) -> None:
    out_path = os.path.join(OUTPUT_DIR, f"{pinyin_id}.mp3")
    if os.path.exists(out_path):
        print(f"  [SKIP] {pinyin_id} (already exists)")
        return
    print(f"  [GEN]  {pinyin_id}: {char}")
    communicate = edge_tts.Communicate(char, VOICE, rate="-30%", pitch="+5Hz")
    await communicate.save(out_path)


async def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Generating {len(VOWELS)} pinyin audio files → {OUTPUT_DIR}")
    print(f"Voice: {VOICE}\n")
    for pinyin_id, char in VOWELS:
        await generate(pinyin_id, char)
    print("\nDone!")


if __name__ == "__main__":
    asyncio.run(main())
