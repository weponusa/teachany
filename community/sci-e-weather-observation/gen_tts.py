#!/usr/bin/env python3
import sys
sys.path.insert(0, '/root/.openclaw/workspace/skills/teachany/scripts')
from tts_engine import synthesize

segments = [
    ("seg02_types", "天气有很多种：太阳高照是晴天，云彩遮住太阳是多云，整天灰蒙蒙是阴天，从天上落下水珠是雨天，冬天落下白色小颗粒是雪天，感觉风很大是风天。你最喜欢哪种天气？"),
    ("seg03_observe", "怎么观察天气呢？看天空：蓝天白云是晴天，乌云密布可能要下雨。感受温度：热热的是夏天晴天，冷冷的可能要下雪。看旗子或树叶：飘起来说明有风。"),
    ("seg04_record", "科学家用天气日记记录天气。每天看一次天气，把天气符号记在日历上。坚持记录一个月，你就能发现规律——这个月晴天多还是雨天多？哪天最热？"),
    ("seg05_life", "天气影响我们的生活。晴天可以晒被子、去公园玩；雨天要带伞、注意不要滑倒；下雪天路很滑要小心；大风天要穿好衣服。根据天气决定当天的计划，这很重要！"),
    ("seg06_summary", "今天学会了观察天气！天气有晴、多云、阴、雨、雪、风这六种。用眼睛看天空、用皮肤感受温度、看树叶和旗子判断风力。记天气日记，你也能成为小气象员！"),
]

for name, text in segments:
    out = f"assets/tts/{name}.mp3"
    ok, engine = synthesize(text=text, voice="zh-CN-XiaoxiaoNeural", output=out)
    print(f"{'✅' if ok else '❌'} {name}: {engine}")
