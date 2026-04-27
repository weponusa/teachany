#!/usr/bin/env python3
"""
批量通过 NotebookLM 为 TeachAny 官方课件生成中文知识结构信息图。
流程：创建 notebook → 添加课件 HTML 为 source → 生成 infographic → 下载
"""
import asyncio
import json
import os
import sys
import time
from pathlib import Path

# 需要生成信息图的中国课标课件（排除 IB 国际课程和世界史课件）
COURSES = [
    {
        "dir": "math-linear-function",
        "title": "一次函数 y=kx+b",
        "hero_file": "linear-hero.png",
        "ask_prompt": "请为这门课生成一份中文知识结构信息图。信息图要包含：课程核心主题（一次函数 y=kx+b）、所有主要知识点及其层级关系（定义、k的意义斜率、b的意义截距、图像特征、正比例函数作为特例、待定系数法），用思维导图或概念图的形式展示，让学生一眼看到本课知识全貌。"
    },
    {
        "dir": "math-quadratic-function",
        "title": "二次函数 y=ax²+bx+c",
        "hero_file": "quadratic-hero.png",
        "ask_prompt": "请为这门课生成一份中文知识结构信息图。信息图要包含：课程核心主题（二次函数 y=ax²+bx+c）、所有主要知识点（一般式/顶点式/交点式互化、开口方向由a决定、对称轴x=-b/2a、顶点坐标、与坐标轴交点、判别式Δ、实际应用），用信息图形式展示完整知识结构。"
    },
    {
        "dir": "bio-photosynthesis",
        "title": "光合作用",
        "hero_file": "photosynthesis-hero.png",
        "ask_prompt": "请为这门课生成一份中文知识结构信息图。核心主题是光合作用（6CO₂+6H₂O→C₆H₁₂O₆+6O₂），分支展示：光反应阶段（场所、条件、产物）、暗反应阶段（CO₂固定、C₃还原）、影响因素（光照强度、CO₂浓度、温度）、意义（能量转化、物质循环）。"
    },
    {
        "dir": "chem-periodic-table",
        "title": "元素周期表",
        "hero_file": "periodic-hero.png",
        "ask_prompt": "请为这门课生成一份中文知识结构信息图。核心主题是元素周期表，分支展示：周期（横行，7个周期，电子层数递增）、族（纵列，主族与副族）、元素性质递变规律（同周期/同族变化趋势）、常见元素。"
    },
    {
        "dir": "chem-oxidation-reduction",
        "title": "氧化还原反应",
        "hero_file": "redox-hero.png",
        "ask_prompt": "请为这门课生成一份中文知识结构信息图。核心主题是氧化还原反应，分支展示：本质（电子转移）、氧化反应（失电子/化合价升高）、还原反应（得电子/化合价降低）、氧化剂与还原剂、常见实例、口诀（升失氧降得还）。"
    },
    {
        "dir": "geo-monsoon",
        "title": "全球季风系统",
        "hero_file": "monsoon-hero.png",
        "ask_prompt": "请为这门课生成一份中文知识结构信息图。核心主题是季风气候，分支展示：成因（海陆热力性质差异）、夏季风与冬季风特征、我国三大气候区、雨热同期对农业的影响。"
    },
    {
        "dir": "imperial-unification",
        "title": "秦汉统一多民族国家",
        "hero_file": "qinhan-hero.png",
        "ask_prompt": "请为这门课生成一份中文知识结构信息图。核心主题是秦汉大一统，分支展示：秦朝（统一六国、中央集权、郡县制、统一文字度量衡、修长城）、秦亡原因、西汉（休养生息、文景之治）、汉武帝大一统（推恩令、罢黜百家、张骞出使西域、丝绸之路）。"
    },
    {
        "dir": "history-sanguo-sui-tang",
        "title": "三国两晋南北朝至隋唐",
        "hero_file": "sanguo-sui-tang-hero.png",
        "ask_prompt": "请为这门课生成一份中文知识结构信息图。核心主题是从分裂到统一，分支展示：三国鼎立（魏蜀吴、赤壁之战）、两晋南北朝（北方民族融合、江南开发）、隋朝（大运河、科举制）、唐朝盛世（贞观之治、开元盛世、安史之乱）。"
    },
    {
        "dir": "history-industrial-revolution",
        "title": "工业革命",
        "hero_file": "industrial-revolution-hero.png",
        "ask_prompt": "请为这门课生成一份中文知识结构信息图。核心主题是工业革命，分支展示：时间（18世纪60年代-19世纪中期）、始于英国的原因（5大因素）、关键发明（珍妮纺纱机、水力纺纱机、蒸汽机、火车）、双重影响（经济发展vs社会问题）。"
    },
    {
        "dir": "teachany-phy-mid-pressure",
        "title": "压强",
        "hero_file": "pressure-hero.png",
        "ask_prompt": "请为这门课生成一份中文知识结构信息图。核心主题是压强p=F/S，分支展示：固体压强定义和单位（帕斯卡Pa）、增大/减小压强的方法、液体压强p=ρgh、大气压强（托里拆利实验）、连通器原理。"
    },
    {
        "dir": "sci-motion-speed",
        "title": "运动与速度",
        "hero_file": "motion-speed-hero.png",
        "ask_prompt": "请为这门课生成一份中文知识结构信息图。核心主题是运动与速度v=s÷t，分支展示：机械运动概念、参照物与相对运动、速度的定义与公式、速度单位（m/s和km/h）及换算、匀速直线运动与变速运动。"
    },
    {
        "dir": "chn-compound-vowel",
        "title": "复韵母乐园",
        "hero_file": "compound-vowel-hero.png",
        "ask_prompt": "请为这门课生成一份中文知识结构信息图。核心主题是复韵母，适合一年级小朋友。分支展示：ai ei ui（前响复韵母）、ao ou iu（后响复韵母）、标调规则（有a标a有e标e、iu并列标在后）、组词示例，用可爱活泼的风格。"
    },
    {
        "dir": "course-classical-poetry",
        "title": "古典诗词教学",
        "hero_file": "classical-poetry-hero.png",
        "ask_prompt": "请为这门课生成一份中文知识结构信息图。核心主题是古典诗词教学，分支展示：诵读技法（节奏、停连、重音）、平仄格律（平仄规则、四声）、押韵与对仗、意象解读（常见意象及象征意义）、诗体辨析（绝句、律诗、词、曲）。"
    },
]

