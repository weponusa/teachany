#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TeachAny · preflight-publish.py (v7.19)

发布前闸门：在 hang_tree publish / auto-publish / publish_course 之前运行，
集中检查会导致「上传失败」或「挂树失败」的高频问题。

检查项：
  1. manifest.json + index.html 存在
  2. node_id 三方一致（manifest / teachany-node meta / 可选 course-id）
  3. ext-* PBL 补充：free_mode=false、禁止课标 register、挂「其他知识」说明
  4. Phase 3.5a 反馈密码（set-feedback-password.py --check）
  5. check_node_id.py（课标节点在树中；ext-* 自动通过）
  6. validate-courseware.py（若在 courseware 仓内）

用法：
  python3 scripts/preflight-publish.py <课件目录>
  python3 scripts/preflight-publish.py community/ext-7be00e85
  python3 scripts/preflight-publish.py --json <课件目录>

退出码：
  0  通过
  1  有阻断项（须修复后再 publish）
  2  输入错误
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

EXT_NODE_RE = re.compile(r"^ext-[a-f0-9]{6,12}$", re.I)
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent


def locate_course(target: str) -> Path | None:
    p = Path(target)
    if p.is_dir():
        return p.resolve()
    for base in (REPO_ROOT / "community", REPO_ROOT / "community" / "drafts", REPO_ROOT / "examples"):
        cand = base / target
        if cand.is_dir():
            return cand.resolve()
    return None


def read_meta(html: str, *names: str) -> str:
    for name in names:
        m = re.search(
            rf'<meta[^>]*name=["\']{re.escape(name)}["\'][^>]*content=["\']([^"\']+)["\']',
            html,
            re.I,
        )
        if m:
            return m.group(1).strip()
        m = re.search(
            rf'<meta[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']{re.escape(name)}["\']',
            html,
            re.I,
        )
        if m:
            return m.group(1).strip()
    return ""


def find_skill_scripts() -> Path:
    env = os.environ.get("TEACHANY_SKILL", "").strip()
    if env:
        p = Path(env).expanduser()
        if (p / "scripts").is_dir():
            return p / "scripts"
        if (p / "teachany" / "scripts").is_dir():
            return p / "teachany" / "scripts"
    for c in (
        SCRIPT_DIR,
        Path.home() / "CodeBuddy" / "一次函数" / "teachany-opensource" / "teachany" / "scripts",
        Path.home() / "teachany-opensource" / "teachany" / "scripts",
    ):
        if (c / "check_node_id.py").exists():
            return c
    return SCRIPT_DIR


def run_script(script: Path, args: list[str], timeout: int = 180) -> tuple[int, str]:
    if not script.exists():
        return 127, f"脚本不存在: {script}"
    r = subprocess.run(
        [sys.executable, str(script), *args],
        capture_output=True,
        text=True,
        timeout=timeout,
        cwd=str(REPO_ROOT) if (REPO_ROOT / "community").is_dir() else None,
    )
    out = (r.stdout or "") + (r.stderr or "")
    return r.returncode, out.strip()


def run_finalizer(course_dir: Path, skill_scripts: Path) -> list[str]:
    """发布前自动补齐 AI 学伴 / 音频 / 知识图谱（finalize-courseware.py）。"""
    notes: list[str] = []
    finalizer = skill_scripts / "finalize-courseware.py"
    if not finalizer.exists():
        finalizer = SCRIPT_DIR / "finalize-courseware.py"
    if not finalizer.exists():
        notes.append("未找到 finalize-courseware.py，跳过自动补模块（请手动确认三模块齐全）")
        return notes
    try:
        r = subprocess.run(
            [sys.executable, str(finalizer), str(course_dir)],
            capture_output=True, text=True, timeout=600,
        )
        for line in (r.stdout or "").splitlines():
            s = line.strip()
            if s.startswith(("✚", "🔊", "✅", "⚠️", "❌")):
                notes.append(s)
    except subprocess.TimeoutExpired:
        notes.append("finalize-courseware 超时（音频生成慢？可单独重跑）")
    except Exception as e:
        notes.append(f"finalize-courseware 执行异常：{e}")
    return notes


