#!/usr/bin/env python3
import subprocess, sys, os

scripts_dir = "/root/.openclaw/workspace/skills/teachany/scripts"
out_dir = "/root/.openclaw/workspace/teachany-courseware/community/sci-e-plant-life-cycle/assets/tts"

segments = [
    ("seg01_intro", "一粒小小的种子，埋进土里，浇上水，在阳光下慢慢长大，最后开出美丽的花，结出甜甜的果实——这就是植物神奇的一生！今天我们来追随一粒种子的旅程！"),
    ("seg02_germination", "种子发芽需要三个条件：水分、适宜的温度和空气。注意：发芽不需要阳光！把种子泡水后放在温暖的地方，几天后你就能看到小芽钻出来。根先向下长，茎再向上伸。"),
    ("seg03_growth", "小芽长出土面就成了幼苗。幼苗需要阳光来进行光合作用，制造自己的食物。随着茎越来越粗、叶越来越多，植物不断长高，储备能量准备开花。"),
    ("seg04_flower", "开花是植物繁殖的信号！花朵用鲜艳的颜色和香甜的气味吸引蜜蜂、蝴蝶来传粉，这叫虫媒花；有些植物靠风传粉，叫风媒花，它们的花通常小而不显眼。"),
    ("seg05_fruit_seed", "传粉后花变成果实，果实里包着种子。种子需要传播到新地方才能萌发。蒲公英靠风飞、苍耳靠动物的毛传播、椰子靠水漂流、凤仙花则直接弹射出去！"),
    ("seg06_summary", "植物的一生：种子→发芽（需水+温度+空气）→幼苗（需阳光）→开花（传粉）→结果→种子传播→新的循环。每一粒种子都是一个新生命的开始！"),
]

for name, text in segments:
    out = os.path.join(out_dir, f"{name}.mp3")
    print(f"Generating {name}...")
    r = subprocess.run(
        [sys.executable, os.path.join(scripts_dir, "tts_engine.py"),
         "--text", text, "--voice", "zh-CN-XiaoxiaoNeural", "--output", out],
        capture_output=True, text=True
    )
    if r.returncode != 0:
        print(f"STDERR: {r.stderr}")
    else:
        size = os.path.getsize(out) if os.path.exists(out) else 0
        print(f"  → {out} ({size} bytes)")

print("All done!")