EXAMPLES_DIR = Path("/Users/wepon/CodeBuddy/一次函数/teachany-opensource/examples")


async def process_course(course: dict, client) -> str:
    """处理单个课件：创建notebook → 添加source → 生成infographic → 下载"""
    dir_name = course["dir"]
    title = course["title"]
    hero_file = course["hero_file"]
    html_path = EXAMPLES_DIR / dir_name / "index.html"
    output_path = EXAMPLES_DIR / dir_name / "assets" / hero_file

    if not html_path.exists():
        return f"❌ {dir_name}: index.html 不存在"

    print(f"\n{'='*60}")
    print(f"📚 处理课件: {title} ({dir_name})")
    print(f"{'='*60}")

    try:
        # 1. 创建 notebook
        print(f"  1️⃣ 创建 Notebook...")
        nb = await client.notebooks.create(f"TeachAny-{title}")
        nb_id = nb.id
        print(f"     ✅ Notebook ID: {nb_id}")

        # 2. 添加课件 HTML 作为 source
        print(f"  2️⃣ 添加课件源文件...")
        await client.sources.add_file(nb_id, str(html_path))
        print(f"     ✅ 已添加: {html_path.name}")

        # 等待 source 被处理
        await asyncio.sleep(5)

        # 3. 生成 infographic
        print(f"  3️⃣ 生成信息图...")
        # 先 ask 一个问题让 notebook 理解内容
        result = await client.chat.ask(nb_id, course["ask_prompt"])
        print(f"     📝 AI 回复: {result.answer[:100]}...")

        # 等待处理
        await asyncio.sleep(3)

        # 4. 下载 infographic
        print(f"  4️⃣ 下载信息图...")
        await client.artifacts.download_infographic(nb_id, str(output_path))
        print(f"     ✅ 已保存: {output_path}")

        # 5. 清理 - 删除 notebook
        print(f"  5️⃣ 清理 Notebook...")
        await client.notebooks.delete(nb_id)
        print(f"     🗑️ 已删除")

        return f"✅ {dir_name}: 信息图已生成 → {hero_file}"

    except Exception as e:
        return f"❌ {dir_name}: {str(e)}"


async def main():
    from notebooklm import NotebookLMClient

    print("🚀 TeachAny 信息图批量生成工具")
    print(f"   共 {len(COURSES)} 个课件待处理\n")

    async with await NotebookLMClient.from_storage() as client:
        results = []
        for i, course in enumerate(COURSES, 1):
            print(f"\n[{i}/{len(COURSES)}]", end="")
            result = await process_course(course, client)
            results.append(result)
            # 课件间间隔，避免 rate limiting
            if i < len(COURSES):
                print("  ⏳ 等待 10 秒...")
                await asyncio.sleep(10)

    print("\n" + "="*60)
    print("📊 生成结果汇总")
    print("="*60)
    for r in results:
        print(f"  {r}")

    success = sum(1 for r in results if r.startswith("✅"))
    print(f"\n总计: {success}/{len(COURSES)} 成功")


if __name__ == "__main__":
    asyncio.run(main())
