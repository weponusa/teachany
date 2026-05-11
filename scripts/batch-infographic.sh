#!/bin/bash
# 批量通过 NotebookLM 生成中文知识结构信息图
# 用法: bash batch-infographic.sh

EXAMPLES="/Users/wepon/CodeBuddy/一次函数/teachany-opensource/examples"

# 课件列表: 目录|标题|hero文件名|prompt描述
COURSES=(
  "math-quadratic-function|二次函数|quadratic-hero.png|请生成二次函数 y=ax²+bx+c 的完整知识结构信息图，包含：一般式与顶点式互化、开口方向(a的正负)、对称轴x=-b/2a、顶点坐标、与坐标轴交点、判别式Δ、图像画法、实际应用。用信息图形式展示。"
  "bio-photosynthesis|光合作用|photosynthesis-hero.png|请生成光合作用的完整知识结构信息图，包含：总反应式6CO₂+6H₂O→C₆H₁₂O₆+6O₂、光反应阶段(场所类囊体薄膜/条件光照/产物ATP和NADPH)、暗反应阶段(CO₂固定/C₃还原)、影响因素(光照强度/CO₂浓度/温度)、意义(能量转化/物质循环)。"
  "chem-periodic-table|元素周期表|periodic-hero.png|请生成元素周期表的完整知识结构信息图，包含：周期(7个周期/电子层数递增)、族(主族副族)、元素性质递变规律(同周期从左到右/同族从上到下)、核外电子排布、常见元素性质。"
  "chem-oxidation-reduction|氧化还原反应|redox-hero.png|请生成氧化还原反应的完整知识结构信息图，包含：本质(电子转移)、氧化反应(失电子/化合价升高)、还原反应(得电子/化合价降低)、氧化剂与还原剂判断、常见反应实例、口诀(升失氧降得还)。"
  "geo-monsoon|全球季风系统|monsoon-hero.png|请生成季风气候的完整知识结构信息图，包含：成因(海陆热力性质差异)、夏季风(从海洋吹向陆地/带来降水)、冬季风(从陆地吹向海洋/寒冷干燥)、我国三大气候区、雨热同期对农业影响。"
  "imperial-unification|秦汉统一|qinhan-hero.png|请生成秦汉大一统的完整知识结构信息图，包含：秦朝(统一六国/中央集权/郡县制/统一文字度量衡/修长城)、秦亡原因(暴政/农民起义)、西汉(休养生息/文景之治)、汉武帝大一统(推恩令/罢黜百家/张骞出使西域/丝绸之路)。"
  "history-sanguo-sui-tang|三国至隋唐|sanguo-sui-tang-hero.png|请生成三国两晋南北朝至隋唐的完整知识结构信息图，包含：三国鼎立(魏蜀吴/赤壁之战/三国归晋)、两晋南北朝(北方民族融合/江南开发)、隋朝(统一/大运河/科举制/二世而亡)、唐朝(贞观之治/开元盛世/安史之乱)。"
  "history-industrial-revolution|工业革命|industrial-revolution-hero.png|请生成工业革命的完整知识结构信息图，包含：时间(18世纪60年代至19世纪中期)、始于英国的五大因素、关键发明(珍妮纺纱机/蒸汽机/火车)、双重影响(经济发展vs社会问题/城市化vs环境污染)。"
  "teachany-phy-mid-pressure|压强|pressure-hero.png|请生成压强的完整知识结构信息图，包含：定义(单位面积上的压力)、公式p=F/S、单位帕斯卡Pa、增大减小压强的方法、液体压强p=ρgh、大气压强(托里拆利实验)、连通器原理。"
  "sci-motion-speed|运动与速度|motion-speed-hero.png|请生成运动与速度的完整知识结构信息图，包含：机械运动概念、参照物与相对运动、速度定义与公式v=s÷t、速度单位(m/s和km/h)及换算(1m/s=3.6km/h)、匀速直线运动与变速运动。"
  "chn-compound-vowel|复韵母|compound-vowel-hero.png|请生成复韵母的完整知识结构信息图，适合一年级小朋友。包含：ai ei ui(前响复韵母)、ao ou iu(后响复韵母)、标调规则(有a标a有e标e/iu并列标在后)、组词示例。用活泼可爱风格。"
  "course-classical-poetry|古典诗词|hero-denglouque.png|请生成古典诗词教学的完整知识结构信息图，包含：诵读技法(节奏/停连/重音)、平仄格律(平仄规则/四声)、押韵与对仗、意象解读(常见意象及象征意义)、诗体辨析(绝句/律诗/词/曲)。"
)

SUCCESS=0
FAIL=0

for entry in "${COURSES[@]}"; do
  IFS='|' read -r dir title hero prompt <<< "$entry"
  echo ""
  echo "============================================================"
  echo "📚 [$((SUCCESS+FAIL+1))/${#COURSES[@]}] $title ($dir)"
  echo "============================================================"

  # 1. 创建 notebook
  echo "  1️⃣  创建 Notebook..."
  NB_ID=$(notebooklm create "TeachAny-$title" --json 2>&1 | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -z "$NB_ID" ]; then
    NB_ID=$(notebooklm create "TeachAny-$title" 2>&1 | grep -o '[0-9a-f-]\{36\}')
  fi
  if [ -z "$NB_ID" ]; then
    echo "  ❌ 创建 Notebook 失败"
    FAIL=$((FAIL+1))
    continue
  fi
  echo "     ✅ ID: $NB_ID"

  # 2. 设置活跃 notebook
  notebooklm use "$NB_ID" > /dev/null 2>&1

  # 3. 添加课件源文件
  echo "  2️⃣  添加课件源文件..."
  notebooklm source add "$EXAMPLES/$dir/index.html" --type text --title "$title互动课件" > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "  ❌ 添加 source 失败"
    FAIL=$((FAIL+1))
    continue
  fi
  echo "     ✅ 已添加"

  # 等待 source 处理
  sleep 8

  # 4. 生成信息图
  echo "  3️⃣  生成信息图..."
  notebooklm generate infographic "$prompt" --language zh --detail detailed --orientation landscape --wait 2>&1 | cat
  if [ $? -ne 0 ]; then
    echo "  ❌ 生成信息图失败"
    FAIL=$((FAIL+1))
    continue
  fi

  # 5. 下载信息图
  echo "  4️⃣  下载信息图..."
  TMPFILE="/tmp/notebooklm-infographic-$dir.png"
  notebooklm download infographic "$TMPFILE" 2>&1 | cat
  if [ ! -f "$TMPFILE" ]; then
    # 可能加了后缀
    ACTUAL=$(ls /tmp/notebooklm-infographic-$dir*.png 2>/dev/null | head -1)
    if [ -n "$ACTUAL" ]; then
      TMPFILE="$ACTUAL"
    else
      echo "  ❌ 下载失败"
      FAIL=$((FAIL+1))
      continue
    fi
  fi

  # 6. 替换 hero 图
  cp "$TMPFILE" "$EXAMPLES/$dir/assets/$hero"
  echo "     ✅ 已保存: assets/$hero ($(du -h "$EXAMPLES/$dir/assets/$hero" | cut -f1))"
  rm -f /tmp/notebooklm-infographic-$dir*.png

  SUCCESS=$((SUCCESS+1))
  echo "  ✅ 完成!"

  # 课件间间隔
  sleep 5
done

echo ""
echo "============================================================"
echo "📊 批量生成完成: $SUCCESS 成功 / $FAIL 失败 / ${#COURSES[@]} 总计"
echo "============================================================"