def check_shell_standard(course_dir: Path, html: str) -> tuple[list[str], list[str]]:
    """壳层标准硬校验（2026-10 统一规范）。

    阻断项：品牌顶栏缺失/指向错误、courseware-shell.css 未版本化引用、
    hero 图缺失、旧版「教我学」导航（class="nav-brand"）。
    警告项：div/section 配平、死 goTo 按钮。
    """
    errs: list[str] = []
    warns: list[str] = []

    # ① 品牌顶栏（必须检测 markup 本身，CSS 里的类名字符串不算）
    if '<div class="teachany-brand-bar"' not in html:
        errs.append("缺品牌顶栏 markup（<div class=\"teachany-brand-bar\">，全库统一壳层，见 RULES.md 壳层标准）")
    else:
        bar_m = re.search(r'<div class="teachany-brand-bar">[\s\S]*?</div>', html)
        bar = bar_m.group(0) if bar_m else ""
        if "weponusa.github.io" in bar:
            errs.append("品牌顶栏链接指向 weponusa.github.io，须改为 https://www.teachany.cn/")
        if ".teachany-brand-bar{" not in html and ".teachany-brand-bar {" not in html:
            # 无内联样式 → 必须链 courseware-shell.css 且带版本参数（否则顶栏裸奔）
            m = re.search(r'href="([^"]*courseware-shell\.css[^"]*)"', html)
            if not m:
                errs.append("顶栏样式缺失：既无内联 .teachany-brand-bar 规则，也未链 courseware-shell.css")
            elif "?v=" not in m.group(1):
                errs.append("courseware-shell.css 引用未带版本参数（?v=YYYYMMDD）——CDN 会缓存旧样式导致顶栏裸奔")

    # ② hero 图
    hero_refs = sorted(set(re.findall(r'src="([^"]*hero[^"]*\.(?:png|webp|jpg))"', html)))
    if not hero_refs:
        errs.append("缺 hero 主图引用（assets/<course>-hero.png，含中央主题大字 + 四分支标注）")
    else:
        import os as _os
        for rel in hero_refs[:1]:
            p = course_dir / rel.lstrip("./")
            if not p.exists():
                errs.append(f"hero 图文件缺失: {rel}")
            elif p.stat().st_size < 100 * 1024 and not rel.endswith(".svg"):
                warns.append(f"hero 图体积偏小（{p.stat().st_size}B），确认不是占位图: {rel}")

    # ③ 旧版导航（阻断）
    if 'class="nav-brand"' in html:
        errs.append("存在旧版「教我学」导航（class=nav-brand）——须转为标准 teachany-page-nav 或删除")
    # 死 goTo 按钮（警告）
    if not re.search(r"function\s+goTo\s*\(", html) and not re.search(r"(?:const|let|var)\s+goTo\s*=", html):
        n_dead = len(re.findall(r"<button[^>]*>[^<]*</button>", html))
        dead = [m for m in re.finditer(r"<button[^>]*>[^<]*</button>", html)
                if re.search(r"goTo\('", m.group(0))]
        if dead:
            errs.append(f"存在 {len(dead)} 个 goTo 死按钮（无 goTo 函数定义）——删除或补函数")

    # ④ 配平（警告）
    dd = len(re.findall(r"<div\b", html)) - html.count("</div>")
    ds = len(re.findall(r"<section\b", html)) - html.count("</section>")
    if dd or ds:
        warns.append(f"div/section 配平偏差（div{dd:+d} sec{ds:+d}）——浏览器自动纠错可能引发布局漂移")
    return errs, warns


def check_three_modules(course_dir: Path, html: str) -> list[str]:
    """三大高频缺失模块硬校验：AI 学伴 / 高质量音频 / 知识图谱。"""
    errs: list[str] = []
    # ① AI 学伴
    if "ai-tutor.css" not in html or "ai-tutor.js" not in html:
        errs.append("缺 AI 学伴资源（ai-tutor.css/js）")
    if "__TEACHANY_TUTOR_CONFIG__" not in html:
        errs.append("缺 AI 学伴配置 __TEACHANY_TUTOR_CONFIG__")
    if "data-teachany-tutor-card" not in html:
        errs.append("缺 AI 学伴入口卡片 data-teachany-tutor-card")
    # ② 高质量音频
    mp3s = [p for sub in ("tts", "assets/tts") for p in (course_dir / sub).glob("*.mp3")
            if (course_dir / sub).is_dir()]
    real_mp3 = [p for p in mp3s if p.stat().st_size >= 5 * 1024]
    if len(real_mp3) < 3:
        errs.append(f"高质量音频不足（{len(real_mp3)} 个 ≥5KB mp3 < 3）— finalize 应已生成，检查 tts-engine")
    if "data-teachany-audio-playlist" not in html:
        errs.append("缺连续音频配置 data-teachany-audio-playlist")
    if "teachany-audio-player.js" not in html:
        errs.append("缺音频播放器脚本 teachany-audio-player.js")
    # ③ 知识图谱
    has_kg = ("data-teachany-kg" in html or 'id="knowledge-graph"' in html
              or "knowledgeGraphData" in html)
    if not has_kg:
        errs.append("缺知识图谱（data-teachany-kg / #knowledge-graph）")
    return errs


