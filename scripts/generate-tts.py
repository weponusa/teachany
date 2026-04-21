#!/usr/bin/env python3
"""
TeachAny TTS Generator
为所有小学课件生成 Edge TTS 音频并注入播放按钮
"""
import os, re, subprocess, json, sys

EXAMPLES_DIR = 'examples'

# 中英文声音配置
VOICES = {
    'english': 'en-US-AriaNeural',
    'chinese': 'zh-CN-XiaoxiaoNeural',
    'math': 'zh-CN-XiaoxiaoNeural',
    'biology': 'zh-CN-XiaoxiaoNeural',
    'default': 'zh-CN-XiaoxiaoNeural',
}

# 英语课件的朗读文本模板
ENG_TTS_TEMPLATES = {
    'alphabet': "Welcome! Today we learn the English alphabet. There are 26 letters from A to Z. Let's practice together!",
    'phonics': "Welcome! Today we learn English phonics. We'll discover how letters make sounds. Let's start!",
    'greetings': "Hello! Today we practice English greetings. How are you? I'm fine, thank you! Let's learn more!",
    'numbers': "Welcome! Today we learn numbers and colors in English. One, two, three. Red, blue, green. Let's go!",
    'vocab': "Welcome! Today we expand our English vocabulary. New words help us communicate better. Let's learn!",
    'grammar': "Welcome! Today we study English grammar. Grammar helps us form correct sentences. Let's practice!",
    'reading': "Welcome! Today we practice English reading skills. Good readers understand main ideas. Let's begin!",
    'writing': "Welcome! Today we practice English writing. Good writing is clear and organized. Let's get started!",
    'tenses': "Welcome! Today we learn English tenses. Tenses tell us when something happens. Let's study together!",
    'phonics-blends': "Welcome! Today we learn consonant blends in English. Blends like 'bl', 'cr', 'st' make special sounds. Listen carefully!",
    'present': "Welcome! Today we learn the present tense in English. We use it to talk about now and habits. Let's practice!",
    'past': "Welcome! Today we learn the past tense. We use it to talk about finished actions. Let's explore together!",
    'future': "Welcome! Today we learn the future tense. We use 'will' to talk about plans and predictions. Let's learn!",
    'default': "Welcome to today's English lesson! Let's learn and practice together. Are you ready?",
}

# 中文课件的朗读文本模板
CHN_TTS_TEMPLATES = {
    'simple-vowels': "同学们好！今天我们学习单韵母。单韵母是拼音的基础，有a、o、e、i、u、ü六个。让我们一起学习吧！",
    'pinyin': "同学们好！今天我们学习拼音。拼音是汉字的注音工具，帮助我们准确发音。准备好了吗？",
    'tone-marks': "同学们好！今天我们学习声调。普通话有四个声调，分别是阴平、阳平、上声、去声。让我们一起练习！",
    'initials': "同学们好！今天我们学习声母。声母是音节开头的辅音，共有21个。跟我一起学！",
    'char': "同学们好！今天我们学习汉字。汉字是世界上最古老的文字之一，让我们认识新字吧！",
    'poetry': "同学们好！今天我们欣赏古诗词。古诗语言优美，意境深远，让我们一起感受语言的魅力！",
    'writing': "同学们好！今天我们学习写作。好的文章需要清晰的思路和生动的语言，让我们一起学习！",
    'reading': "同学们好！今天我们练习阅读理解。读懂文章，抓住要点，是语文学习的重要能力！",
    'default': "同学们好！今天我们开始新的学习内容。认真听讲，积极思考，相信你一定能学会！",
}

MATH_TTS_TEMPLATES = {
    'fractions': "同学们好！今天我们学习分数。分数表示把一个整体平均分成几份，取其中的几份。准备好了吗？",
    'decimals': "同学们好！今天我们学习小数。小数是分数的另一种表达方式，用小数点来分隔整数和小数部分。",
    'area': "同学们好！今天我们学习面积。面积是平面图形所占的大小，用平方单位来度量。让我们一起探索！",
    'volume': "同学们好！今天我们学习体积。体积是立体图形所占的空间大小，用立方单位来度量。",
    'multiplication': "同学们好！今天我们学习乘法。乘法是加法的简便运算，能帮助我们快速计算。准备好了吗？",
    'division': "同学们好！今天我们学习除法。除法是乘法的逆运算，帮助我们解决平均分配的问题。",
    'equation': "同学们好！今天我们学习方程。方程用字母表示未知数，通过等量关系求解。让我们一起学习！",
    'percentage': "同学们好！今天我们学习百分数。百分数是把整体看作一百份来表示比率。非常实用！",
    'default': "同学们好！今天我们开始新的数学课。认真思考，动手练习，数学其实很有趣！",
}

