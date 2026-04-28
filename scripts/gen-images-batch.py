#!/usr/bin/env python3
"""
批量图片生成脚本：从课件 HTML 提取 <img src="./assets/xxx.png" alt="..."> 并用 Pillow 生成信息图。
符合硬规则 #51：使用 Arial Unicode MS 字体。
用法：python3 scripts/gen-images-batch.py community/bio-h-*
"""
import re
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# ═══ 字体设置（硬规则 #51） ═══
FONT_FALLBACK = [
    "/Library/Fonts/Arial Unicode.ttf",          # macOS
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",  # Linux
    "/System/Library/Fonts/PingFang.ttc",         # macOS fallback
]

def get_font(size=24):
    for fp in FONT_FALLBACK:
        if Path(fp).exists():
            return ImageFont.truetype(fp, size)
    return ImageFont.load_default()

# ═══ 配色方案 ═══
PALETTE = {
    'bg':      (15, 23, 42),      # 深蓝黑
    'card':    (30, 41, 59),      # 深蓝灰
    'primary': (96, 165, 250),    # 蓝
    'accent':  (251, 191, 36),    # 金黄
    'green':   (52, 211, 153),    # 绿
    'text':    (226, 232, 240),   # 浅灰白
    'text2':   (148, 163, 184),   # 灰
    'border':  (51, 65, 85),      # 边框灰
}


def draw_rounded_rect(draw, xy, radius, fill, outline=None):
    x0, y0, x1, y1 = xy
    draw.rectangle([x0+radius, y0, x1-radius, y1], fill=fill)
    draw.rectangle([x0, y0+radius, x1, y1-radius], fill=fill)
    draw.pieslice([x0, y0, x0+2*radius, y0+2*radius], 180, 270, fill=fill)
    draw.pieslice([x1-2*radius, y0, x1, y0+2*radius], 270, 360, fill=fill)
    draw.pieslice([x0, y1-2*radius, x0+2*radius, y1], 90, 180, fill=fill)
    draw.pieslice([x1-2*radius, y1-2*radius, x1, y1], 0, 90, fill=fill)
    if outline:
        draw.arc([x0, y0, x0+2*radius, y0+2*radius], 180, 270, fill=outline)
        draw.arc([x1-2*radius, y0, x1, y0+2*radius], 270, 360, fill=outline)
        draw.arc([x0, y1-2*radius, x0+2*radius, y1], 90, 180, fill=outline)
        draw.arc([x1-2*radius, y1-2*radius, x1, y1], 0, 90, fill=outline)
        draw.line([x0+radius, y0, x1-radius, y0], fill=outline)
        draw.line([x0+radius, y1, x1-radius, y1], fill=outline)
        draw.line([x0, y0+radius, x0, y1-radius], fill=outline)
        draw.line([x1, y0+radius, x1, y1-radius], fill=outline)


