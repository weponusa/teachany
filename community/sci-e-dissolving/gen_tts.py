#!/usr/bin/env python3
import subprocess, sys, os

BASE = "/root/.openclaw/workspace/teachany-courseware/community/sci-e-dissolving"
os.chdir(BASE)

segs = [
    ("seg01_intro", "把盐放进水里，搅一搅，盐不见了！它去哪里了？是消失了吗？其实盐还在水里，只是变得太小太小，眼睛看不见了。这就是溶解！今天我们来探索溶解的秘密。"),
    ("seg02_dissolve", "溶解就是物质均匀分散到液体中的过程。食盐、白糖放进水里会溶解，变成透明的溶液；而沙子、石头放进水里不会溶解，沉在底部。溶解后的液体叫溶液。"),
    ("seg03_factors", "怎样让溶解更快？有三种方法：第一，加热——热水比冷水溶解得快；第二，搅拌——让固体接触更多水分子；第三，研碎——颗粒越小，接触面积越大，溶解越快。"),
    ("seg04_solution", "溶液有三个特点：均匀（各处浓度一样）、稳定（放久了不分层）、透明（能看穿，但不一定是无色的）。蓝色的硫酸铜溶液是透明的蓝色，不是浑浊的。"),
    ("seg05_separate", "能用什么方法把溶解的东西取回来？用蒸发法！把食盐水放在太阳下晒，水蒸发了，食盐就留下来了——海边盐田就是用这个原理制盐的！"),
    ("seg06_summary", "溶解：物质均匀分散在液体中。能溶的有盐、糖；不能溶的有沙、油。加热、搅拌、研碎可以加快溶解。溶液均匀透明稳定。蒸发可以从溶液中回收溶质！"),
]

tts_script = "/root/.openclaw/workspace/skills/teachany/scripts/tts_engine.py"
out_dir = f"{BASE}/assets/tts"

for name, text in segs:
    out = f"{out_dir}/{name}.mp3"
    r = subprocess.run(
        [sys.executable, tts_script, "--text", text, "--voice", "zh-CN-XiaoxiaoNeural", "--output", out],
        capture_output=True, text=True
    )
    import os
    if os.path.exists(out):
        size = os.path.getsize(out)
        print(f"[{name}] rc={r.returncode} size={size} stdout={r.stdout.strip()[:80]}")
    else:
        print(f"[{name}] MISSING rc={r.returncode} stderr={r.stderr.strip()[:120]}")

print("TTS generation done")