def check_publish_readiness(course_dir: Path, finalize: bool = True) -> dict:
    errors: list[str] = []
    warns: list[str] = []
    info: list[str] = []

    mf = course_dir / "manifest.json"
    html_path = course_dir / "index.html"
    if not html_path.exists():
        errors.append("缺少 index.html")
    if not mf.exists():
        errors.append("缺少 manifest.json（发布阻断 · 硬规则 #18）")
        return {"ok": False, "errors": errors, "warns": warns, "info": info, "is_ext": False}

    skill_scripts = find_skill_scripts()

    # 0. 自动补齐三模块（AI 学伴 / 音频 / 知识图谱）
    if finalize:
        for note in run_finalizer(course_dir, skill_scripts):
            info.append(note)

    manifest = json.loads(mf.read_text(encoding="utf-8"))
    html = html_path.read_text(encoding="utf-8", errors="ignore") if html_path.exists() else ""

    # 0.5 三模块硬校验（finalize 后仍缺即阻断）
    for e in check_three_modules(course_dir, html):
        errors.append(e)

    # 0.6 壳层标准校验（品牌顶栏 / hero / 旧导航 / 配平）
    shell_errs, shell_warns = check_shell_standard(course_dir, html)
    errors.extend(shell_errs)
    warns.extend(shell_warns)

    node_manifest = str(manifest.get("node_id") or "").strip()
    node_html = read_meta(html, "teachany-node", "teachany:node_id", "course-node")
    course_id_meta = read_meta(html, "course-id", "teachany-id")
    course_id = str(manifest.get("id") or manifest.get("course_id") or course_dir.name).strip()
    is_ext = bool(node_manifest and EXT_NODE_RE.match(node_manifest))

    if not node_manifest:
        errors.append("manifest.node_id 为空（无法挂树）")
    if not node_html:
        errors.append("index.html 缺 <meta name=\"teachany-node\" content=\"...\">")
    elif node_html != node_manifest:
        errors.append(f"node_id 不一致：manifest={node_manifest!r} vs teachany-node={node_html!r}")

    if course_id_meta and course_id_meta != course_id:
        warns.append(f"course-id meta ({course_id_meta}) 与 manifest.id ({course_id}) 不同（通常可接受）")

    if is_ext:
        info.append(f"PBL 课标外节点 {node_manifest} → 发布后进 data/trees/other/user-generated.json（其他知识）")
        if manifest.get("free_mode") is True:
            errors.append("ext-* 课件不得 free_mode=true（会阻止挂入「其他知识」树）")
        if node_manifest != node_html:
            pass  # already error
        elif not EXT_NODE_RE.match(node_html):
            errors.append(f"teachany-node 须为 ext-{{hash}} 格式，当前 {node_html!r}")
        if manifest.get("lesson_type") not in ("pbl-supplement", None):
            if manifest.get("lesson_type") != "pbl-supplement":
                warns.append(f"建议 lesson_type 设为 pbl-supplement（当前 {manifest.get('lesson_type')!r}）")
        pbl = manifest.get("pbl_context")
        if not isinstance(pbl, dict) or not str(pbl.get("project_goal", "")).strip():
            warns.append("建议 manifest.pbl_context.project_goal 填写 PBL 项目情境（课标外补充说明）")
        info.append("禁止 hang_tree.py register 到课标树；直接 publish，由 rebuild-index 写入「其他知识」")
    else:
        if not node_manifest:
            pass
        elif EXT_NODE_RE.match(node_manifest):
            errors.append("非 PBL 课件不应使用 ext-* node_id")

    fb_script = skill_scripts / "set-feedback-password.py"
    if not fb_script.exists():
        fb_script = SCRIPT_DIR / "set-feedback-password.py"
    if fb_script.exists():
        code, out = run_script(fb_script, ["--check", str(mf)])
        if code != 0:
            for line in out.splitlines():
                if "建议" in line or "hint" in line.lower():
                    warns.append(line.strip())
                elif line.strip():
                    errors.append(line.strip())
            if not any("password" in e for e in errors):
                errors.append("反馈密码未配置（Phase 3.5a · 运行 set-feedback-password.py）")
    else:
        fb = manifest.get("feedback")
        if not isinstance(fb, dict):
            errors.append("manifest 缺少 feedback（Phase 3.5a）")
        elif fb.get("teacher_declined") is not True:
            sha = str(fb.get("password_sha256", "")).strip()
            if not re.fullmatch(r"[a-f0-9]{64}", sha):
                errors.append("feedback.password_sha256 未设置（用 set-feedback-password.py）")

    node_script = skill_scripts / "check_node_id.py"
    if node_script.exists():
        code, out = run_script(node_script, [str(course_dir)])
        if code != 0:
            errors.append("node_id 校验失败（不在知识树且非合法 ext-*）")
            for line in out.splitlines()[:6]:
                if line.strip():
                    info.append(line.strip())
        else:
            for line in out.splitlines()[:4]:
                if line.strip():
                    info.append(line.strip())
    else:
        warns.append("未找到 check_node_id.py，跳过 node_id 树校验")

    validator = SCRIPT_DIR / "validate-courseware.py"
    if validator.exists() and (REPO_ROOT / "community").is_dir():
        code, out = run_script(validator, [course_dir.name], timeout=300)
        if code != 0:
            errors.append("validate-courseware.py 未通过（见下方明细）")
            for line in out.splitlines():
                s = line.strip()
                if s.startswith("❌") or ": " in s and any(
                    kw in s for kw in ("error", "错误", "缺少", "无效", "阻断", "FAIL")
                ):
                    if course_dir.name in s or "错误" in s:
                        info.append(s.lstrip("❌ ").strip())
    else:
        cjs = skill_scripts / "validate-courseware.cjs"
        if cjs.exists() and shutil_which("node"):
            code, out = run_node_validate(cjs, course_dir)
            if code != 0:
                errors.append("validate-courseware.cjs 未通过")
                info.extend(out.splitlines()[:12])

    ok = len(errors) == 0
    return {
        "ok": ok,
        "course_id": course_id,
        "node_id": node_manifest,
        "is_ext": is_ext,
        "errors": errors,
        "warns": warns,
        "info": info,
    }


