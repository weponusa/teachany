#!/usr/bin/env python3
"""
批量 TTS 生成脚本
从课件 HTML 中提取 playlist / audioPlaylist / SEGMENT_TEXTS / teachanyTts 数据，
使用 edge-tts 生成高质量 mp3 文件。
"""

import asyncio
import json
import os
import re
import sys
import glob

# edge-tts
try:
    import edge_tts
except ImportError:
    print("请先安装 edge-tts: pip3 install edge-tts")
    sys.exit(1)

VOICE = "zh-CN-XiaoxiaoNeural"  # 高质量中文女声
EXAMPLES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "examples")


def extract_playlist(html: str) -> list[dict] | None:
    """提取 const playlist=[...] 格式"""
    m = re.search(r'const\s+playlist\s*=\s*\[', html)
    if not m:
        return None
    start = m.start()
    # 找到匹配的 ];
    bracket_count = 0
    arr_start = html.index('[', start)
    i = arr_start
    while i < len(html):
        if html[i] == '[':
            bracket_count += 1
        elif html[i] == ']':
            bracket_count -= 1
            if bracket_count == 0:
                break
        i += 1
    raw = html[arr_start:i + 1]
    return parse_js_array(raw)


def extract_audio_playlist(html: str) -> list[dict] | None:
    """提取 const audioPlaylist=[...] 格式"""
    m = re.search(r'const\s+audioPlaylist\s*=\s*\[', html)
    if not m:
        return None
    start = m.start()
    bracket_count = 0
    arr_start = html.index('[', start)
    i = arr_start
    while i < len(html):
        if html[i] == '[':
            bracket_count += 1
        elif html[i] == ']':
            bracket_count -= 1
            if bracket_count == 0:
                break
        i += 1
    raw = html[arr_start:i + 1]
    return parse_js_array(raw)


def extract_segment_texts(html: str) -> list[dict] | None:
    """提取 SEGMENTS + SEGMENT_TEXTS 格式（SEGMENT_TEXTS 可以是对象或数组）"""
    # 提取 SEGMENTS 数组获取 id 列表
    m_seg = re.search(r'const\s+SEGMENTS\s*=\s*\[', html)
    if not m_seg:
        return None
    
    # 提取 SEGMENT_TEXTS（可能是 { }、[ ] 或 SEGMENTS.map(...)）
    m_texts = re.search(r'const\s+SEGMENT_TEXTS\s*=\s*([{\[])', html)
    m_texts_map = re.search(r'const\s+SEGMENT_TEXTS\s*=\s*SEGMENTS\.map', html)
    
    # 如果 SEGMENT_TEXTS 是从 SEGMENTS.map 派生的，说明 text 在 SEGMENTS 里
    if m_texts_map and not m_texts:
        # 解析 SEGMENTS，直接从中提取 text
        seg_start = html.index('[', m_seg.start())
        bracket = 0
        i = seg_start
        while i < len(html):
            if html[i] == '[':
                bracket += 1
            elif html[i] == ']':
                bracket -= 1
                if bracket == 0:
                    break
            i += 1
        seg_raw = html[seg_start:i + 1]
        segments = parse_js_array(seg_raw)
        if not segments:
            return None
        result = []
        for seg in segments:
            seg_id = seg.get('id', '')
            text = seg.get('text', '')
            if seg_id and text:
                result.append({
                    'id': seg_id,
                    'title': seg.get('label', ''),
                    'text': text
                })
        return result if result else None
    
    if not m_texts:
        return None
    
    # 解析 SEGMENTS 获取 id 和 label
    seg_start = html.index('[', m_seg.start())
    bracket = 0
    i = seg_start
    while i < len(html):
        if html[i] == '[':
            bracket += 1
        elif html[i] == ']':
            bracket -= 1
            if bracket == 0:
                break
        i += 1
    seg_raw = html[seg_start:i + 1]
    segments = parse_js_array(seg_raw)
    
    # 解析 SEGMENT_TEXTS
    opener = m_texts.group(1)
    closer = '}' if opener == '{' else ']'
    txt_start = m_texts.end() - 1  # 指向 opener
    bracket = 0
    i = txt_start
    while i < len(html):
        if html[i] == opener:
            bracket += 1
        elif html[i] == closer:
            bracket -= 1
            if bracket == 0:
                break
        i += 1
    txt_raw = html[txt_start:i + 1]
    
    if not segments:
        return None
    
    result = []
    
    if opener == '{':
        # SEGMENT_TEXTS 是对象 {s01: '...', s02: '...'}
        texts = parse_js_object(txt_raw)
        if not texts:
            return None
        for seg in segments:
            seg_id = seg.get('id', '')
            text = texts.get(seg_id, '')
            if seg_id and text:
                result.append({
                    'id': seg_id,
                    'title': seg.get('label', ''),
                    'text': text
                })
    else:
        # SEGMENT_TEXTS 是数组 ['文本1', '文本2', ...]
        texts_list = parse_js_string_array(txt_raw)
        if not texts_list:
            return None
        for idx, seg in enumerate(segments):
            seg_id = seg.get('id', '')
            text = texts_list[idx] if idx < len(texts_list) else ''
            if seg_id and text:
                result.append({
                    'id': seg_id,
                    'title': seg.get('label', ''),
                    'text': text
                })
    
    return result


