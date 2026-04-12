#!/usr/bin/env python3
"""生成 压强（固体压强+液体压强+连通器）TeachAny 标准课件"""
import os

DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(DIR, "index.html")

parts = []
for i in range(1, 20):
    fn = os.path.join(DIR, f"part{i}.html")
    if os.path.exists(fn):
        with open(fn, "r", encoding="utf-8") as f:
            parts.append(f.read())

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(parts))

print(f"✅ 已生成 {OUT}  ({os.path.getsize(OUT)} bytes, {len(parts)} parts)")
