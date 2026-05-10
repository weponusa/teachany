#!/usr/bin/env python3
import subprocess, sys, os

tts_script = "/root/.openclaw/workspace/skills/teachany/scripts/tts_engine.py"
out_dir = "/root/.openclaw/workspace/teachany-courseware/community/sci-e-motion-speed/assets/tts"

segments = [
    ("seg01_intro", "zh-CN-XiaoxiaoNeural",
     "你走路有多快？汽车跑得比你快多少？声音又比汽车快多少？今天我们来学习速度——衡量运动快慢的科学方法，用数字说话！"),
    ("seg02_motion", "zh-CN-XiaoxiaoNeural",
     "运动是物体位置随时间的变化。判断一个物体是否在运动，要选一个参照物。坐在行驶的火车上，你相对于窗外的树是运动的，但相对于车厢里的座位是静止的！"),
    ("seg03_speed", "zh-CN-XiaoxiaoNeural",
     "速度告诉我们运动的快慢。速度等于距离除以时间。如果你在10秒内跑了50米，速度就是50除以10等于5米每秒。速度越大，表示在相同时间内走的距离越多，运动越快！"),
    ("seg04_compare", "zh-CN-XiaoxiaoNeural",
     "来比较各种速度：蜗牛每秒爬0.05米，步行每秒约1.5米，自行车每秒约5米，汽车高速时每秒约30米，高铁每秒约80米，声音每秒340米，光每秒3亿米——光是最快的！"),
    ("seg05_types", "zh-CN-XiaoxiaoNeural",
     "运动有不同方式：沿直线运动叫直线运动，如火车在直线轨道上；弯曲路线叫曲线运动，如过山车；来回重复叫往复运动，如钟摆、活塞；绕轴旋转叫转动，如风扇叶片。"),
    ("seg06_summary", "zh-CN-XiaoxiaoNeural",
     "运动是位置随时间的变化，判断运动要选参照物。速度等于距离除以时间。光速最快，蜗牛最慢。运动方式有直线、曲线、往复、转动。速度是科学描述运动的精确语言！"),
]

for name, voice, text in segments:
    out_path = os.path.join(out_dir, f"{name}.mp3")
    print(f"[TTS] Generating {name}...")
    result = subprocess.run(
        [sys.executable, tts_script, "--text", text, "--voice", voice, "--output", out_path],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        size = os.path.getsize(out_path)
        print(f"  OK: {out_path} ({size} bytes)")
    else:
        print(f"  FAIL: {result.stderr[:200]}")

print("Done.")
