#!/usr/bin/env python3
"""TTS 语音生成脚本 - 五四运动"""
import asyncio
import json
import os
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print("Installing edge-tts...")
    os.system("pip install edge-tts -q")
    import edge_tts

SCRIPT_DIR = Path(__file__).parent
COURSE_DIR = SCRIPT_DIR.parent
TTS_DIR = SCRIPT_DIR
OUTPUT_DIR = TTS_DIR / "output"

def load_narration():
    narration_path = COURSE_DIR / "narration.json"
    with open(narration_path, "r", encoding="utf-8") as f:
        return json.load(f)

async def generate_tts():
    narration = load_narration()
    
    # 确保输出目录存在
    OUTPUT_DIR.mkdir(exist_ok=True)
    
    # 生成字幕文件
    srt_path = OUTPUT_DIR / "narration.srt"
    srt_lines = []
    
    for idx, chapter in enumerate(narration["chapters"], 1):
        script = chapter["script"]
        audio_id = chapter["id"]
        
        print(f"Generating: {audio_id} - {chapter['title']}")
        
        communicate = edge_tts.Communicate(script, "zh-CN-XiaoxiaoNeural")
        await communicate.save(str(OUTPUT_DIR / f"{audio_id}.mp3"))
        
        # 估算时长（中文约 3 字/秒）
        duration = len(script) / 3
        start_time = sum(len(n["script"]) / 3 for n in narration["chapters"][:idx-1])
        
        srt_lines.append(f"{idx}")
        srt_lines.append(f"{start_time:.3f} --> {start_time + duration:.3f}")
        srt_lines.append(script)
        srt_lines.append("")
    
    # 写入 SRT
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(srt_lines))
    
    print(f"\nSRT saved to: {srt_path}")
    print(f"MP3 files saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    asyncio.run(generate_tts())
