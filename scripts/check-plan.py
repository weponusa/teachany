#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check-plan.py（v7.9.13）—— Phase 1.5 PLAN.md 硬校验

用法:
    python3 scripts/check-plan.py <课件目录>
    python3 scripts/check-plan.py community/bio-m-classification

退出码:
    0 = 通过
    1 = PLAN.md 缺失 / 第 2 节表格结构非法 / 五件套自检未勾选
    2 = 媒体策划表声明的资产文件在课件目录中不存在
    3 = 媒体策划表使用了禁用的媒体形式（如 Web Speech / 内联 SVG 充 Hero / 手写 SVG 图谱）
    4 = 知识图谱行未声明公共模块（v7.9.13 #69）

校验逻辑（对照 RULES.md #68 #69 + phases/workflow.md Phase 1.5）:
    A. PLAN.md 存在且可读
    B. 必须包含 6 个章节锚点: "## 1."/"## 2."/"## 3."/"## 4."/"## 5."/"## 6."
    C. 第 2 节"模块级媒体策划表"是合法 Markdown table
       - 首行是表头（含 "# | 模块名 | 知识点 | 媒体形式 | 资产文件名 | 生成命令 | 校验命令"）
       - 数据行 ≥5 行
       - 每行 7 列，无空单元格 / "TBD" / "待定" / "-" / "N/A"
    D. 媒体形式白名单过滤
       允许: Hero 图 / Remotion 视频 / Canvas 互动 / Edge TTS 音频 / 标准模块 /
             path.html 卡 / SVG 插图 / GeoJSON 地图 / Leaflet 地图
       禁用: Web Speech / speechSynthesis / 内联 SVG（作 Hero）/ Canvas 动画（代替 Remotion）/
             手写 SVG 图谱（v7.9.13 #69）
    E. 第 3 节"五件套自检清单" 5 项必须全部勾选 [x]
    F. 资产文件存在性
       - 资产文件名指向课件本地文件（非 inline / 非 复用模块）必须真实存在
    G. 知识图谱模块合规（v7.9.13 #69）
       - 模块名含"知识图谱"的行：媒体形式必须含"标准模块"或"标准公共模块"
       - 资产文件名必须含 "data-teachany-kg" 字样
       - 校验命令必须含 "check-knowledge-graph"
