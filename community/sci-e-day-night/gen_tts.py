#!/usr/bin/env python3
import subprocess, sys, os

COURSE_DIR = "/root/.openclaw/workspace/teachany-courseware/community/sci-e-day-night/assets/tts"
TTS_SCRIPT = "/root/.openclaw/workspace/skills/teachany/scripts/tts_engine.py"
VOICE = "zh-CN-XiaoxiaoNeural"

segments = [
    ("seg01_intro", "太阳每天从东边升起，从西边落下——这是为什么呢？其实不是太阳在转，是地球在转！今天我们来探索昼夜变化的秘密，揭开地球自转的神奇之谜！"),
    ("seg02_rotation", "地球像一个陀螺，绕着一根看不见的轴（地轴）不停地旋转。旋转方向是从西向东，转一圈需要24小时，正好是一天。这就是为什么我们有白天和夜晚！"),
    ("seg03_day_night", "地球是不透明的球体，太阳只能照亮地球的一半。面向太阳的那半边是白天，背对太阳的那半边是夜晚。地球不停自转，所以白天和夜晚交替出现，形成了昼夜！"),
    ("seg04_sunrise", "既然地球从西向东转，站在地球上的我们就会感觉太阳从东边升起、西边落下。就像坐在向前开的火车上，窗外的树看起来是往后移动的道理一样——是参照物的关系！"),
    ("seg05_timezone", "地球分成24个时区，相邻时区差1小时。当中国是白天时，美国是夜晚。所以打跨洋电话要注意时间差！中国用北京时间（东八区），比伦敦快8小时。"),
    ("seg06_summary", "昼夜成因：地球自转！地球绕地轴从西向东转，24小时一圈。面向太阳是白天，背向是夜晚。太阳东升西落是因为地球自西向东转。地球分24个时区！"),
]

os.makedirs(COURSE_DIR, exist_ok=True)

for seg_id, text in segments:
    output = os.path.join(COURSE_DIR, f"{seg_id}.mp3")
    print(f"Generating {seg_id}...", flush=True)
    result = subprocess.run(
        [sys.executable, TTS_SCRIPT, "--text", text, "--voice", VOICE, "--output", output],
        capture_output=True, text=True
    )
    if result.returncode == 0 and os.path.exists(output) and os.path.getsize(output) > 200:
        print(f"  ✅ {seg_id}: {os.path.getsize(output)} bytes")
    else:
        print(f"  ❌ {seg_id}: returncode={result.returncode}")
        print(f"     stdout: {result.stdout[:200]}")
        print(f"     stderr: {result.stderr[:200]}")
