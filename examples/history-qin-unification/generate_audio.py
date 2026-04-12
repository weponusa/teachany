#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TeachAny Phase 3.3 - 语音讲解生成脚本
使用 edge-tts 为课件生成中文语音讲解
"""

import asyncio
import json
import edge_tts
from pathlib import Path

# 配置
VOICE = "zh-CN-YunxiNeural"  # 男声
RATE = "+0%"  # 语速
PITCH = "+0Hz"  # 音调

async def generate_audio(text, output_file):
    """生成单个音频文件"""
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
    await communicate.save(output_file)
    print(f"✅ 已生成: {output_file}")

async def main():
    """主函数"""
    # 读取脚本文件
    with open("narration-scripts.json", "r", encoding="utf-8") as f:
        scripts = json.load(f)
    
    # 创建音频目录
    audio_dir = Path("audio")
    audio_dir.mkdir(exist_ok=True)
    
    # 生成所有音频
    tasks = []
    for section_id, section_data in scripts.items():
        output_file = audio_dir / f"{section_id}.mp3"
        tasks.append(generate_audio(section_data["text"], str(output_file)))
    
    await asyncio.gather(*tasks)
    
    # 生成播放列表
    playlist = []
    for section_id, section_data in scripts.items():
        playlist.append({
            "sectionId": section_id,
            "audioFile": f"audio/{section_id}.mp3",
            "title": section_data["title"]
        })
    
    with open("audio-playlist.json", "w", encoding="utf-8") as f:
        json.dump({"audioPlaylist": playlist}, f, ensure_ascii=False, indent=2)
    
    print("\n🎉 所有语音文件生成完成!")
    print(f"📂 音频文件位置: {audio_dir.absolute()}")
    print("📄 播放列表: audio-playlist.json")

if __name__ == "__main__":
    asyncio.run(main())