"""

import os
import re
import sys
import json
from pathlib import Path


# ========== 白名单 / 黑名单 ==========

ALLOWED_MEDIA_FORMS = [
    "Hero 图", "Hero图",
    "Remotion 视频", "Remotion视频",
    "Canvas 互动", "Canvas互动",
    "Edge TTS 音频", "EdgeTTS音频", "TTS 音频", "TTS音频",
    "标准模块",
    "path.html 卡", "path.html卡",
    "SVG 插图", "SVG插图",
    "GeoJSON 地图", "GeoJSON地图",
    "Leaflet 地图", "Leaflet地图",
]

FORBIDDEN_MEDIA_PATTERNS = [
    (r"Web\s*Speech", "Web Speech API（违反 #16 #64，必须用 Edge TTS mp3）"),
    (r"speechSynthesis", "window.speechSynthesis（违反 #16 #64，必须用 Edge TTS mp3）"),
    (r"Canvas.*替代.*Remotion", "Canvas 动画替代 Remotion（违反 #32）"),
    (r"Canvas.*代替.*Remotion", "Canvas 动画代替 Remotion（违反 #32）"),
    (r"GIF.*代替.*视频", "GIF 代替视频（违反 #32）"),
    (r"手写\s*SVG.*图谱", "手写 SVG 画知识图谱（违反 v7.9.13 #69，必须用 teachany-knowledge-graph.js 公共模块）"),
    (r"内联\s*SVG.*图谱", "内联 SVG 画知识图谱（违反 v7.9.13 #69，必须用公共模块）"),
    (r"自画.*图谱", "自画知识图谱（违反 v7.9.13 #69）"),
]

# 资产路径前缀白名单（不作文件存在性检查的"虚拟路径"）
VIRTUAL_ASSET_PREFIXES = [
    "inline",
    "scripts/",  # 标准模块（复用）
    "data-",     # HTML 属性声明
    "<",         # HTML 片段
    "自动",
    "复用",
]

# ========== 工具函数 ==========

def red(text):    return f"\033[31m{text}\033[0m"
def green(text):  return f"\033[32m{text}\033[0m"
def yellow(text): return f"\033[33m{text}\033[0m"
def bold(text):   return f"\033[1m{text}\033[0m"


def die(code, msg):
    print(red(f"❌ FAIL [{code}]: {msg}"))
    sys.exit(code)


def ok(msg):
    print(green(f"✅ {msg}"))


def warn(msg):
    print(yellow(f"⚠️  {msg}"))


# ========== 核心校验 ==========

def parse_media_table(plan_text: str):
    """从 PLAN.md 第 2 节提取 Markdown 表格。返回 list[list[str]]。"""
    # 定位第 2 节
    m = re.search(r"##\s*2\.\s*模块级媒体策划表[^\n]*\n", plan_text)
    if not m:
        return None, "未找到 '## 2. 模块级媒体策划表' 锚点"
    section_start = m.end()

    m2 = re.search(r"\n##\s*3\.\s*", plan_text[section_start:])
    section_end = section_start + m2.start() if m2 else len(plan_text)

    section = plan_text[section_start:section_end]

    # 抽取表格行（以 | 开头 | 结尾）
    rows = []
    for line in section.split("\n"):
        line = line.strip()
        if not line.startswith("|") or not line.endswith("|"):
            continue
        # 跳过 Markdown table 分隔线 |:---|:---|
        if re.match(r"^\|[\s:|\-]+\|$", line):
            continue
        cells = [c.strip() for c in line[1:-1].split("|")]
        rows.append(cells)

    if not rows:
        return None, "第 2 节未找到任何 Markdown 表格行"

    return rows, None


def check_five_pack(plan_text: str):
    """第 3 节五件套自检 5 项必须全部勾选。"""
    m = re.search(r"##\s*3\.\s*五件套自检清单[^\n]*\n", plan_text)
    if not m:
        return False, "未找到 '## 3. 五件套自检清单' 锚点"
    section_start = m.end()
    m2 = re.search(r"\n##\s*4\.\s*", plan_text[section_start:])
    section_end = section_start + m2.start() if m2 else len(plan_text)
    section = plan_text[section_start:section_end]

    checked = len(re.findall(r"-\s*\[[xX]\]", section))
    unchecked = len(re.findall(r"-\s*\[\s\]", section))

    if checked < 5:
        return False, f"五件套自检仅 {checked}/5 项勾选（还有 {unchecked} 项未勾）"
    return True, f"五件套 {checked}/5 项全部勾选"


def check_asset_exists(asset_name: str, course_dir: Path) -> bool:
    """判断资产文件是否真实存在。"""
    s = asset_name.strip()
    if not s or s in ("-", "N/A", "TBD", "待定"):
        return False
    # 虚拟路径跳过
    for prefix in VIRTUAL_ASSET_PREFIXES:
        if s.startswith(prefix) or prefix in s:
            return True
    # 取第一个路径片段（反引号、空格、逗号前）
    token = re.split(r"[`\s,；;]", s)[0]
    token = token.strip("`*_ ")
    if not token:
        return True  # 无法解析 token 视为通过（避免误杀）
    # 支持 assets/tts/*.mp3 通配
    if "*" in token:
        pattern = token
        from fnmatch import fnmatch
        for root, _, files in os.walk(course_dir):
            for f in files:
                rel = Path(root).joinpath(f).relative_to(course_dir).as_posix()
                if fnmatch(rel, pattern):
                    return True
        return False
    # 精确文件路径
    p = course_dir / token
    return p.exists()


def check_forbidden_media(rows):
    """扫描媒体形式列，发现禁用模式报错。"""
    violations = []
    for i, row in enumerate(rows[1:], start=1):  # rows[0] 是表头
        if len(row) < 4:
            continue
        form = row[3]
        for pattern, reason in FORBIDDEN_MEDIA_PATTERNS:
            if re.search(pattern, form, re.IGNORECASE):
                violations.append((i, row[1] if len(row) > 1 else "?", form, reason))
    return violations


def check_knowledge_graph_row(rows):
    """v7.9.13 #69：扫描"知识图谱"模块行，必须声明公共模块。

    规则：
      - 行.模块名 含 "知识图谱"
      - 媒体形式 必须含 "标准模块" 或 "标准公共模块"
      - 资产文件名 必须含 "data-teachany-kg"
      - 校验命令 必须含 "check-knowledge-graph"

    返回 (is_ok: bool, errors: list[str])
    """
    errors = []
    kg_row_found = False
    for i, row in enumerate(rows[1:], start=1):
        if len(row) < 7:
            continue
        module_name = row[1]
        if "知识图谱" not in module_name:
            continue
        kg_row_found = True
        form = row[3]
        asset = row[4]
        check_cmd = row[6]

        if not re.search(r"标准(公共)?模块", form):
            errors.append(
                f"第 {i} 行模块'{module_name}' 媒体形式='{form}'，"
                f"但 v7.9.13 #69 要求知识图谱必须使用【标准公共模块】"
            )
        if "data-teachany-kg" not in asset:
            errors.append(
                f"第 {i} 行模块'{module_name}' 资产文件名='{asset}'，"
                f"必须含 'data-teachany-kg=\"<node_id>\"'（v7.9.13 #69）"
            )
        if "check-knowledge-graph" not in check_cmd:
            errors.append(
                f"第 {i} 行模块'{module_name}' 校验命令='{check_cmd}'，"
                f"必须含 'check-knowledge-graph.py'（v7.9.13 #69）"
            )

    if not kg_row_found:
        errors.append("媒体策划表中缺少'知识图谱'模块行（v7.9.13 #69 要求 M6 必须列出）")

    return len(errors) == 0, errors


def main():
    if len(sys.argv) < 2:
        print("用法: python3 scripts/check-plan.py <课件目录>")
        sys.exit(1)

    course_dir = Path(sys.argv[1]).resolve()
    if not course_dir.is_dir():
        die(1, f"目录不存在: {course_dir}")

    plan_path = course_dir / "PLAN.md"
    print(bold(f"🔒 check-plan.py v7.9.13 —— 检查 {course_dir.name}"))
    print(f"   PLAN.md 路径: {plan_path}")

    # A. 存在性
    if not plan_path.exists():
        die(1, f"PLAN.md 不存在于课件目录（违反 Phase 1.5 MANDATORY CHECKPOINT / #68 #69）")

    plan_text = plan_path.read_text(encoding="utf-8")
    ok(f"PLAN.md 存在（{len(plan_text)} 字节）")

    # B. 章节锚点
    required_sections = [
        r"##\s*1\.",
        r"##\s*2\.\s*模块级媒体策划表",
        r"##\s*3\.\s*五件套自检",
        r"##\s*4\.\s*Subagent 派遣",
        r"##\s*5\.",
        r"##\s*6\.",
    ]
    missing = [p for p in required_sections if not re.search(p, plan_text)]
    if missing:
        die(1, f"缺少章节锚点: {missing}")
    ok("6 个章节锚点齐全")

    # C. 第 2 节表格结构
    rows, err = parse_media_table(plan_text)
    if err:
        die(1, err)

    if len(rows) < 6:  # 表头 + 5 行数据
        die(1, f"模块级媒体策划表行数不足（含表头 {len(rows)} 行，要求数据 ≥5 行）")

    # 检查表头
    header = rows[0]
    expected_headers = ["#", "模块名", "知识点", "媒体形式", "资产文件名", "生成命令", "校验命令"]
    if len(header) != 7:
        die(1, f"表头列数 = {len(header)}，应为 7。表头: {header}")
    for i, eh in enumerate(expected_headers):
        if eh not in header[i]:
            die(1, f"第 {i+1} 列表头应含 '{eh}'，实际 '{header[i]}'")
    ok(f"表头 7 列正确")

    # 检查数据行：无空单元 / TBD / 待定
    BAD_CELL_VALUES = {"", "TBD", "tbd", "待定", "N/A", "n/a", "NA", "-", "—"}
    for i, row in enumerate(rows[1:], start=1):
        if len(row) != 7:
            die(1, f"第 {i} 行列数 = {len(row)}，应为 7。行内容: {row}")
        for j, cell in enumerate(row):
            if cell.strip() in BAD_CELL_VALUES:
                die(1, f"第 {i} 行第 {j+1} 列为空/TBD/待定（单元内容='{cell}'）")
    ok(f"数据行 {len(rows)-1} 行，7 列全填")

    # D. 禁用媒体形式
    violations = check_forbidden_media(rows)
    if violations:
        print(red("\n❌ 媒体形式白名单违规："))
        for i, module, form, reason in violations:
            print(red(f"   行 {i} 模块'{module}' 媒体='{form}' → {reason}"))
        die(3, "PLAN.md 使用了禁用的媒体形式（违反 #68 #69）")
    ok("媒体形式白名单通过（无 Web Speech / 内联 SVG 充 Hero / Canvas 代替 Remotion / 手写 SVG 图谱）")

    # D.5 知识图谱行合规（v7.9.13 #69）
    kg_ok, kg_errs = check_knowledge_graph_row(rows)
    if not kg_ok:
        print(red("\n❌ 知识图谱模块行违规（v7.9.13 #69）："))
        for err in kg_errs:
            print(red(f"   {err}"))
        die(4, "PLAN.md 知识图谱行不合规（违反 #69）")
    ok("知识图谱模块行合规（声明公共模块 + data-teachany-kg + check-knowledge-graph）")

    # E. 五件套自检
    five_pack_ok, five_pack_msg = check_five_pack(plan_text)
    if not five_pack_ok:
        die(1, five_pack_msg)
    ok(five_pack_msg)

    # F. 资产文件存在性
    print()
    missing_assets = []
    for i, row in enumerate(rows[1:], start=1):
        asset_name = row[4]
        module_name = row[1]
        if not check_asset_exists(asset_name, course_dir):
            missing_assets.append((i, module_name, asset_name))

    if missing_assets:
        print(red(f"\n❌ 以下资产文件声明但不存在:"))
        for i, m, a in missing_assets:
            print(red(f"   行 {i} 模块'{m}' 声明资产='{a}' 在 {course_dir} 下未找到"))
        die(2, f"{len(missing_assets)} 个资产缺失（违反 #68 PLAN.md 与产物一致性）")
    ok(f"{len(rows)-1} 个资产文件全部存在")

    # 通过
    print()
    print(green(bold("═" * 60)))
    print(green(bold("✅ Phase 1.5 Gate 通过 —— PLAN.md 合规，可进入 Phase 2-3")))
    print(green(bold("═" * 60)))
    sys.exit(0)


if __name__ == "__main__":
    main()
