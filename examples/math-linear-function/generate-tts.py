#!/usr/bin/env python3
"""为一次函数课件生成TTS语音讲解"""
import asyncio
import edge_tts
import os

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tts")
os.makedirs(OUTPUT_DIR, exist_ok=True)

VOICE = "zh-CN-XiaoxiaoNeural"

SEGMENTS = [
    {
        "id": "seg01",
        "sectionId": "module-1",
        "title": "模块1：什么是一次函数",
        "text": "你已经会用y等于kx描述正比例关系了。但是，乘坐出租车时，费用不只是里程乘以单价，还有一笔起步价！手机话费也不只是通话分钟乘以单价，还有月租费！这些费用用y等于kx描述不了。所以我们需要一种新的函数，既能表示按量计费的部分，又能加上固定费用，这就是一次函数y等于kx加b。其中k是斜率，决定直线的坡度和方向，b是截距，是直线与y轴交点的纵坐标。注意，k不等于0是关键条件。记忆口诀：k是坡度，b是起点。就像爬山，k决定坡有多陡，b决定从哪个高度出发。正比例函数是不收起步价，一次函数是收起步价。"
    },
    {
        "id": "seg02",
        "sectionId": "module-2",
        "title": "模块2：一次函数的图像怎么画",
        "text": "正比例函数y等于kx的图像是过原点的直线，只要再找一个点就能画出。但一次函数y等于kx加b不过原点了，怎么画呢？用两点法：分别令x等于0和y等于0，找到直线与两个坐标轴的交点，连起来就是。第一步，令x等于0，得y等于b，画出点(0, b)，这是与y轴的交点。第二步，令y等于0，得x等于负b除以k，画出点(负b除以k, 0)，这是与x轴的交点。第三步，过这两个点画一条直线。拖动画板上的滑块，观察k和b变化时直线如何改变。"
    },
    {
        "id": "seg03",
        "sectionId": "module-3",
        "title": "模块3：k和b的秘密",
        "text": "光会画图还不够，你能从图像读出k和b是正还是负吗？先看k。k大于0时，直线从左到右上升，就像上坡。k小于0时，直线从左到右下降，就像下坡。k的绝对值越大，直线越陡。记忆口诀：手指从左往右划，k大于0手指往上抬，k小于0手指往下落。再看b。b大于0时，直线与y轴交于正半轴，在原点上方。b小于0时，交于负半轴，在原点下方。b等于0时，直线过原点，就是正比例函数。注意常见错误：b是纵截距，不是与x轴的交点！令x等于0得y等于b，所以交点是(0, b)。"
    },
    {
        "id": "seg04",
        "sectionId": "module-4",
        "title": "模块4：用待定系数法求解析式",
        "text": "如果只告诉你直线经过哪两个点，你能反推出y等于kx加b的具体表达式吗？用待定系数法。分四步：第一步设，设y等于kx加b。第二步代，把两个已知点的坐标分别代入，得到两个方程。第三步解，解这个二元一次方程组，求出k和b。第四步写，写出函数解析式。举个例子，已知直线过点(1,5)和(3,9)。设y等于kx加b，代入得k加b等于5，3k加b等于9。两个方程相减得2k等于4，k等于2。代入第一个方程得b等于3。所以y等于2x加3。注意常见错误：两个方程相减时符号搞错。建议用上减下统一方法，仔细处理符号。"
    }
]

async def generate():
    for seg in SEGMENTS:
        out_path = os.path.join(OUTPUT_DIR, f"{seg['id']}_zh.mp3")
        communicate = edge_tts.Communicate(seg["text"], VOICE)
        await communicate.save(out_path)
        print(f"✅ {out_path}")
    print(f"\n🎤 所有旁白生成完毕！")

if __name__ == "__main__":
    asyncio.run(generate())
