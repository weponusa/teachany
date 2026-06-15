#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TeachAny · finalize-courseware.py (v7.20)

课件「定稿器」——发布前强制补齐三大高频缺失模块，让 AI 漏写也能自动补全：

  ① AI 学伴      ai-tutor.{css,js} + tutor-card + __TEACHANY_TUTOR_CONFIG__
  ② 高质量音频   每个 data-tts 段落生成真实分段 mp3（tts-engine 多引擎）
                 + tts/manifest.json + data-teachany-audio-playlist 配置块
  ③ 知识图谱     data-teachany-kg + teachany-knowledge-graph.{css,js}

设计原则：
  - 幂等：已存在的模块/音频不重复生成
  - 真实音频：调 tts-engine.py（edge-tts→say→pyttsx3→silent），校验 ≥ MIN_MP3
  - 不改业务内容，只补模块与音频接线

用法：
  python3 scripts/finalize-courseware.py <课件目录>
  python3 scripts/finalize-courseware.py <课件目录> --no-audio   # 只补模块，不生成音频
  python3 scripts/finalize-courseware.py <课件目录> --json

退出码：
  0  定稿完成（模块齐全；音频已生成或本就齐全）
  1  存在无法自动修复的问题（如音频引擎全部失败）
  2  输入错误
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import re
import subprocess
import sys
from html import unescape
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
MIN_MP3 = 5 * 1024  # 低于 5KB 视为静音/占位
MAX_NARRATION = 320  # 单段朗读文本上限（字符）

VOICE_BY_SUBJECT = {
    "english": "en-US-AriaNeural",
    "chinese": "zh-CN-XiaoyiNeural",
}
DEFAULT_VOICE = "zh-CN-XiaoxiaoNeural"