def generate_hero_image(title, subtitle, output_path, width=800, height=400):
    """生成 Hero 首图（渐变背景 + 大标题）"""
    img = Image.new('RGB', (width, height), PALETTE['bg'])
    draw = ImageDraw.Draw(img)

    # 渐变装饰条
    for i in range(height):
        r = int(15 + (96-15) * i / height * 0.3)
        g = int(23 + (165-23) * i / height * 0.3)
        b = int(42 + (250-42) * i / height * 0.3)
        draw.line([(0, i), (width, i)], fill=(r, g, b))

    # 装饰圆
    draw.ellipse([width-200, -80, width+40, 160], fill=(96, 165, 250, 40), outline=None)
    draw.ellipse([-60, height-180, 180, height+60], fill=(251, 191, 36, 30), outline=None)

    # 顶部标签
    font_sm = get_font(16)
    draw.text((40, 30), "TeachAny · 高中生物", font=font_sm, fill=PALETTE['accent'])

    # 主标题
    font_lg = get_font(36)
    draw.text((40, height//2 - 50), title, font=font_lg, fill=PALETTE['text'])

    # 副标题
    font_md = get_font(18)
    if subtitle:
        draw.text((40, height//2 + 10), subtitle, font=font_md, fill=PALETTE['text2'])

    # 底部装饰线
    draw.line([(40, height-40), (width-40, height-40)], fill=PALETTE['primary'], width=2)

    img.save(str(output_path), 'PNG')


def generate_diagram_image(title, labels, output_path, width=800, height=500):
    """生成结构/流程图风格的信息图"""
    img = Image.new('RGB', (width, height), PALETTE['bg'])
    draw = ImageDraw.Draw(img)

    # 标题
    font_title = get_font(24)
    font_label = get_font(16)
    font_sm = get_font(14)

    draw.text((40, 20), title, font=font_title, fill=PALETTE['text'])
    draw.line([(40, 55), (width-40, 55)], fill=PALETTE['border'], width=1)

    # 绘制标签卡片
    colors = [PALETTE['primary'], PALETTE['green'], PALETTE['accent'],
              (167, 139, 250), (248, 113, 113), (34, 211, 238)]
    n = len(labels)
    if n <= 3:
        # 横排
        card_w = (width - 80 - (n-1)*20) // n
        card_h = 300
        y0 = 80
        for i, label in enumerate(labels):
            x0 = 40 + i * (card_w + 20)
            color = colors[i % len(colors)]
            draw_rounded_rect(draw, [x0, y0, x0+card_w, y0+card_h], 12, PALETTE['card'], outline=color)
            # 顶部色条
            draw.rectangle([x0, y0, x0+card_w, y0+4], fill=color)
            # 标签文本（自动换行）
            text_lines = []
            line = ''
            for char in label:
                line += char
                if len(line) >= (card_w // 18):
                    text_lines.append(line)
                    line = ''
            if line:
                text_lines.append(line)
            for j, tl in enumerate(text_lines[:8]):
                draw.text((x0+16, y0+24+j*22), tl, font=font_label, fill=PALETTE['text'])
    else:
        # 网格
        cols = min(3, n)
        rows = (n + cols - 1) // cols
        card_w = (width - 80 - (cols-1)*16) // cols
        card_h = min(120, (height - 100) // rows - 12)
        for i, label in enumerate(labels):
            r, c = divmod(i, cols)
            x0 = 40 + c * (card_w + 16)
            y0 = 80 + r * (card_h + 12)
            color = colors[i % len(colors)]
            draw_rounded_rect(draw, [x0, y0, x0+card_w, y0+card_h], 10, PALETTE['card'], outline=color)
            draw.rectangle([x0, y0, x0+4, y0+card_h], fill=color)
            # 文本
            text_lines = []
            line = ''
            for char in label:
                line += char
                if len(line) >= (card_w // 16):
                    text_lines.append(line)
                    line = ''
            if line:
                text_lines.append(line)
            for j, tl in enumerate(text_lines[:4]):
                draw.text((x0+16, y0+14+j*20), tl, font=font_sm, fill=PALETTE['text'])

    # 底部水印
    draw.text((width-200, height-25), "TeachAny · Pillow 生成", font=font_sm, fill=PALETTE['text2'])
    img.save(str(output_path), 'PNG')


# ═══ 每个课件的图片配置 ═══
IMAGE_CONFIG = {
    'bio-h-cell-membrane': {
        'hero-knowledge-map.png': ('hero', '细胞膜结构', '磷脂双分子层 · 流动镶嵌模型'),
        'membrane-diagram.png': ('diagram', '细胞膜结构示意图', ['磷脂双分子层', '外在蛋白', '内在蛋白', '糖蛋白（糖被）', '胆固醇', '流动性']),
        'membrane-functions.png': ('diagram', '细胞膜三大功能', ['① 分隔：保护细胞内环境', '② 物质运输：自由扩散/协助扩散/主动运输', '③ 信息传递：受体蛋白识别信号分子']),
    },
    'bio-h-cell-metabolism': {
        'hero-cell-metabolism.png': ('hero', '细胞代谢总论', '酶 · ATP · 物质与能量变化'),
        'cell-metabolism-overview.png': ('diagram', '细胞代谢概述', ['同化作用（合成代谢）', '异化作用（分解代谢）', '物质代谢 ↔ 能量代谢']),
        'enzyme-mechanism.png': ('diagram', '酶促反应机制', ['酶的本质：蛋白质/RNA', '酶的特性：专一性', '酶的特性：高效性', '酶的特性：多样性', '影响因素：温度', '影响因素：pH']),
        'atp-energy-cycle.png': ('diagram', 'ATP 结构与能量循环', ['A（腺苷） - P ~ P ~ P', 'ATP ⇌ ADP + Pi + 能量', 'ATP是直接能源物质']),
    },
    'bio-h-cell-structure': {
        'hero-cell-world.png': ('hero', '细胞的基本结构', '细胞膜 · 细胞质 · 细胞核'),
        'animal-cell-structure.png': ('diagram', '动物细胞结构', ['细胞膜', '细胞质', '细胞核', '线粒体', '内质网', '高尔基体', '核糖体', '中心体', '溶酶体']),
        'plant-cell-structure.png': ('diagram', '植物细胞结构', ['细胞壁', '细胞膜', '叶绿体', '线粒体', '中央液泡', '内质网', '高尔基体', '核糖体']),
        'cell-factory-analogy.png': ('diagram', '细胞工厂类比', ['细胞膜 → 工厂大门', '细胞核 → 总指挥部', '线粒体 → 发电厂', '核糖体 → 生产车间', '高尔基体 → 物流中心', '内质网 → 运输通道']),
    },
    'bio-h-endomembrane-system': {
        'hero-endomembrane-structure.png': ('hero', '生物膜系统', '内膜系统 · 分泌蛋白转运'),
        'scene-secretory-pathway.png': ('diagram', '分泌蛋白转运流程', ['① 核糖体合成肽链', '② 内质网加工折叠', '③ 囊泡运输到高尔基体', '④ 高尔基体进一步加工', '⑤ 囊泡与细胞膜融合', '⑥ 胞吐释放到细胞外']),
        'concept-membrane-fluidity.png': ('diagram', '生物膜流动性', ['流动镶嵌模型', '磷脂分子的运动', '蛋白质的侧向移动', '膜的功能依赖于流动性']),
    },
    'bio-h-nucleus': {
        'hero-nucleus.png': ('hero', '细胞核', '遗传信息的储存与控制中心'),
        'dolly-sheep.png': ('diagram', '克隆羊多利实验', ['① 芬兰多赛特母羊提供乳腺细胞', '② 苏格兰黑面母羊提供去核卵母细胞', '③ 细胞核移植（体细胞核移植）', '④ 电脉冲融合', '⑤ 代孕母羊发育', '⑥ 多利羊诞生 → 证明细胞核含全套遗传信息']),
    },
    'bio-h-organelles': {
        'hero-knowledge-map.png': ('hero', '细胞器', '细胞的功能区室'),
        'secretion-pathway.png': ('diagram', '分泌蛋白合成运输', ['核糖体 → 内质网', '内质网 → 高尔基体', '高尔基体 → 细胞膜', '囊泡运输']),
        'cell-comparison.png': ('diagram', '植物细胞 vs 动物细胞', ['植物特有：细胞壁、叶绿体、液泡', '动物特有：中心体', '共有：线粒体、内质网、高尔基体、核糖体']),
    },
    'bio-h-prokaryote-eukaryote': {
        'hero-prokaryote-eukaryote.png': ('hero', '原核细胞与真核细胞', '有无以核膜为界限的细胞核'),
        'bacteria-structure.png': ('diagram', '细菌结构示意图', ['细胞壁', '细胞膜', '细胞质（无膜细胞器）', '核糖体（唯一细胞器）', 'DNA集中区域（拟核）', '鞭毛（部分有）']),
        'prokaryote-eukaryote-examples.png': ('diagram', '原核 vs 真核生物举例', ['原核：细菌（大肠杆菌、金黄色葡萄球菌）', '原核：蓝藻（颤藻、念珠藻、发菜）', '真核：动物（人、鱼、昆虫）', '真核：植物（水稻、菊花）', '真核：真菌（酵母菌、霉菌）']),
    },
    'bio-h-protein-nucleic-acid': {
        'hero-protein.png': ('hero', '蛋白质与核酸', '生命活动的主要承担者与携带者'),
        'protein-functions.png': ('diagram', '蛋白质的多种功能', ['结构蛋白：角蛋白、胶原蛋白', '催化（酶）：大多数酶是蛋白质', '运输：血红蛋白运输O₂', '免疫：抗体', '信息传递：胰岛素', '调节：生长激素']),
        'hero-nucleic-acid.png': ('diagram', '核酸结构', ['DNA（脱氧核糖核酸）：双链', 'RNA（核糖核酸）：单链', '基本单位：核苷酸', '碱基：A T G C（DNA）/ A U G C（RNA）']),
    },
    'bio-h-sugar-lipid': {
        'hero-sugar-lipid.png': ('hero', '糖类与脂质', '能源物质 · 储能物质 · 结构组分'),
        'phospholipid-bilayer.png': ('diagram', '磷脂双分子层', ['亲水头部（朝外）', '疏水尾部（朝内）', '构成细胞膜的基本骨架', '流动性：磷脂分子可侧向运动']),
        'energy-metabolism.png': ('diagram', '细胞能量代谢', ['糖类：主要能源物质', '脂肪：良好的储能物质', '1g脂肪释放能量 > 1g糖类', 'ATP：直接能源物质']),
    },
}


def process_course(course_dir):
    name = course_dir.name
    config = IMAGE_CONFIG.get(name, {})
    if not config:
        print(f"  ⚠ {name}: 无图片配置，跳过")
        return 0

    assets_dir = course_dir / 'assets'
    assets_dir.mkdir(exist_ok=True)

    generated = 0
    for filename, spec in config.items():
        output = assets_dir / filename
        if output.exists():
            print(f"  ⏭ {name}/assets/{filename} 已存在，跳过")
            continue

        img_type = spec[0]
        title = spec[1]
        extra = spec[2]

        if img_type == 'hero':
            generate_hero_image(title, extra, output)
        elif img_type == 'diagram':
            generate_diagram_image(title, extra, output)
        else:
            continue

        size_kb = output.stat().st_size / 1024
        print(f"  🖼 生成 {name}/assets/{filename} ({size_kb:.1f}KB)")
        generated += 1

    return generated


def main():
    dirs = []
    if len(sys.argv) > 1:
        for arg in sys.argv[1:]:
            p = Path(arg)
            if p.is_dir():
                dirs.append(p)
    else:
        community = Path('community')
        if community.exists():
            dirs = sorted(d for d in community.iterdir() if d.name.startswith('bio-h-') and d.is_dir())

    if not dirs:
        print("无课件目录可处理")
        return

    total = 0
    for d in sorted(dirs):
        print(f"\n📁 处理 {d.name}")
        n = process_course(d)
        total += n

    print(f"\n✅ 完成！共生成 {total} 张图片")


if __name__ == '__main__':
    main()