def get_tts_text(fid, subject, html):
    """根据课件ID和学科生成TTS文本"""
    if subject == 'english':
        for key, text in ENG_TTS_TEMPLATES.items():
            if key != 'default' and key in fid:
                return text, VOICES['english']
        return ENG_TTS_TEMPLATES['default'], VOICES['english']
    
    if subject == 'chinese':
        # 从课件内容提取标题
        title_m = re.search(r'<title>(.*?)</title>', html)
        title = re.sub(r'[|·\s]+.*$', '', title_m.group(1) if title_m else '').strip()
        for key, text in CHN_TTS_TEMPLATES.items():
            if key != 'default' and key in fid:
                return text, VOICES['chinese']
        if title:
            return f"同学们好！今天我们学习{title}。认真听讲，积极思考，相信你一定能掌握这个知识点！", VOICES['chinese']
        return CHN_TTS_TEMPLATES['default'], VOICES['chinese']
    
    if subject == 'math':
        for key, text in MATH_TTS_TEMPLATES.items():
            if key != 'default' and key in fid:
                return text, VOICES['math']
        title_m = re.search(r'<title>(.*?)</title>', html)
        title = re.sub(r'[|·\s]+.*$', '', title_m.group(1) if title_m else '').strip()
        if title:
            return f"同学们好！今天我们学习{title}。这是数学中的重要知识点，让我们认真学习，学以致用！", VOICES['math']
        return MATH_TTS_TEMPLATES['default'], VOICES['math']
    
    # science/default
    title_m = re.search(r'<title>(.*?)</title>', html)
    title = re.sub(r'[|·\s]+.*$', '', title_m.group(1) if title_m else '').strip()
    return f"同学们好！今天我们学习{title or '新的知识'}。认真学习，积极探索！", VOICES['default']


def generate_audio(text, voice, output_path):
    """调用 edge-tts 生成音频"""
    cmd = ['edge-tts', '--voice', voice, '--text', text, '--write-media', output_path]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    return result.returncode == 0


def inject_audio_player(html, audio_filename, is_english):
    """在课件开头注入音频播放器"""
    if 'teachany-audio-intro' in html:
        return html, False
    
    if is_english:
        player_html = f'''
<!-- TTS 音频 #TeachAny Edge-TTS -->
<div class="teachany-audio-intro" style="position:fixed;bottom:20px;right:20px;z-index:9999;">
  <button onclick="document.getElementById('ta-audio').play()" 
    style="background:linear-gradient(135deg,#4c6ef5,#7c3aed);color:#fff;border:none;
    width:52px;height:52px;border-radius:50%;font-size:22px;cursor:pointer;
    box-shadow:0 4px 16px rgba(76,110,245,0.4);display:flex;align-items:center;justify-content:center;"
    title="Listen to introduction">🔊</button>
  <audio id="ta-audio" src="audio/intro.mp3" preload="auto"></audio>
</div>
'''
    else:
        player_html = f'''
<!-- TTS 音频 #TeachAny Edge-TTS -->
<div class="teachany-audio-intro" style="position:fixed;bottom:20px;right:20px;z-index:9999;">
  <button onclick="document.getElementById('ta-audio').play()" 
    style="background:linear-gradient(135deg,#ff6b6b,#ee5a24);color:#fff;border:none;
    width:52px;height:52px;border-radius:50%;font-size:22px;cursor:pointer;
    box-shadow:0 4px 16px rgba(255,107,107,0.4);display:flex;align-items:center;justify-content:center;"
    title="播放课程介绍">🔊</button>
  <audio id="ta-audio" src="audio/intro.mp3" preload="auto"></audio>
</div>
'''
    html = html.replace('</body>', player_html + '\n</body>')
    return html, True


def process_courseware(fid, args):
    """处理单个课件"""
    dir_path = os.path.join(EXAMPLES_DIR, fid)
    index_path = os.path.join(dir_path, 'index.html')
    audio_dir = os.path.join(dir_path, 'audio')
    audio_path = os.path.join(audio_dir, 'intro.mp3')
    
    if not os.path.exists(index_path):
        return 'skip', 'no index.html'
    
    html = open(index_path, encoding='utf-8').read()
    
    # 获取学科
    subj_m = re.search(r'teachany-subject.*?content="([^"]+)"', html)
    subject = subj_m.group(1) if subj_m else (
        'english' if fid.startswith('eng-') else
        'chinese' if fid.startswith('chn-') else
        'math' if fid.startswith('math-') else 'biology'
    )
    
    is_english = subject == 'english'
    
    # 检查是否已经有音频
    skip_audio = os.path.exists(audio_path)
    
    if not skip_audio:
        tts_text, voice = get_tts_text(fid, subject, html)
        os.makedirs(audio_dir, exist_ok=True)
        ok = generate_audio(tts_text, voice, audio_path)
        if not ok:
            return 'fail', 'TTS generation failed'
    
    # 注入播放按钮
    new_html, injected = inject_audio_player(html, 'audio/intro.mp3', is_english)
    if injected:
        open(index_path, 'w', encoding='utf-8').write(new_html)
    
    status = 'created' if not skip_audio else 'existing'
    return 'ok', f'{status} | button {"injected" if injected else "existed"}'


def main():
    targets = sys.argv[1:] if len(sys.argv) > 1 else None
    
    if targets:
        ids = targets
    else:
        ids = sorted([
            d for d in os.listdir(EXAMPLES_DIR)
            if re.match(r'^(math-e-|math-elem-|chn-e-|eng-e-|science-)', d)
        ])
    
    print(f"\n🎙️ TeachAny TTS Generator — {len(ids)} 个课件\n{'═'*50}")
    
    ok = fail = skip = 0
    for fid in ids:
        status, detail = process_courseware(fid, None)
        icon = '✅' if status == 'ok' else '⏭️' if status == 'skip' else '❌'
        print(f"{icon} {fid} — {detail}")
        if status == 'ok': ok += 1
        elif status == 'fail': fail += 1
        else: skip += 1
    
    print(f"\n{'═'*50}")
    print(f"✅ 成功: {ok}  ❌ 失败: {fail}  ⏭️ 跳过: {skip}\n")


if __name__ == '__main__':
    main()
