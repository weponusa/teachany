#!/bin/bash
set -e
OUTDIR="/root/.openclaw/workspace/teachany-courseware/community/sci-e-conductors-insulators/assets/audio"
TTS="python3 /root/.openclaw/workspace/skills/teachany/scripts/tts_engine.py"
VOICE="zh-CN-XiaoxiaoNeural"

$TTS --text "为什么电线外面要包一层橡胶皮？为什么在电线上工作的工人要戴橡胶手套？这和导体与绝缘体有关！今天我们来认识这两类重要的材料，关系到用电安全！" --voice $VOICE --output "$OUTDIR/seg01_intro.mp3"
echo "seg01 done"

$TTS --text "导体是容易让电流通过的材料。大多数金属都是导体，比如铜、铁、铝——电线里的金属丝就负责传导电流。人体也是导体，所以要小心触电！水也能导电，千万不要用湿手触摸电器！" --voice $VOICE --output "$OUTDIR/seg02_conductor.mp3"
echo "seg02 done"

$TTS --text "绝缘体是不容易让电流通过的材料。橡胶、塑料、玻璃、木头（干燥的）、陶瓷都是绝缘体。电线外面的橡胶皮，就是为了保护我们不被电到。电工手套也是用橡胶做的！" --voice $VOICE --output "$OUTDIR/seg03_insulator.mp3"
echo "seg03 done"

$TTS --text "导体和绝缘体在生活中配合使用。插头里面是铜片（导体）连接电线，外面是塑料壳（绝缘体）保护安全；电灯泡里面是钨丝（导体）发光，玻璃外壳（绝缘体）保护灯丝。" --voice $VOICE --output "$OUTDIR/seg04_use.mp3"
echo "seg04 done"

$TTS --text "还有一种特殊材料叫半导体，导电能力介于导体和绝缘体之间。硅和锗是常见的半导体材料。你手机里的芯片就是用半导体硅做的！半导体是现代电子技术的基础。" --voice $VOICE --output "$OUTDIR/seg05_semiconductor.mp3"
echo "seg05 done"

$TTS --text "导体（金属、人体、水）容易导电；绝缘体（橡胶、塑料、干木头）不容易导电。它们配合使用保证安全用电。记住：湿木头会导电！远离水边的电器！" --voice $VOICE --output "$OUTDIR/seg06_summary.mp3"
echo "seg06 done"

echo "ALL TTS DONE"