def _load_apply_modules():
    """以 importlib 加载 apply-standard-modules.py（文件名带连字符，不能直接 import）。"""
    path = SCRIPT_DIR / "apply-standard-modules.py"
    if not path.exists():
        return None
    spec = importlib.util.spec_from_file_location("apply_standard_modules", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def strip_tags(html: str) -> str:
    html = re.sub(r"<(script|style)\b[^>]*>.*?</\1>", " ", html, flags=re.I | re.S)
    html = re.sub(r"<[^>]+>", " ", html)
    html = unescape(html)
    return re.sub(r"\s+", " ", html).strip()


def find_tts_sections(html: str) -> list[dict]:
    """返回每个 data-tts 段落：{tts, label, text}。"""
    sections = []
    for m in re.finditer(r'<section\b[^>]*\bdata-tts=["\']([^"\']+)["\'][^>]*>', html, re.I):
        open_tag = m.group(0)
        tts_id = m.group(1)
        # 优先 data-tts-script（作者手写朗读稿），其次 data-tsh（情境提示）
        script_m = re.search(r'data-tts-script=["\']([^"\']+)["\']', open_tag, re.I)
        tsh_m = re.search(r'data-tsh=["\']([^"\']+)["\']', open_tag, re.I)
        # 抓 section 内容
        start = m.end()
        depth = 1
        i = start
        body_end = len(html)
        open_re = re.compile(r"<section\b", re.I)
        close_re = re.compile(r"</section>", re.I)
        while i < len(html):
            om = open_re.search(html, i)
            cm = close_re.search(html, i)
            if not cm:
                break
            if om and om.start() < cm.start():
                depth += 1
                i = om.end()
            else:
                depth -= 1
                if depth == 0:
                    body_end = cm.start()
                    break
                i = cm.end()
        inner = html[start:body_end]

        if script_m:
            text = unescape(script_m.group(1)).strip()
        else:
            heading = ""
            hm = re.search(r"<h[12][^>]*>(.*?)</h[12]>", inner, re.I | re.S)
            if hm:
                heading = strip_tags(hm.group(1))
            body_text = strip_tags(inner)
            text = (heading + "。" + body_text) if heading and heading not in body_text[:40] else body_text
            if tsh_m and len(text) < 30:
                text = unescape(tsh_m.group(1)).strip()
        text = re.sub(r"\s+", "", text)[:MAX_NARRATION] if text else ""
        label = ""
        if tsh_m:
            label = unescape(tsh_m.group(1)).split(" - ")[0].strip()
        sections.append({"tts": tts_id, "label": label or tts_id, "text": text})
    return sections


def synthesize_mp3(text: str, voice: str, out_path: Path) -> tuple[bool, str]:
    engine = SCRIPT_DIR / "tts-engine.py"
    if not engine.exists():
        return False, "tts-engine.py 不存在"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        r = subprocess.run(
            [sys.executable, str(engine), "--text", text, "--voice", voice,
             "--output", str(out_path)],
            capture_output=True, text=True, timeout=120,
        )
    except subprocess.TimeoutExpired:
        return False, "tts 超时"
    ok = out_path.exists() and out_path.stat().st_size >= MIN_MP3
    return ok, (r.stdout or r.stderr or "").strip()[:120]


def count_real_mp3(course_dir: Path) -> int:
    n = 0
    for sub in ("tts", "assets/tts"):
        d = course_dir / sub
        if d.is_dir():
            n += sum(1 for p in d.glob("*.mp3") if p.stat().st_size >= MIN_MP3)
    return n


def generate_audio(course_dir: Path, manifest: dict, html: str) -> dict:
    """为每个 data-tts 段落生成 mp3，写 tts/manifest.json。返回报告。

    重要：已有 data-teachany-audio-playlist 或已有 ≥3 个真实 mp3 时**不重新生成**，
    避免破坏作者已精心录制/命名的音频（命名规则不同会被误判为缺失）。
    """
    report = {"generated": [], "reused": [], "failed": [], "sections": 0, "skipped": False}

    has_playlist = "data-teachany-audio-playlist" in html
    existing = count_real_mp3(course_dir)
    if has_playlist or existing >= 3:
        report["skipped"] = True
        report["reused"] = [f"已有音频（playlist={has_playlist}, mp3={existing}），跳过生成"]
        return report

    sections = find_tts_sections(html)
    report["sections"] = len(sections)
    if not sections:
        return report

    subject = (manifest.get("subject") or "").lower()
    voice = VOICE_BY_SUBJECT.get(subject, DEFAULT_VOICE)
    tts_dir = course_dir / "tts"
    tts_dir.mkdir(parents=True, exist_ok=True)

    manifest_entries = []
    for idx, sec in enumerate(sections, 1):
        slug = re.sub(r"[^a-z0-9]+", "-", sec["tts"].lower()).strip("-") or f"sec{idx}"
        fname = f"s{idx:02d}-{slug}.mp3"
        out = tts_dir / fname
        if out.exists() and out.stat().st_size >= MIN_MP3:
            report["reused"].append(fname)
        else:
            text = sec["text"]
            if len(text) < 10:
                text = f"{manifest.get('name') or '本节'}。{sec['label']}。"
            ok, msg = synthesize_mp3(text, voice, out)
            if ok:
                report["generated"].append(fname)
            else:
                report["failed"].append(f"{fname}: {msg}")
                continue
        manifest_entries.append({
            "id": f"s{idx:02d}-{slug}",
            "file": fname,
            "section": sec["tts"],
            "label": sec["label"],
            "bytes": out.stat().st_size if out.exists() else 0,
        })

    if manifest_entries:
        (tts_dir / "manifest.json").write_text(
            json.dumps({
                "tts_files": manifest_entries,
                "engine": "tts-engine (multi)",
                "voice": voice,
            }, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    return report


def finalize(course_dir: Path, do_audio: bool = True) -> dict:
    index = course_dir / "index.html"
    if not index.exists():
        return {"ok": False, "error": "缺少 index.html"}
    manifest = {}
    mf = course_dir / "manifest.json"
    if mf.exists():
        try:
            manifest = json.loads(mf.read_text(encoding="utf-8"))
        except Exception:
            manifest = {}

    asm = _load_apply_modules()
    if asm is None:
        return {"ok": False, "error": "apply-standard-modules.py 不可用"}

    html = index.read_text(encoding="utf-8")
    original = html
    actions = {}

    node_id = manifest.get("node_id")
    heading = manifest.get("name") or course_dir.name

    html, links = asm.ensure_head_links(html)
    html, scripts = asm.ensure_tail_scripts(html)
    html, card = asm.ensure_tutor_card_section(html)
    html, cfg = asm.ensure_tutor_config(html, manifest, course_dir.name, node_id)
    actions.update(links_added=links, scripts_added=scripts, tutor_card=card, tutor_config=cfg)

    if node_id:
        html, kg = asm.ensure_kg_section(html, node_id, heading)
        actions["kg"] = kg
    else:
        actions["kg"] = "skipped-no-node-id"

    audio_report = {"sections": 0, "generated": [], "reused": [], "failed": []}
    if do_audio:
        audio_report = generate_audio(course_dir, manifest, html)

    # 音频接线（在生成 mp3 后注入 playlist）
    html, audio_action = asm.ensure_audio_config(html, course_dir)
    actions["audio_config"] = audio_action

    changed = html != original
    if changed:
        index.write_text(html, encoding="utf-8")

    ok = not audio_report["failed"]
    return {
        "ok": ok,
        "course": course_dir.name,
        "changed": changed,
        "actions": actions,
        "audio": audio_report,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("course_dir")
    ap.add_argument("--no-audio", action="store_true", help="只补模块，不生成音频")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    course = Path(args.course_dir)
    if not course.is_dir():
        print(f"❌ 课件目录不存在: {course}", file=sys.stderr)
        return 2

    report = finalize(course, do_audio=not args.no_audio)
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0 if report.get("ok") else 1

    if not report.get("ok") and report.get("error"):
        print(f"❌ {report['error']}")
        return 2

    print(f"TeachAny finalize · {report['course']}")
    a = report["actions"]
    if a.get("links_added"):
        print(f"  ✚ 补 CSS：{', '.join(a['links_added'])}")
    if a.get("scripts_added"):
        print(f"  ✚ 补 JS：{', '.join(a['scripts_added'])}")
    if a.get("tutor_card"):
        print("  ✚ AI 学伴入口卡片")
    if a.get("tutor_config"):
        print("  ✚ AI 学伴配置 __TEACHANY_TUTOR_CONFIG__")
    if a.get("kg") and a["kg"] not in ("unchanged",):
        print(f"  ✚ 知识图谱：{a['kg']}")
    au = report["audio"]
    if au.get("skipped"):
        print("  🔊 音频：已有 playlist/mp3，保留作者原音频（未重新生成）")
    elif au["sections"]:
        print(f"  🔊 音频段落 {au['sections']}：生成 {len(au['generated'])} / 复用 {len(au['reused'])} / 失败 {len(au['failed'])}")
        for f in au["failed"]:
            print(f"     ❌ {f}")
    if a.get("audio_config") and a["audio_config"] != "unchanged":
        print(f"  ✚ 音频播放列表：{a['audio_config']}")
    print()
    if report["ok"]:
        print("✅ 定稿完成：AI 学伴 / 音频 / 知识图谱 三模块齐全")
    else:
        print("⚠️  定稿完成但音频部分失败，请检查 tts-engine（edge-tts/say）后重跑")
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
