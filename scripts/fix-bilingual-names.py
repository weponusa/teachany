#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复所有课件 manifest.json 的双语命名（name 中文 + name_en 英文）。

问题背景（v6.10 发现）：
  - 121 个 community/ 课件 manifest 的 name 字段直接是 id（如 "math-e-percentage"）
  - 126 个真课件缺 name_en 字段
  - 导致 Gallery 卡片只显示 id 或单语言

修复策略：
  1. 读 community/<id>/index.html 的 <title> 抓真中文标题
  2. 标题清洗：去掉 emoji、年级后缀（"百分数大冒险 🎯 六年级数学" → "百分数大冒险"）
  3. 写回 manifest.name（确保是中文）
  4. 用学科领域词表机翻一份 name_en（不是 AI 翻译，而是查中英对照表）
  5. 同时处理 examples/ 下的课件

用法：
    python3 scripts/fix-bilingual-names.py             # dry-run 预览
    python3 scripts/fix-bilingual-names.py --apply     # 真写入
    python3 scripts/fix-bilingual-names.py --apply --only community  # 只改 community/
"""
import argparse
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ─── 中英对照表（高频学科词）─────────────
ZH_TO_EN = {
    # 数学
    "百分数": "Percentage", "分数": "Fractions", "小数": "Decimals", "整数": "Integers",
    "加法": "Addition", "减法": "Subtraction", "乘法": "Multiplication", "除法": "Division",
    "方程": "Equations", "不等式": "Inequalities", "函数": "Functions",
    "一次函数": "Linear Functions", "二次函数": "Quadratic Functions", "反比例函数": "Inverse Proportion",
    "三角形": "Triangles", "四边形": "Quadrilaterals", "圆": "Circles",
    "立体图形": "3D Shapes", "面积": "Area", "周长": "Perimeter", "体积": "Volume",
    "几何": "Geometry", "代数": "Algebra", "统计": "Statistics", "概率": "Probability",
    "运算": "Operations", "运算律": "Operation Laws",
    "对称": "Symmetry", "平移": "Translation", "旋转": "Rotation",
    "位置": "Position", "方向": "Direction",
    "平均数": "Mean", "中位数": "Median", "众数": "Mode",
    "正比例": "Proportion", "反比例": "Inverse Proportion",
    # 语文
    "拼音": "Pinyin", "声母": "Initial Consonants", "韵母": "Vowels", "音节": "Syllables",
    "古诗": "Classical Poetry", "古诗词": "Classical Chinese Poetry",
    "记叙文": "Narrative Writing", "议论文": "Argumentative Essay", "说明文": "Expository Writing",
    "文言文": "Classical Chinese", "现代文": "Modern Chinese",
    "阅读": "Reading", "写作": "Writing", "听说": "Listening and Speaking",
    "成语": "Idioms", "诗词": "Poetry", "散文": "Prose",
    # 英语
    "句型": "Sentence Patterns", "时态": "Tenses", "语法": "Grammar", "词汇": "Vocabulary",
    "听力": "Listening", "阅读理解": "Reading Comprehension",
    # 物理
    "力学": "Mechanics", "热学": "Thermodynamics", "光学": "Optics", "电磁": "Electromagnetism",
    "运动": "Motion", "压强": "Pressure", "浮力": "Buoyancy", "密度": "Density",
    "欧姆定律": "Ohm's Law", "电路": "Circuits",
    # 化学
    "原子结构": "Atomic Structure", "元素周期表": "Periodic Table",
    "化学方程式": "Chemical Equations", "酸碱盐": "Acids Bases Salts",
    "溶液": "Solutions", "化学反应": "Chemical Reactions",
    # 生物
    "细胞": "Cells", "细胞分裂": "Cell Division", "光合作用": "Photosynthesis",
    "呼吸作用": "Respiration", "遗传": "Genetics", "进化": "Evolution",
    "生态系统": "Ecosystem", "生物圈": "Biosphere",
    # 地理
    "地形": "Terrain", "气候": "Climate", "季风": "Monsoon", "板块": "Plates",
    # 历史
    "工业革命": "Industrial Revolution", "二战": "WWII", "辛亥革命": "Xinhai Revolution",
    "秦汉": "Qin Han Dynasties", "唐宋": "Tang Song Dynasties",
    "英国资产阶级革命": "English Bourgeois Revolution",
    # 通用
    "概念": "Concept", "性质": "Properties", "应用": "Applications", "实践": "Practice",
    "启蒙": "Introduction", "进阶": "Advanced", "总结": "Summary", "复习": "Review",
    "大冒险": "Adventure", "小课堂": "Class", "之旅": "Journey", "探索": "Exploration",
    "节奏": "Rhythm", "平仄": "Tonal Rhythm",
    "小池": "Xiaochi Poem", "池上": "Chishang Poem",
    "跨学科": "Cross-Disciplinary", "实践": "Practice",
    # 学段年级
    "小学": "Elementary", "初中": "Middle School", "高中": "High School",
    "一年级": "Grade 1", "二年级": "Grade 2", "三年级": "Grade 3",
    "四年级": "Grade 4", "五年级": "Grade 5", "六年级": "Grade 6",
    "七年级": "Grade 7", "八年级": "Grade 8", "九年级": "Grade 9",
}


def extract_title_from_html(html_file):
    """从 HTML 提取真实中文标题"""
    if not html_file.exists():
        return None, None
    try:
        text = html_file.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return None, None

    # 优先 <title>
    m = re.search(r"<title[^>]*>([^<]+)</title>", text)
    if m:
        title_full = m.group(1).strip()
    else:
        # 备选 <h1>
        m = re.search(r"<h1[^>]*>([^<]+)</h1>", text)
        title_full = m.group(1).strip() if m else None

    if not title_full:
        return None, None

    # 清洗：去掉 "- TeachAny ..." / "· TeachAny ..." 之后的版本部分
    title_clean = re.split(r"\s*[·\-—]\s*TeachAny", title_full)[0].strip()

    # 提取核心标题（去 emoji + 去年级学科后缀）
    # 例 "百分数大冒险 🎯 六年级数学" → "百分数大冒险"
    # 去 emoji
    core = re.sub(
        r"[\U0001F300-\U0001F9FF\U0001FA00-\U0001FAFF\U00002600-\U000027BF\U0001F600-\U0001F64F\U0001F680-\U0001F6FF\U00002700-\U000027BF]",
        "", title_clean
    ).strip()

    # 去末尾"X年级Y学科"
    core = re.sub(r"\s+[一二三四五六七八九十\d]+年级\s*\S*$", "", core).strip()
    core = re.sub(r"\s+(小学|初中|高中)\S*$", "", core).strip()
    # 去 "· 学科 GN" 形式
    core = re.sub(r"\s*[·•]\s*\S+\s*G\d+\s*$", "", core).strip()
    # 去末尾的分隔符（"· | / -" 等悬挂符号）
    core = re.sub(r"[\s·•|/\-—]+$", "", core).strip()
    # 去开头的分隔符
    core = re.sub(r"^[\s·•|/\-—]+", "", core).strip()

    return title_full, core


def gen_name_en(zh_name):
    """从中文 name 机翻 name_en（基于词表，要求至少匹配 60% 字符才返回，否则返回 None）"""
    if not zh_name:
        return None

    # 直接命中
    if zh_name in ZH_TO_EN:
        return ZH_TO_EN[zh_name]

    # 去 emoji + 切词
    cleaned = re.sub(r"[\U0001F300-\U0001F9FF\U00002600-\U000027BF]", "", zh_name).strip()
    # 去标点
    cleaned = re.sub(r"[·•|/\-—\s]", "", cleaned)

    if not cleaned:
        return None

    # 拼词法 + 统计字符覆盖率
    parts = []
    matched_chars = 0
    i = 0
    while i < len(cleaned):
        # 贪心匹配最长词
        matched = False
        for L in range(min(8, len(cleaned) - i), 1, -1):  # 至少 2 字
            seg = cleaned[i:i + L]
            if seg in ZH_TO_EN:
                parts.append(ZH_TO_EN[seg])
                matched_chars += L
                i += L
                matched = True
                break
        if not matched:
            i += 1

    coverage = matched_chars / len(cleaned) if cleaned else 0
    # 至少 50% 字符要被覆盖才用机翻结果（否则给 None 让人工补）
    if parts and coverage >= 0.5:
        return " ".join(parts)

    return None


def fix_one(course_dir, apply=False):
    """修一个课件目录"""
    mf = course_dir / "manifest.json"
    html = course_dir / "index.html"

    if not mf.exists():
        return ("no_manifest", course_dir.name)

    try:
        m = json.load(open(mf))
    except Exception as e:
        return ("manifest_broken", course_dir.name)

    cid = m.get("course_id") or m.get("id") or course_dir.name
    name_now = m.get("name", "").strip()
    name_en_now = m.get("name_en", "").strip()

    has_zh_name = bool(re.search(r"[\u4e00-\u9fff]", name_now))

    actions = []

    # 修中文 name
    if not has_zh_name:
        title_full, core = extract_title_from_html(html)
        if core and re.search(r"[\u4e00-\u9fff]", core):
            actions.append(f"name: '{name_now}' → '{core}'")
            m["name"] = core
            name_now = core
            has_zh_name = True
        else:
            actions.append(f"⚠️ 中文 name 缺失，HTML 也没法提取（{title_full}）")

    # 补 name_en
    if has_zh_name and not name_en_now:
        en = gen_name_en(name_now)
        if en:
            actions.append(f"name_en: → '{en}'")
            m["name_en"] = en
        else:
            actions.append(f"⚠️ name_en 词表无匹配，'{name_now}' 需人工补")

    if actions and apply:
        with open(mf, "w") as f:
            json.dump(m, f, ensure_ascii=False, indent=2)

    return ("changed" if actions else "ok", cid, actions)


def scan_dir(root_dir, apply, only):
    if only and root_dir.name != only:
        return

    print(f"\n=== 扫描 {root_dir} ===")
    changed = 0
    failed = 0
    skipped = 0
    for item in sorted(root_dir.iterdir()):
        if not item.is_dir():
            continue
        if item.name in ("drafts", "pending", "official", ".git"):
            continue
        result = fix_one(item, apply=apply)
        status = result[0]
        if status == "changed":
            changed += 1
            print(f"  ✏️  {item.name}")
            for a in result[2]:
                print(f"     {a}")
        elif status == "ok":
            skipped += 1
        else:
            failed += 1
            print(f"  ❌ {item.name}: {status}")
    print(f"\n  统计: {changed} 修改 / {skipped} 已合规 / {failed} 失败")
    return changed, skipped, failed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="真写入（默认 dry-run）")
    ap.add_argument("--only", choices=["community", "examples"], help="只处理某一目录")
    args = ap.parse_args()

    if not args.apply:
        print("⚠️  Dry-run 模式（用 --apply 真写入）\n")

    grand_changed = grand_skipped = grand_failed = 0

    for sub in ["community", "examples"]:
        d = ROOT / sub
        if d.exists():
            ret = scan_dir(d, args.apply, args.only)
            if ret:
                c, s, f = ret
                grand_changed += c
                grand_skipped += s
                grand_failed += f

    print(f"\n═══════════════════════════════════════")
    print(f"  总计: {grand_changed} 修改 / {grand_skipped} 已合规 / {grand_failed} 失败")
    print(f"═══════════════════════════════════════")

    if not args.apply and grand_changed > 0:
        print(f"\n用 --apply 真正写入")


if __name__ == "__main__":
    main()
