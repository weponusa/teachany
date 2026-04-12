#!/usr/bin/env python3
"""TeachAny 课件组装脚本 — 浮力"""
import pathlib, sys

here = pathlib.Path(__file__).parent
parts = sorted(here.glob("part*.html"), key=lambda p: int(p.stem.replace("part", "")))
if not parts:
    print("❌ 未找到 part*.html"); sys.exit(1)

out = here / "index.html"
buf = []
for p in parts:
    buf.append(p.read_text(encoding="utf-8"))
out.write_text("\n".join(buf), encoding="utf-8")
size = out.stat().st_size
lines = out.read_text(encoding="utf-8").count("\n") + 1
print(f"✅ 已生成 {out}  ({size} bytes, {len(parts)} parts)")