def extract_teachany_tts(html: str) -> list[dict] | None:
    """提取 teachany 格式 [{id:'xxx', mp3:'ch0-intro.mp3', zh:'文本'}]"""
    # 查找包含 mp3: 和 zh: 的数组（变量名可能是 ttsNarration 或其他）
    m = re.search(r'(?:const\s+ttsNarration\s*=\s*|ttsPlaylist\s*=\s*)\[', html)
    if not m:
        # 尝试更通用的匹配
        pattern = r'(?:const\s+\w+\s*=\s*)\[\s*\{[^}]*mp3\s*:'
        m = re.search(pattern, html)
        if not m:
            return None
    
    start = html.rfind('[', 0, m.end())
    bracket = 0
    i = start
    while i < len(html):
        if html[i] == '[':
            bracket += 1
        elif html[i] == ']':
            bracket -= 1
            if bracket == 0:
                break
        i += 1
    raw = html[start:i + 1]
    items = parse_js_array(raw)
    if not items:
        return None
    
    result = []
    for item in items:
        if not isinstance(item, dict):
            continue
        mp3 = item.get('mp3', '')
        zh = item.get('zh', '')
        if mp3 and zh:
            result.append({
                'id': item.get('id', ''),
                'mp3': mp3,
                'text': zh
            })
    return result if result else None


def parse_js_array(raw: str) -> list[dict]:
    """将 JS 数组字面量转为 Python list[dict]"""
    # 替换单引号为双引号
    s = raw.strip()
    # 移除注释
    s = re.sub(r'//[^\n]*', '', s)
    # 将 key: 转为 "key":
    s = re.sub(r"(\w+)\s*:", r'"\1":', s)
    # 单引号换双引号
    s = s.replace("'", '"')
    # 移除末尾逗号
    s = re.sub(r',\s*([}\]])', r'\1', s)
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        # 尝试逐项提取
        items = []
        for m in re.finditer(r'\{([^}]+)\}', raw):
            obj = {}
            block = m.group(1)
            for kv in re.finditer(r"(\w+)\s*:\s*'([^']*)'", block):
                obj[kv.group(1)] = kv.group(2)
            for kv in re.finditer(r'(\w+)\s*:\s*"([^"]*)"', block):
                obj[kv.group(1)] = kv.group(2)
            if obj:
                items.append(obj)
        return items


def parse_js_object(raw: str) -> dict:
    """将 JS 对象字面量转为 Python dict"""
    s = raw.strip()
    s = re.sub(r'//[^\n]*', '', s)
    s = re.sub(r"(\w+)\s*:", r'"\1":', s)
    s = s.replace("'", '"')
    s = re.sub(r',\s*([}\]])', r'\1', s)
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        obj = {}
        for m in re.finditer(r"(\w+)\s*:\s*'([^']*)'", raw):
            obj[m.group(1)] = m.group(2)
        for m in re.finditer(r'(\w+)\s*:\s*"([^"]*)"', raw):
            obj[m.group(1)] = m.group(2)
        return obj


def parse_js_string_array(raw: str) -> list[str]:
    """将 JS 字符串数组 ['a','b','c'] 解析为 Python list[str]"""
    s = raw.strip()
    s = re.sub(r'//[^\n]*', '', s)
    s = s.replace("'", '"')
    s = re.sub(r',\s*\]', ']', s)
    try:
        result = json.loads(s)
        if isinstance(result, list):
            return [str(x) for x in result]
    except json.JSONDecodeError:
        pass
    # fallback: 逐个提取引号内的字符串
    items = []
    for m in re.finditer(r"'([^']*)'", raw):
        items.append(m.group(1))
    if not items:
        for m in re.finditer(r'"([^"]*)"', raw):
            items.append(m.group(1))
    return items


async def generate_mp3(text: str, output_path: str):
    """使用 edge-tts 生成 mp3"""
    communicate = edge_tts.Communicate(text, VOICE)
    await communicate.save(output_path)