def shutil_which(cmd: str) -> str | None:
    import shutil
    return shutil.which(cmd)


def run_node_validate(cjs: Path, course_dir: Path) -> tuple[int, str]:
    r = subprocess.run(
        ["node", str(cjs), str(course_dir)],
        capture_output=True,
        text=True,
        timeout=300,
    )
    return r.returncode, (r.stdout or "") + (r.stderr or "")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("course_dir", help="课件目录或 course_id")
    ap.add_argument("--json", action="store_true", help="JSON 输出")
    ap.add_argument("--no-finalize", action="store_true",
                    help="跳过 finalize 自动补模块/音频（仅校验）")
    args = ap.parse_args()

    course = locate_course(args.course_dir)
    if not course:
        print(f"❌ 找不到课件目录: {args.course_dir}", file=sys.stderr)
        return 2

    report = check_publish_readiness(course, finalize=not args.no_finalize)
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(f"TeachAny preflight-publish · {report.get('course_id', course.name)}")
        print(f"  目录: {course}")
        if report.get("node_id"):
            ext_tag = " [ext → 其他知识]" if report.get("is_ext") else ""
            print(f"  node_id: {report['node_id']}{ext_tag}")
        print()
        for line in report.get("info", []):
            print(f"  ℹ️  {line}")
        for line in report.get("warns", []):
            print(f"  ⚠️  {line}")
        for line in report.get("errors", []):
            print(f"  ❌ {line}")
        print()
        if report["ok"]:
            print("✅ 发布前检查通过，可执行 TEACHANY_UPLOAD_CONFIRMED=1 hang_tree.py publish")
        else:
            print("❌ 发布前检查未通过，请修复上述错误后再 publish（避免 PR/挂树失败）")

    return 0 if report["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
