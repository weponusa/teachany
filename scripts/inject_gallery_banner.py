#!/usr/bin/env python3
"""
批量给 community/ 下所有课件 index.html 顶部注入 Gallery 返回导航 banner。
已注入过的（包含 teachany-back-to-gallery 标记）将跳过。
"""
import os, re, pathlib

COMMUNITY_DIR = pathlib.Path(__file__).parent.parent / "community"
GALLERY_URL = "https://weponusa.github.io/teachany/"

BANNER_HTML = '''<!-- teachany-back-to-gallery -->
<style>body{padding-top:36px!important;}</style>
<div style="position:fixed;top:0;left:0;right:0;z-index:9999;background:rgba(15,23,42,0.92);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;gap:10px;padding:0 16px;height:36px;font-family:'PingFang SC','Microsoft YaHei',sans-serif;">
  <a href="https://weponusa.github.io/teachany/" target="_top" style="display:flex;align-items:center;gap:6px;color:rgba(255,255,255,0.75);font-size:12px;text-decoration:none;padding:4px 10px;border-radius:6px;transition:all 0.2s;white-space:nowrap;" onmouseover="this.style.background='rgba(255,255,255,0.12)';this.style.color='#fff'" onmouseout="this.style.background='transparent';this.style.color='rgba(255,255,255,0.75)'">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
    Gallery
  </a>
  <span style="color:rgba(255,255,255,0.2);font-size:14px;">|</span>
  <a href="https://weponusa.github.io/teachany/tree.html" target="_top" style="display:flex;align-items:center;gap:5px;color:rgba(255,255,255,0.55);font-size:12px;text-decoration:none;padding:4px 10px;border-radius:6px;transition:all 0.2s;white-space:nowrap;" onmouseover="this.style.background='rgba(255,255,255,0.08)';this.style.color='rgba(255,255,255,0.85)'" onmouseout="this.style.background='transparent';this.style.color='rgba(255,255,255,0.55)'">
    🗺️ 知识地图
  </a>
  <a href="https://weponusa.github.io/teachany/path.html" target="_top" style="display:flex;align-items:center;gap:5px;color:rgba(255,255,255,0.55);font-size:12px;text-decoration:none;padding:4px 10px;border-radius:6px;transition:all 0.2s;white-space:nowrap;" onmouseover="this.style.background='rgba(255,255,255,0.08)';this.style.color='rgba(255,255,255,0.85)'" onmouseout="this.style.background='transparent';this.style.color='rgba(255,255,255,0.55)'">
    🛤️ 学习路径
  </a>
  <div style="flex:1;"></div>
  <span style="color:rgba(255,255,255,0.3);font-size:11px;">TeachAny</span>
</div>
<!-- /teachany-back-to-gallery -->
'''

def inject(file_path: pathlib.Path) -> bool:
    text = file_path.read_text(encoding='utf-8', errors='ignore')
    if 'teachany-back-to-gallery' in text:
        return False  # 已注入，跳过
    # 找 <body> 标签，在其后插入 banner
    new_text, count = re.subn(r'(<body[^>]*>)', r'\1\n' + BANNER_HTML, text, count=1, flags=re.IGNORECASE)
    if count == 0:
        return False
    file_path.write_text(new_text, encoding='utf-8')
    return True

def main():
    files = list(COMMUNITY_DIR.rglob("index.html"))
    injected = 0
    skipped = 0
    for f in sorted(files):
        result = inject(f)
        if result:
            injected += 1
            print(f"  ✓ {f.parent.name}")
        else:
            skipped += 1
    print(f"\n完成：注入 {injected} 个，跳过（已有） {skipped} 个，共 {len(files)} 个课件。")

if __name__ == '__main__':
    main()
