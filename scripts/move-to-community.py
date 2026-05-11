#!/usr/bin/env python3
"""
将 examples/ 下的小学课件批量移动到 community/ 并注册到 community/index.json
"""
import os, re, json, shutil
from datetime import datetime

BASE = os.path.dirname(os.path.abspath(__file__)) + '/..'
EXAMPLES = os.path.join(BASE, 'examples')
COMMUNITY = os.path.join(BASE, 'community')
INDEX_PATH = os.path.join(COMMUNITY, 'index.json')

# 从 manifest.json 或 meta 标签推断课件信息
def get_info(fid):
    dir_path = os.path.join(EXAMPLES, fid)
    manifest_path = os.path.join(dir_path, 'manifest.json')
    html_path = os.path.join(dir_path, 'index.html')

    info = {'id': fid, 'author': 'weponusa'}

    # 优先从 manifest.json 读
    if os.path.exists(manifest_path):
        try:
            m = json.load(open(manifest_path, encoding='utf-8'))
            info['subject'] = m.get('subject', 'math')
            info['grade'] = m.get('grade', 3)
            info['node_id'] = m.get('node_id', fid)
        except: pass

    # 从 HTML 读 meta 标签
    if os.path.exists(html_path):
        html = open(html_path, encoding='utf-8').read()
        title_m = re.search(r'<title>(.*?)</title>', html)
        if title_m:
            title = re.sub(r'\s*[|·]\s*.*$', '', title_m.group(1)).strip()
            title = re.sub(r'📚|🌸|🧮|🔬|🌿|🎯', '', title).strip()
            info['name'] = title
        if 'subject' not in info:
            subj_m = re.search(r'teachany-subject.*?content="([^"]+)"', html)
            if subj_m: info['subject'] = subj_m.group(1)
        if 'grade' not in info:
            grade_m = re.search(r'teachany-grade.*?content="(\d+)"', html)
            if grade_m: info['grade'] = int(grade_m.group(1))
        if 'node_id' not in info:
            node_m = re.search(r'teachany-node.*?content="([^"]+)"', html)
            if node_m: info['node_id'] = node_m.group(1)

    # 默认值
    if 'subject' not in info:
        info['subject'] = ('english' if fid.startswith('eng-') else
                           'chinese' if fid.startswith('chn-') else
                           'biology' if fid.startswith('science-') else 'math')
    if 'grade' not in info:
        info['grade'] = 1 if fid.startswith(('chn-e-simple', 'chn-e-stroke', 'chn-e-pinyin')) else 3
    if 'node_id' not in info:
        info['node_id'] = re.sub(r'^(math-e-|math-elem-|chn-e-|eng-e-|science-)', '', fid)
    if 'name' not in info:
        info['name'] = fid.replace('-', ' ').title()

    # 生成 tags
    subj_label = {'math':'Math','chinese':'Chinese','english':'English','biology':'Biology'}.get(info['subject'],'General')
    grade_label = f"Grade {info['grade']}"
    info['tags'] = [subj_label, grade_label]

    return info


def main():
    # 读取现有 index.json
    index = json.load(open(INDEX_PATH, encoding='utf-8'))
    existing_ids = {c['id'] for c in index.get('courses', [])}

    # 获取所有小学课件 ID
    ids = sorted([d for d in os.listdir(EXAMPLES)
                  if re.match(r'^(math-e-|math-elem-|chn-e-|eng-e-|science-)', d)])

    print(f"\n📦 移动 {len(ids)} 个课件到 community/\n{'═'*50}")

    moved = 0
    skipped = 0
    new_entries = []

    for fid in ids:
        src = os.path.join(EXAMPLES, fid)
        dst = os.path.join(COMMUNITY, fid)

        # 跳过已存在于 community/ 的
        if os.path.exists(dst):
            print(f"⏭️  {fid} — 已在 community/")
            skipped += 1
            continue

        # 移动目录
        shutil.move(src, dst)
        print(f"✅ {fid} — 移动完成")
        moved += 1

        # 生成 index 条目（如果不在 index 中）
        if fid not in existing_ids:
            info = get_info(fid)  # 注意：此时文件已在 dst
            # 重新从 dst 读
            manifest_path = os.path.join(dst, 'manifest.json')
            html_path = os.path.join(dst, 'index.html')
            info2 = {'id': fid, 'author': 'weponusa'}
            if os.path.exists(manifest_path):
                try:
                    m = json.load(open(manifest_path, encoding='utf-8'))
                    info2.update({'subject': m.get('subject','math'), 'grade': m.get('grade',3), 'node_id': m.get('node_id', fid)})
                except: pass
            if os.path.exists(html_path):
                html = open(html_path, encoding='utf-8').read()
                title_m = re.search(r'<title>(.*?)</title>', html)
                if title_m:
                    t = re.sub(r'\s*[|·]\s*.*$', '', title_m.group(1)).strip()
                    t = re.sub(r'[📚🌸🧮🔬🌿🎯]', '', t).strip()
                    info2['name'] = t
                if 'subject' not in info2:
                    s = re.search(r'teachany-subject.*?content="([^"]+)"', html)
                    if s: info2['subject'] = s.group(1)
                if 'grade' not in info2:
                    g = re.search(r'teachany-grade.*?content="(\d+)"', html)
                    if g: info2['grade'] = int(g.group(1))
                if 'node_id' not in info2:
                    n = re.search(r'teachany-node.*?content="([^"]+)"', html)
                    if n: info2['node_id'] = n.group(1)

            info2.setdefault('subject', 'english' if fid.startswith('eng-') else 'chinese' if fid.startswith('chn-') else 'biology' if fid.startswith('science-') else 'math')
            info2.setdefault('grade', 3)
            info2.setdefault('node_id', re.sub(r'^(math-e-|math-elem-|chn-e-|eng-e-|science-)', '', fid))
            info2.setdefault('name', fid.replace('-', ' ').title())

            subj_label = {'math':'Math','chinese':'Chinese','english':'English','biology':'Biology'}.get(info2['subject'],'General')
            entry = {
                'id': fid,
                'node_id': info2['node_id'],
                'name': info2['name'],
                'subject': info2['subject'],
                'grade': info2['grade'],
                'author': 'weponusa',
                'approved_at': '2026-04-21T05:00:00Z',
                'likes': 0,
                'status': 'active',
                'tags': [subj_label, f"Grade {info2['grade']}", 'Elementary']
            }
            new_entries.append(entry)

    # 更新 index.json
    index['courses'].extend(new_entries)
    index['updated_at'] = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
    json.dump(index, open(INDEX_PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

    print(f"\n{'═'*50}")
    print(f"✅ 移动: {moved}  ⏭️  跳过: {skipped}")
    print(f"📋 community/index.json 新增 {len(new_entries)} 条记录")
    print(f"📊 社区课件总计: {len(index['courses'])} 个\n")


if __name__ == '__main__':
    main()
