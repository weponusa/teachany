#!/usr/bin/env python3
"""
批量 TTS 生成脚本：从课件 HTML 的 audioPlaylist 中提取文本，用 edge-tts 生成 mp3。
用法：python3 scripts/gen-tts-batch.py community/bio-h-*
"""
import asyncio
import json
import re
import sys
from pathlib import Path

VOICE = "zh-CN-YunxiNeural"  # 男声，清晰自然
RATE = "+0%"


def extract_playlist(html_text):
    """从 HTML 中提取 audioPlaylist 数据"""
    # 匹配 const audioPlaylist = [...];
    m = re.search(r'(?:const|let|var)\s+audioPlaylist\s*=\s*\[([\s\S]*?)\];', html_text)
    if not m:
        return []
    raw = m.group(1)
    # 用正则逐条提取每个 {...} 对象
    items = []
    for block in re.finditer(r'\{([^}]+)\}', raw):
        item = {}
        content = block.group(1)
        # 提取 src 或 file 字段（兼容双引号和单引号）
        src_m = re.search(r'(?:src|file)\s*:\s*"([^"]+)"', content)
        if not src_m:
            src_m = re.search(r"(?:src|file)\s*:\s*'([^']+)'", content)
        # 提取 subtitle 字段 — 支持转义引号
        sub_m = re.search(r'subtitle\s*:\s*"((?:[^"\\]|\\.)*)"', content)
        if not sub_m:
            sub_m = re.search(r"subtitle\s*:\s*'((?:[^'\\]|\\.)*)'", content)
        if src_m:
            item['src'] = src_m.group(1)
        if sub_m:
            subtitle = sub_m.group(1).replace("\\'", "'").replace('\\"', '"')
            item['subtitle'] = subtitle
        if item.get('src'):
            items.append(item)
    return items


async def generate_one(text, output_path, voice=VOICE, rate=RATE):
    """用 edge-tts 生成一个 mp3"""
    import edge_tts
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(str(output_path))


async def process_course(course_dir):
    """处理单个课件"""
    html_path = course_dir / 'index.html'
    if not html_path.exists():
        print(f"  ⚠ {course_dir.name}: 无 index.html，跳过")
        return 0

    html_text = html_path.read_text(encoding='utf-8', errors='ignore')
    playlist = extract_playlist(html_text)
    if not playlist:
        print(f"  ⚠ {course_dir.name}: 未找到 audioPlaylist，跳过")
        return 0

    tts_dir = course_dir / 'tts'
    tts_dir.mkdir(exist_ok=True)

    generated = 0
    for item in playlist:
        src_path = item.get('src', '')
        subtitle = item.get('subtitle', '')
        if not src_path or not subtitle:
            continue

        # src_path 形如 "./tts/seg01_intro.mp3" 或 "tts/seg01_intro.mp3"
        filename = Path(src_path).name
        output = tts_dir / filename

        if output.exists():
            print(f"  ⏭ {course_dir.name}/tts/{filename} 已存在，跳过")
            continue

        # 清理 subtitle 中的 HTML 标签和特殊符号
        clean_text = re.sub(r'<[^>]+>', '', subtitle)
        clean_text = clean_text.replace('\\n', '。').replace('\\t', '')
        clean_text = clean_text.strip()
        if not clean_text:
            continue

        print(f"  🔊 生成 {course_dir.name}/tts/{filename} ({len(clean_text)} 字)")
        try:
            await generate_one(clean_text, output)
            generated += 1
        except Exception as e:
            print(f"  ❌ 生成失败 {filename}: {e}")

    return generated


async def main():
    dirs = []
    if len(sys.argv) > 1:
        for arg in sys.argv[1:]:
            p = Path(arg)
            if p.is_dir():
                dirs.append(p)
            else:
                # 可能是 glob 模式
                import glob
                for g in glob.glob(arg):
                    gp = Path(g)
                    if gp.is_dir():
                        dirs.append(gp)
    else:
        # 默认扫描 community/bio-h-*
        community = Path('community')
        if community.exists():
            dirs = sorted(d for d in community.iterdir() if d.name.startswith('bio-h-') and d.is_dir())

    if not dirs:
        print("无课件目录可处理")
        return

    total = 0
    for d in sorted(dirs):
        print(f"\n📁 处理 {d.name}")
        n = await process_course(d)
        total += n

    print(f"\n✅ 完成！共生成 {total} 个 mp3 文件")


if __name__ == '__main__':
    asyncio.run(main())