async def process_courseware(course_dir: str) -> dict:
    """处理单个课件"""
    html_path = os.path.join(course_dir, "index.html")
    if not os.path.exists(html_path):
        return {"name": os.path.basename(course_dir), "status": "no index.html"}
    
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    name = os.path.basename(course_dir)
    
    # 检查是否已有 mp3
    tts_dir = os.path.join(course_dir, "tts")
    existing_mp3 = glob.glob(os.path.join(course_dir, "**/*.mp3"), recursive=True)
    if existing_mp3:
        return {"name": name, "status": "already has mp3", "count": len(existing_mp3)}
    
    # 尝试各种格式提取
    items = None
    fmt = None
    is_teachany = False
    
    # 格式 1: audioPlaylist
    items = extract_audio_playlist(html)
    if items:
        fmt = "audioPlaylist"
    
    # 格式 2: playlist
    if not items:
        items = extract_playlist(html)
        if items:
            fmt = "playlist"
    
    # 格式 3: SEGMENT_TEXTS
    if not items:
        items = extract_segment_texts(html)
        if items:
            fmt = "SEGMENT_TEXTS"
    
    # 格式 4: teachany tts
    if not items:
        items = extract_teachany_tts(html)
        if items:
            fmt = "teachanyTts"
            is_teachany = True
    
    if not items:
        return {"name": name, "status": "no playlist data found"}
    
    # 生成 mp3
    generated = 0
    errors = []
    
    if is_teachany:
        # teachany 格式 mp3 直接放课件根目录
        for item in items:
            mp3_name = item.get('mp3', '')
            text = item.get('text', '')
            if not mp3_name or not text:
                continue
            output_path = os.path.join(course_dir, mp3_name)
            if os.path.exists(output_path):
                continue
            try:
                await generate_mp3(text, output_path)
                generated += 1
                print(f"  ✅ {name}/{mp3_name}")
            except Exception as e:
                errors.append(f"{mp3_name}: {e}")
                print(f"  ❌ {name}/{mp3_name}: {e}")
    else:
        # 标准格式 mp3 放 tts/ 目录
        os.makedirs(tts_dir, exist_ok=True)
        for item in items:
            seg_id = item.get('id', '')
            text = item.get('text', '')
            if not seg_id or not text:
                continue
            output_path = os.path.join(tts_dir, f"{seg_id}.mp3")
            if os.path.exists(output_path):
                continue
            try:
                await generate_mp3(text, output_path)
                generated += 1
                print(f"  ✅ {name}/tts/{seg_id}.mp3")
            except Exception as e:
                errors.append(f"{seg_id}: {e}")
                print(f"  ❌ {name}/tts/{seg_id}.mp3: {e}")
    
    return {
        "name": name,
        "status": "ok",
        "format": fmt,
        "total_items": len(items),
        "generated": generated,
        "errors": errors
    }


async def main():
    examples_dir = os.path.abspath(EXAMPLES_DIR)
    print(f"扫描目录: {examples_dir}")
    
    # 收集所有需要处理的课件
    coursewares = sorted([
        os.path.join(examples_dir, d)
        for d in os.listdir(examples_dir)
        if os.path.isdir(os.path.join(examples_dir, d))
        and d != "_template"
        and os.path.exists(os.path.join(examples_dir, d, "index.html"))
    ])
    
    print(f"共找到 {len(coursewares)} 个课件\n")
    
    results = []
    for cw in coursewares:
        name = os.path.basename(cw)
        print(f"处理: {name}")
        result = await process_courseware(cw)
        results.append(result)
    
    # 汇总
    print("\n" + "=" * 60)
    print("生成汇总:")
    ok = [r for r in results if r["status"] == "ok"]
    skip = [r for r in results if r["status"] == "already has mp3"]
    no_data = [r for r in results if r["status"] == "no playlist data found"]
    
    print(f"  ✅ 成功生成: {len(ok)} 个课件")
    total_mp3 = sum(r.get("generated", 0) for r in ok)
    print(f"     共生成 {total_mp3} 个 mp3 文件")
    print(f"  ⏭️  已有音频: {len(skip)} 个课件")
    print(f"  ⚠️  无音频数据: {len(no_data)} 个课件")
    
    if no_data:
        print("\n无音频数据的课件:")
        for r in no_data:
            print(f"  - {r['name']}")
    
    if ok:
        print("\n成功生成的课件:")
        for r in ok:
            err_str = f" ({len(r['errors'])} errors)" if r.get('errors') else ""
            print(f"  - {r['name']} [{r.get('format', '?')}]: {r['generated']} files{err_str}")


if __name__ == "__main__":
    asyncio.run(main())
