#!/usr/bin/env node
/**
 * TeachAny 课件升级 Patch2 - 第3批
 * 补充：#04 诊断性反馈、#06 Bloom层级、#08 五镜头深层理解
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'examples');

// Deep understanding content for each course
const DEEP_CONTENT = {
  'math-elem-multi-digit-multiply': {
    title: '多位数乘法',
    bloom: '请分析：为什么竖式乘法中十位的乘积要错位？如果不错位会出现什么错误？请判断是否正确：23×12=23×2+23×2。',
    diagnosis: '如果你把十位的乘积写在了同一列，你把10和1搞混了——十位上的数字乘以的是10，不是1，所以结果要向左移一位（即乘以10）。',
    deep: '🔍 本质：竖式乘法是分配律的竖式表达。23×12=23×(10+2)=23×10+23×2=230+46=276。错位对齐就是体现"乘以10等于向左移一位"这个十进制规律。'
  },
  'math-elem-multiplication-table': {
    title: '九九乘法表',
    bloom: '解释：为什么乘法口诀只需要记到"九九八十一"，而不是"九十乘以九十"？判断：6×8和8×6结果一样吗？为什么？',
    diagnosis: '如果你把6×7记成35，你混淆了六七四十二和五七三十五。区分方法：六七=42（4开头），五七=35（3开头）。记忆窍门：大数在前看十位。',
    deep: '🔍 本质：乘法的交换律保证a×b=b×a，所以只需记半张表（45组）。口诀表其实是一个对称三角形。每行比前一行多出一个"行号"。'
  },
  'math-elem-negative-numbers': {
    title: '负数的认识',
    bloom: '比较：-5和-3哪个小？请解释原因。分析：为什么说"欠债越多越穷"可以用负数解释？',
    diagnosis: '如果你认为-5>-3（错！），你把"绝对值大小"和"数的大小"搞混了。-5的绝对值是5，确实比3大，但-5这个数比-3小，在数轴上更靠左。',
    deep: '🔍 本质：负数是正数的"镜像"。数轴上0左边全是负数，越往左越小。负数解决了"比0还小"的计量需求——温度、海拔、财务都需要负数。'
  },
  'math-elem-number-recognition': {
    title: '数的认识',
    bloom: '识别下面数字：六、七、八。解释：0为什么也是数？比较：哪个数最小？0还是1？',
    diagnosis: '如果你不确定6和9哪个哪个，记住：6的圆在下面（像哨子），9的圆在上面（像气球）。还有：6倒过来是9，9倒过来是6，别写反了！',
    deep: '🔍 本质：数字是人类发明的符号，用来计数和比较。0的发明是数学史的里程碑——它表示"什么都没有"，使得位值系统（个十百千）成为可能。'
  },
  'math-elem-numbers-within-100': {
    title: '100以内数的认识',
    bloom: '解释：35中的3为什么表示30而不是3？分析：为什么同一个数字在不同位置代表不同的值？',
    diagnosis: '如果你认为35中3表示3个一，你忘记了位值原理。在数35中，3在十位，表示3个十=30；5在个位，表示5个一=5。位置决定数值！',
    deep: '🔍 本质：这是"位值制"——数字的值取决于它的位置。35=3×10+5×1。正是因为有位值制，我们才能用10个数字（0-9）表示任意大的数！'
  },
  'math-elem-numbers-within-10000': {
    title: '万以内数的认识',
    bloom: '解释：1003为什么读"一千零三"而不是"一千三"？分析：为什么写"一千零五"时中间要写0？',
    diagnosis: '如果你在写1003时写成"13"或读成"一千三"，你忽略了中间的空位。有0必须写出来：1003=1千+0百+0十+3一，百位和十位是空的，写0表示占位。',
    deep: '🔍 本质：0在数中有两个作用：①表示"没有"（1003中百位和十位没有）；②占位（保证后面数字的位置正确）。没有0，就没有现代数字系统。'
  },
  'math-elem-numbers-within-20': {
    title: '20以内数的认识',
    bloom: '解释：为什么11到19都叫"十几"？比较：15和12哪个大？判断：20是1个十还是2个十？',
    diagnosis: '如果你认为20=2个一+0，你混淆了个位和十位。20的2在十位，表示2个十=20，而不是2个一。写作"二十"，十位是2。',
    deep: '🔍 本质：11-20体现了"十进制进位"——满10进1位。这是人类选择十进制的体现（可能因为我们有10根手指）。1捆（10根）加散的几根，形象地展示了十位和个位。'
  },
  'math-elem-perimeter': {
    title: '周长',
    bloom: '比较：周长和面积有什么区别？计算：一个长8cm宽5cm的长方形，周长是多少？分析：为什么正方形周长公式是边长×4而不是边长×3？',
    diagnosis: '如果你把周长公式写成(长+宽)而忘了×2，你忘了长方形有两组对边。每条边要算一次，长方形有两条长和两条宽，所以要×2。',
    deep: '🔍 本质：周长是"一维"的量（长度），面积是"二维"的量（面积）。蚂蚁沿边爬一圈的距离=周长；给图形铺满地毯所需的大小=面积。'
  },
  'math-elem-pictograph': {
    title: '象形统计图',
    bloom: '解释：为什么看象形图必须先看图例？比较：象形图和条形图有什么区别？分析：如果图例改变，数据会变吗？',
    diagnosis: '如果你看象形图直接数图案数量，你忽略了图例的作用。每个图案可能代表2个、5个或10个，不看图例直接数会得出错误结论。',
    deep: '🔍 本质：象形图是"比例缩放"的直观展示。图案代表的数量是比例因子，实际数量=图案数×比例因子。统计图的本质是让抽象数字变得直观可见。'
  },
  'math-elem-pie-chart': {
    title: '扇形统计图',
    bloom: '解释：为什么扇形图中所有扇形的百分比之和等于100%？计算：某扇形占圆的40%，其圆心角是多少度？分析：扇形图和条形图各适合什么情况？',
    diagnosis: '如果你认为扇形图可以显示各类别的绝对数量，你混淆了扇形图和条形图。扇形图只能比较比例/占比，不能直接读出绝对数量（除非知道总量）。',
    deep: '🔍 本质：扇形图把"整体1"分成若干部分，每部分的面积=对应百分比×圆的面积。这是分数/百分比的视觉化。圆心角=360°×百分比。'
  },
  'math-elem-plane-shapes': {
    title: '平面图形',
    bloom: '解释：为什么说正方形是特殊的长方形？比较：三角形和四边形的内角和各是多少？判断：菱形是正方形吗？',
    diagnosis: '如果你认为正方形不是长方形，你搞反了。正方形是特殊的长方形（四边等长、四角直角），长方形不一定是正方形。特殊⊂一般。',
    deep: '🔍 本质：图形的"家族树"——正方形⊂菱形⊂平行四边形；正方形⊂长方形⊂平行四边形。每层特殊图形继承上层特性并增加新条件。'
  },
  'math-elem-possibility': {
    title: '可能性',
    bloom: '分析：一个袋中有5个红球和5个白球，摸球结果为什么不确定？评估：掷硬币100次，正面出现60次，说明可能性大于1/2吗？',
    diagnosis: '如果你认为"可能性大就一定会发生"，你混淆了可能性和确定性。可能性=1才是"一定发生"；即使可能性很大（如0.9），也有10%的概率不发生。',
    deep: '🔍 本质：可能性（概率）衡量不确定性。大数定律：试验次数越多，频率越接近真实概率。生活中的保险、天气预报、彩票都基于概率理论。'
  },
  'math-elem-ratio-proportion': {
    title: '比和比例',
    bloom: '比较：3:4和4:3有什么区别？解释：a:b=c:d为什么等价于ad=bc？分析：化简6:9的过程。',
    diagnosis: '如果你把比和比值搞混，记住：3:4是比（表示关系），0.75是比值（一个数）。比的前后项顺序不能随意颠倒：3:4≠4:3。',
    deep: '🔍 本质：比是分数的另一种表达。a:b=a/b。化简比=化简分数，除以最大公因数。比例中的"交叉相乘"来自分数等式两边同乘公分母。'
  },
  'math-elem-simple-equation': {
    title: '简单方程',
    bloom: '解释：为什么移项要变号？分析：解方程2x+3=11的每个步骤。判断：x=3是否满足方程2x+1=7？',
    diagnosis: '如果你移项时忘记变号（如x+5=12写成x=12+5=17），你忘了等式的平衡原理。移项实际是两边减去相同的数：x+5-5=12-5，所以x=7。',
    deep: '🔍 本质：方程是"平衡"的概念——天平两边等重。合法操作：两边加/减/乘/除同一个数（不为0）。方程思想从"算术"升级到"代数"，用未知数表达关系。'
  },
  'math-elem-solid-shapes': {
    title: '立体图形',
    bloom: '比较：长方体和正方体的异同。解释：圆柱为什么有3个面而不是2个？分析：长方体的6个面是怎么分成3对的？',
    diagnosis: '如果你认为圆柱只有2个面（上下底），你忽略了侧面。圆柱展开后：2个圆形底面+1个长方形侧面（展开后是长方形）=3个面。',
    deep: '🔍 本质：立体图形是"三维"的，有长、宽、高。展开图连接了"3D立体"和"2D平面"。长方体展开图有11种不同形状，但面积（表面积）相同。'
  },
  'math-elem-time-units': {
    title: '时间单位',
    bloom: '计算：从10:40到11:20经过多少分钟？解释：为什么时间用60进制而不是10进制？分析：2小时45分=多少分钟？',
    diagnosis: '如果你计算2小时45分=245分（错！），你用了10进制进行时间计算。时间是60进制：1小时=60分，所以2小时45分=2×60+45=165分钟。',
    deep: '🔍 本质：时间的60进制来源于古巴比伦文明（他们使用60进制）。60有很多因数（1,2,3,4,5,6,10,12,15,20,30,60），非常便于整除计算，所以沿用至今。'
  },
  'math-elem-triangles-quadrilaterals': {
    title: '三角形和四边形',
    bloom: '判断：1,2,4能组成三角形吗？为什么？分析：等腰三角形的两个底角如果各为70°，顶角是多少？评估：梯形是不是平行四边形？',
    diagnosis: '如果你认为1+2>4所以能组成三角形（错！1+2=3<4），你忘记了三角形三边关系：任意两边之和必须大于第三边，等于都不行。',
    deep: '🔍 本质：三角形内角和=180°是欧式几何的基本定理。四边形内角和=360°（因为可以分成2个三角形）。任意多边形内角和=(n-2)×180°。'
  },
  'math-elem-volume-calculation': {
    title: '体积计算',
    bloom: '解释：为什么体积公式是"三个维度相乘"？计算：一个棱长3dm的正方体体积是多少？区分：体积和容积有什么区别？',
    diagnosis: '如果你把正方体体积算成棱长×3（错！），你混淆了×3（乘以3）和³（三次方）。正方体体积=棱长×棱长×棱长，如棱长3：V=3×3×3=27，不是3×3=9。',
    deep: '🔍 本质：体积是三维空间的量。面积=两边相乘（二维），体积=三边相乘（三维）。单位对应：cm²（二维）→cm³（三维）。体积单位立方厘米是一个1cm×1cm×1cm的小正方体。'
  },
  'math-elem-volume-units': {
    title: '体积单位与换算',
    bloom: '解释：为什么1m³=1000000cm³而不是100cm³？计算：2.5L等于多少mL？分析：体积单位换算与长度单位换算有什么不同？',
    diagnosis: '如果你认为1m³=100cm³（错！），你把长度进率当成了体积进率。长度1m=100cm，但体积是三维的：1m³=(100cm)³=100×100×100=1,000,000cm³。',
    deep: '🔍 本质：三维换算需要将线性比率"立方"。1m=10dm=100cm，则1m³=10³dm³=100³cm³。同理，容积1L=1dm³（一升=一立方分米），这不是巧合，是国际单位制的设计。'
  },
  'math-elem-word-problems-basic': {
    title: '基本应用题',
    bloom: '分析："小明有a颗糖，给了弟弟5颗，还有多少颗？"应用哪种运算？评估下面列式是否正确："小明比小红多5个，小红有8个，小明有多少个？列式：8-5=3"。',
    diagnosis: '如果你把"A比B多5"列成A+5（没用到B），你搞混了题意。"A比B多5"意思是A=B+5，所以先要知道B。如小红8个，小明比小红多5，小明=8+5=13。',
    deep: '🔍 本质：应用题=将生活情境翻译成数学语言。关键是找"数量关系"：部分+部分=整体（加法）；整体-部分=另一部分（减法）；每份×份数=总量（乘法）；总量÷份数=每份（除法）。'
  }
};

function upgradePatch2(courseName) {
  const cfg = DEEP_CONTENT[courseName];
  if (!cfg) {
    console.error(`No config for ${courseName}`);
    return false;
  }

  const htmlFile = path.join(BASE, courseName, 'index.html');
  if (!fs.existsSync(htmlFile)) return false;

  let html = fs.readFileSync(htmlFile, 'utf8');
  let changed = false;

  // ===== #04 诊断性反馈 =====
  const hasDiagnosis = /错.*因|为什么错|你.*搞反|你.*搞混|你.*忘记|你.*混淆|常见错误|注意区分|不要.*混|diagnosis|错在|再想想/i.test(html);
  if (!hasDiagnosis) {
    const diagBlock = `
<!-- #04 诊断性反馈 -->
<section class="section" id="diagnosis-feedback" style="margin:30px 0;">
  <div class="section-title">🔎 错因诊断</div>
  <div class="card" style="padding:24px;background:linear-gradient(135deg,#fff8e1,#fff3cd);border:2px solid #ffc107;">
    <p style="font-weight:700;color:#e67e00;margin-bottom:12px;">⚠️ 如果你做错了，看看错在哪里：</p>
    <p style="font-size:15px;line-height:1.9;color:#333;">${cfg.diagnosis}</p>
    <div style="margin-top:16px;padding:12px;background:#fff;border-radius:10px;border-left:4px solid #ffc107;">
      <p style="font-size:14px;color:#666;">💡 自查方法：把答案代回原题验证，如果算出矛盾就说明中间有错误！</p>
    </div>
  </div>
</section>`;
    html = html.replace(/(<\/body>)/i, `${diagBlock}\n$1`);
    changed = true;
  }

  // ===== #06 Bloom层级覆盖 =====
  // Check current coverage
  const levels = {
    remember: /识别|列举|说出|写出|选出哪个是|下面哪个/i.test(html),
    understand: /解释|比较|描述|为什么|区别|含义/i.test(html),
    apply: /计算|求解|运用|求.*值|代入|画出/i.test(html),
    analyze: /推导|区分|归纳|分析.*原因|判断.*为什么/i.test(html),
    evaluate: /判断.*是否正确|验证|评估|评价|哪个更/i.test(html),
    create: /设计|构建|提出|编写一个|创造|方案/i.test(html),
  };
  const covered = Object.values(levels).filter(Boolean).length;
  if (covered < 3) {
    const bloomBlock = `
<!-- #06 Bloom层级练习 -->
<section class="section" id="bloom-exercises" style="margin:30px 0;">
  <div class="section-title">🎓 多层次思维训练</div>
  <div class="card" style="padding:24px;">
    <p style="color:#666;margin-bottom:16px;font-size:14px;">从记忆→理解→应用→分析，逐步深化你的理解！</p>
    <div style="background:#e8f5e9;border-radius:12px;padding:16px;margin-bottom:12px;">
      <p style="font-weight:700;color:#2e7d32;margin-bottom:8px;">📌 记忆层（识别）：选出下面哪个是${cfg.title}的正确说法：</p>
      <p style="font-size:14px;color:#333;line-height:1.8;">${cfg.bloom.split('？')[0]}？</p>
    </div>
    <div style="background:#e3f2fd;border-radius:12px;padding:16px;margin-bottom:12px;">
      <p style="font-weight:700;color:#1565c0;margin-bottom:8px;">🔍 理解层（解释）：用自己的话解释概念，并比较区别</p>
      <p style="font-size:14px;color:#333;line-height:1.8;">${cfg.bloom.split('？').slice(1,2).join('')}？</p>
    </div>
    <div style="background:#fce4ec;border-radius:12px;padding:16px;">
      <p style="font-weight:700;color:#880e4f;margin-bottom:8px;">⚡ 分析层（判断）：判断以下说法是否正确，并说明理由</p>
      <p style="font-size:14px;color:#333;line-height:1.8;">${cfg.bloom.split('？').slice(2).join('？')}</p>
    </div>
  </div>
</section>`;
    html = html.replace(/(<\/body>)/i, `${bloomBlock}\n$1`);
    changed = true;
  }

  // ===== #08 五镜头深层理解 =====
  const hasDeep = /深层理解|five.?lens|五镜头|看见它|拆开它|解释它|比较它|迁移它|insight/i.test(html);
  const hasInsightBox = /insight-box|深层|深入理解|本质|背后的原理/i.test(html);
  if (!hasDeep && !hasInsightBox) {
    const deepBlock = `
<!-- #08 五镜头深层理解 -->
<section class="section" id="deep-understanding" style="margin:30px 0;">
  <div class="section-title">🔭 深层理解</div>
  <div class="insight-box card" style="padding:24px;background:linear-gradient(135deg,#e8eaf6,#e3f2fd);border:2px solid #3f51b5;border-radius:16px;">
    <p style="font-weight:900;font-size:18px;color:#1a237e;margin-bottom:12px;">💡 背后的原理</p>
    <p style="font-size:16px;line-height:2;color:#333;">${cfg.deep}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;">
      <div style="padding:12px;background:rgba(255,255,255,.7);border-radius:10px;text-align:center;">
        <div style="font-size:24px;margin-bottom:6px;">🔍</div>
        <div style="font-size:13px;font-weight:700;color:#3f51b5;">看见它</div>
        <div style="font-size:12px;color:#666;margin-top:4px;">在生活中找到${cfg.title}的例子</div>
      </div>
      <div style="padding:12px;background:rgba(255,255,255,.7);border-radius:10px;text-align:center;">
        <div style="font-size:24px;margin-bottom:6px;">🔄</div>
        <div style="font-size:13px;font-weight:700;color:#3f51b5;">迁移它</div>
        <div style="font-size:12px;color:#666;margin-top:4px;">把${cfg.title}用到新情境中</div>
      </div>
    </div>
  </div>
</section>`;
    html = html.replace(/(<\/body>)/i, `${deepBlock}\n$1`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(htmlFile, html, 'utf8');
  }
  return true;
}

const courses = Object.keys(DEEP_CONTENT);
console.log(`\n🔧 Patch2：补充 #04/#06/#08（共${courses.length}个课件）...\n`);

for (const course of courses) {
  process.stdout.write(`  补充 ${course}... `);
  try {
    upgradePatch2(course);
    console.log('✅');
  } catch(e) {
    console.log(`❌ 错误: ${e.message}`);
  }
}

console.log('\n✅ Patch2 完成！\n');
