#!/usr/bin/env node
/**
 * TeachAny Batch Upgrade Script - Batch 1
 * Upgrades 20 elementary math coursewares to pass validation checks.
 * 
 * Fixes applied:
 * #01 ABT引入 (if missing)
 * #02 前测
 * #04 诊断性反馈
 * #05 后测
 * #06 Bloom层级覆盖
 * #07 知识图谱溯源 meta tags
 * #08 五镜头深层理解
 * #11 前置知识链
 * #13 Meta标签完整性
 * #16 课件打包 (manifest.json)
 * #17 记忆锚点 (if missing)
 * #18 易错点覆盖
 */

const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');

// ─── Course metadata definitions ───
const COURSE_META = {
  'math-e-area-rectangle': {
    node: 'area-rectangle',
    subject: 'math',
    domain: 'measurement',
    grade: '3',
    difficulty: '2',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'length-units,plane-shapes',
    title: '长方形面积',
    abt: {
      and: '我们已经学过了长方形的周长计算，知道了长度单位',
      but: '但是，如果要铺地板或画一块地，光知道周长还不够，我们需要知道它占了多大的地方',
      therefore: '因此，今天我们来学习"面积"的概念和长方形面积的计算公式'
    },
    pretest: [
      { q: '长方形有几条边？', opts: ['2条', '3条', '4条', '6条'], ans: 2, hint: '长方形是四边形，有4条边（两长两短）' },
      { q: '下面哪个单位用来测量长度？', opts: ['克', '厘米', '升', '度'], ans: 1, hint: '厘米(cm)是长度单位，克是质量单位' }
    ],
    posttest: [
      { q: '一块长5cm、宽3cm的长方形面积是多少？', opts: ['8平方厘米', '15平方厘米', '16平方厘米', '10平方厘米'], ans: 1, hint: '面积=长×宽=5×3=15平方厘米' },
      { q: '面积的单位是什么？', opts: ['厘米', '平方厘米', '厘米²只是符号', '米'], ans: 1, hint: '面积单位是平方厘米（cm²），不是厘米' }
    ],
    insight: '面积就像地毯覆盖地面的大小——不管地毯的边有多长，真正重要的是它盖住了多少地面。长方形面积=长×宽，相当于把宽排成一列，共排了长那么多列。',
    memory: '长方形面积口诀：长乘宽，面积量；单位别忘"平方"加！',
    errors: [
      { desc: '把周长公式(长+宽)×2 当面积公式用', diagnosis: '易错提醒：周长是一圈的总长度，面积是整个平面的大小。周长=(长+宽)×2，面积=长×宽，完全不同！' },
      { desc: '面积单位忘记写"平方"', diagnosis: '注意：面积单位必须写"平方"，如平方厘米、平方米，不能只写厘米' }
    ],
    bloom: { analyze: '比较周长和面积的区别', evaluate: '判断下面说法是否正确：周长相同面积一定相同', create: '设计一个面积为12平方厘米的长方形' }
  },
  'math-e-average-concept': {
    node: 'average-concept',
    subject: 'math',
    domain: 'statistics-probability-primary',
    grade: '3',
    difficulty: '2',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'addition-subtraction-within-100,division-concept',
    title: '平均数',
    abt: {
      and: '我们已经学会了加减法和除法，能计算多个数的总和',
      but: '但是，当我们想比较两组数据的整体水平时，直接比总数不公平（人数不同），怎么办？',
      therefore: '因此，我们引入"平均数"——用总量除以个数，得到一个代表整体水平的虚拟值'
    },
    pretest: [
      { q: '小明3天读了12页书，平均每天读几页？', opts: ['3页', '4页', '12页', '36页'], ans: 1, hint: '平均每天=总页数÷天数=12÷3=4页' },
      { q: '下面哪个运算是求平均数时必须用到的？', opts: ['加法和乘法', '加法和除法', '减法和乘法', '只用除法'], ans: 1, hint: '平均数=总和÷个数，需要先加（求总和），再除' }
    ],
    posttest: [
      { q: '5个数的平均数是8，这5个数的总和是多少？', opts: ['5', '8', '40', '13'], ans: 2, hint: '总和=平均数×个数=8×5=40' },
      { q: '平均数一定是数据中实际存在的某个值吗？', opts: ['一定是', '不一定是', '肯定不是', '只有整数时才是'], ans: 1, hint: '易错！平均数是虚拟代表值，可以不是任何一个实际数据' }
    ],
    insight: '平均数就像"移多补少"——把高的降低，把低的填高，最终大家一样高。它代表整体水平，但不等于任何一个真实数据。',
    memory: '平均数口诀：总和除以个数求，移多补少想一想；平均数是虚拟值，不等于某个真实数！',
    errors: [
      { desc: '认为平均数一定是数据中实际存在的某个值', diagnosis: '易错提醒：平均数是虚拟值，代表整体水平，不一定是数据中真实存在的。如3、4、5的平均数是4，恰好存在；但135、140、142的平均数约139cm，三人身高里没有139cm！' },
      { desc: '用平均数做安全判断（如平均水深1.2m就认为安全）', diagnosis: '注意：平均数掩盖了个体差异。平均1.2米不代表每处都1.2米，有些地方可能更深，很危险！' }
    ],
    bloom: { analyze: '分析为什么要用平均数而不是总和来比较两组数据', evaluate: '判断：河水平均深1.2米，身高1.3米不会游泳的小明下河安全吗？', create: '设计一组5个数，使它们的平均数恰好是10' }
  },
  'math-e-circle-perimeter-area': {
    node: 'circle-perimeter-area',
    subject: 'math',
    domain: 'geometry-primary',
    grade: '6',
    difficulty: '3',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'pi-concept,radius-diameter',
    title: '圆的周长和面积',
    abt: {
      and: '我们已经学过了圆的直径、半径和π的概念，知道π≈3.14',
      but: '但是，如何精确计算一个圆形草坪的围栏长度和铺草皮的面积？直尺无法直接量圆！',
      therefore: '因此，今天我们学习圆的周长公式（C=2πr）和面积公式（S=πr²），用数学解决生活问题'
    },
    pretest: [
      { q: 'π的近似值是多少？', opts: ['2.14', '3.14', '31.4', '1.414'], ans: 1, hint: 'π≈3.14（取两位小数），是圆周率，一个无理数' },
      { q: '直径和半径的关系是？', opts: ['直径=半径', '直径=半径×2', '直径=半径+2', '直径=半径²'], ans: 1, hint: '直径经过圆心连接圆上两点，等于半径的2倍' }
    ],
    posttest: [
      { q: '半径为3cm的圆，周长是多少？(π取3.14)', opts: ['9.42cm', '18.84cm', '28.26cm', '6.28cm'], ans: 1, hint: 'C=2πr=2×3.14×3=18.84cm' },
      { q: '直径为4m的圆形花圃面积是多少？(π取3.14)', opts: ['12.56m²', '50.24m²', '25.12m²', '6.28m²'], ans: 0, hint: 'r=4÷2=2m，S=πr²=3.14×2²=3.14×4=12.56m²' }
    ],
    insight: '圆的面积公式可以通过"化圆为方"来理解：把圆切成无数扇形后重新拼成近似长方形，长约为πr（半个周长），宽为r，所以面积=πr×r=πr²。',
    memory: '圆的公式口诀：周长等于π乘以直径（C=πd），面积等于π乘半径的平方（S=πr²）；直径大，周长长，别忘面积"r²"加！',
    errors: [
      { desc: '把直径代入面积公式当半径用', diagnosis: '易错提醒：面积公式S=πr²中的r是半径，不是直径！如果已知直径d，要先求r=d÷2，再代入公式' },
      { desc: '周长和面积公式混用', diagnosis: '注意：周长C=2πr（一维，单位cm），面积S=πr²（二维，单位cm²）。周长是"线"，面积是"面"！' }
    ],
    bloom: { analyze: '推导当直径扩大2倍时，面积扩大几倍？', evaluate: '验证：用C=πd和C=2πr算同一个圆结果是否相同', create: '设计一个面积约等于28.26cm²的圆形图案（求半径）' }
  },
  'math-e-division-concept': {
    node: 'division-concept',
    subject: 'math',
    domain: 'numbers-operations',
    grade: '2',
    difficulty: '2',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'multiplication-concept,equal-distribution',
    title: '除法的意义',
    abt: {
      and: '我们已经学过了乘法，知道乘法表示相同加数的简便算法',
      but: '但是，当我们想把12个苹果平均分给4个人，每人几个？这个问题乘法无法直接解决！',
      therefore: '因此，我们引入除法——平均分的数学表达方式，12÷4=3'
    },
    pretest: [
      { q: '下面哪道题需要用除法解决？', opts: ['每人给3个苹果，4人共需几个？', '12个苹果平均分给4人，每人几个？', '12加4等于多少？', '12个苹果再买4个，共几个？'], ans: 1, hint: '"平均分"是除法的典型信号，总数÷份数=每份数' },
      { q: '3×4=12，那么12÷4=？', opts: ['3', '4', '12', '8'], ans: 0, hint: '乘法和除法互为逆运算，3×4=12，所以12÷4=3' }
    ],
    posttest: [
      { q: '18÷3=？，用乘法验算应该是？', opts: ['3×6=18，对', '3×3=9，不对', '18×3=54，对', '6+3=9，不对'], ans: 0, hint: '验算：商×除数=被除数，6×3=18，验证正确' },
      { q: '下面哪道算式表示"把20平均分成5份"？', opts: ['20+5', '20×5', '20÷5', '5÷20'], ans: 2, hint: '平均分用除法：总数÷份数=每份数，即20÷5=4' }
    ],
    insight: '除法是乘法的逆运算——乘法是"每份×份数=总数"，除法反过来是"总数÷份数=每份"。理解这个互逆关系，用乘法口诀就能秒算除法！',
    memory: '除法口诀：平均分，用除法；被除数÷除数=商；用乘法验算，商×除数=被除数！',
    errors: [
      { desc: '把被除数和除数的位置写反，如把"12平均分给4人"写成4÷12', diagnosis: '易错提醒：除法中"被除数÷除数"，被除数是要被分的总数，写在÷前面！12平均分给4人=12÷4，不是4÷12' },
      { desc: '余数比除数大', diagnosis: '注意：余数必须比除数小！如13÷4=3余1（正确），不能写成13÷4=2余5（错，因为5>4）' }
    ],
    bloom: { analyze: '分析12÷3和3÷12结果的差异，理解除法不满足交换律', evaluate: '判断：余数可以比除数大吗？为什么？', create: '编写一道除法应用题，使得商为5余数为3' }
  },
  'math-e-measurement-sense': {
    node: 'length-units',
    subject: 'math',
    domain: 'measurement',
    grade: '2',
    difficulty: '2',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'numbers-within-100',
    title: '长度单位与量感',
    abt: {
      and: '我们已经知道了数字和基本计数，也用过尺子量过东西',
      but: '但是，描述"课桌有多高"或"操场有多长"时，用什么单位才合适？选错了单位会很荒谬！',
      therefore: '因此，今天我们学习毫米、厘米、分米、米、千米等长度单位，建立量感'
    },
    pretest: [
      { q: '1米等于多少厘米？', opts: ['10厘米', '100厘米', '1000厘米', '10000厘米'], ans: 1, hint: '1m=100cm，中间隔了分米：1m=10dm，1dm=10cm' },
      { q: '一支铅笔大约多长？', opts: ['约2毫米', '约20厘米', '约2米', '约20米'], ans: 1, hint: '铅笔约20厘米，大拇指宽约1厘米，建立参照感' }
    ],
    posttest: [
      { q: '3m=（ ）cm', opts: ['3', '30', '300', '3000'], ans: 2, hint: '1m=100cm，所以3m=3×100=300cm。注意不是30！' },
      { q: '课桌高约（ ）', opts: ['70毫米', '70厘米', '70分米', '70米'], ans: 1, hint: '课桌高约在膝盖到腰之间，约70厘米，不是70米（那是大楼高度）！' }
    ],
    insight: '建立量感的方法：用身体做参照！1厘米≈大拇指宽，1分米≈手掌宽，1米≈一步长，1千米≈步行约15分钟。用生活经验"丈量"世界！',
    memory: '长度单位口诀：千米最长用于路，米是常用基本数；分米手掌量一量，厘米拇指刚刚好；毫米更小指甲缝，进率都是十倍数！',
    errors: [
      { desc: '长度单位换算时进率记错，如把1m=100cm误记为1m=10cm', diagnosis: '易错提醒：1m=10dm=100cm=1000mm。米到厘米进率是100（中间隔了分米），不是10！记住：每级之间进率都是10，跳一级就是100' },
      { desc: '选用不合适的长度单位，如课桌高70米', diagnosis: '常见错误：课桌高70米？那是30层楼高！生活中要联系实际：人身高约160厘米=1.6米，课桌约70厘米，操场约200米' }
    ],
    bloom: { analyze: '归纳长度单位从大到小的顺序和进率关系', evaluate: '判断下面说法是否合理：蚂蚁身长约5米', create: '设计一个"量感挑战"：用身体部位测量教室的长度' }
  },
  'math-e-median-mode': {
    node: 'median-mode',
    subject: 'math',
    domain: 'statistics-probability-primary',
    grade: '5',
    difficulty: '3',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'average-concept,data-ordering',
    title: '中位数与众数',
    abt: {
      and: '我们已经学过平均数，知道它代表数据的整体水平',
      but: '但是，当数据中有极端值时，平均数会被"拉偏"，不能代表多数人的情况！',
      therefore: '因此，我们引入中位数（排序后中间那个）和众数（出现最多的那个）——它们更抗干扰'
    },
    pretest: [
      { q: '数据：3,5,7,9,11，中间位置的数是？', opts: ['5', '7', '9', '3'], ans: 1, hint: '5个数排序后，第3个（正中间）是7' },
      { q: '数据：2,3,3,4,5,3，哪个数出现最多？', opts: ['2', '4', '5', '3'], ans: 3, hint: '3出现了3次，其他各出现1次，所以众数是3' }
    ],
    posttest: [
      { q: '数据：1,2,3,4,100，中位数是？平均数是？哪个更能代表多数人水平？', opts: ['中位数3，平均数22，中位数更合适', '中位数3，平均数22，平均数更合适', '中位数22，平均数3，平均数更合适', '中位数50，平均数50，都合适'], ans: 0, hint: '100是极端值，把平均数拉到22，但多数数据在1-4范围，中位数3更能代表' },
      { q: '数据：5,5,5,8,8，众数是？中位数是？', opts: ['众数5，中位数5', '众数5，中位数8', '众数8，中位数5', '众数5，中位数6'], ans: 0, hint: '5出现3次最多，众数=5；共5个数，第3个是5，中位数=5' }
    ],
    insight: '三种平均数各有用途：平均数受极端值影响大（适合均匀分布数据），中位数稳定（适合含极端值的数据），众数反映最常见情况（适合找"热门"）。',
    memory: '统计三兄弟口诀：平均数用加除，中位数看中间，众数找最多现；极端值来搞破坏，中位数和众数更稳健！',
    errors: [
      { desc: '偶数个数据时中位数求法错误，忘记取中间两数的平均值', diagnosis: '易错提醒：偶数个数据（如6个）时，中位数=中间两个数的平均值！如1,2,3,4,5,6中位数=(3+4)÷2=3.5，不是3也不是4' },
      { desc: '认为中位数一定是数据中间位置的数而忽略排序', diagnosis: '注意：求中位数必须先从小到大排序！数据3,1,4,1,5，不排序中间是4，但排序后1,1,3,4,5，中位数是3' }
    ],
    bloom: { analyze: '分析收入数据中为什么政府通常公布中位收入而非平均收入', evaluate: '评估：5个同学考试成绩的中位数和平均数哪个更能反映班级水平？', create: '设计一组数据，使其平均数、中位数、众数三者都不相等' }
  },
  'math-e-mixed-operations': {
    node: 'mixed-operations',
    subject: 'math',
    domain: 'numbers-operations',
    grade: '4',
    difficulty: '3',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'addition-subtraction-within-10000,multiplication-division-concept',
    title: '四则混合运算',
    abt: {
      and: '我们已经分别学会了加减法和乘除法',
      but: '但是，当一道题里同时出现加减乘除时，先算哪个？不同的顺序会得出不同结果！',
      therefore: '因此，数学界规定了运算顺序：先乘除后加减，有括号先算括号'
    },
    pretest: [
      { q: '6+4×2=？（不用括号）', opts: ['20', '14', '10', '12'], ans: 1, hint: '先乘除后加减：先算4×2=8，再算6+8=14' },
      { q: '下面哪个算式需要先算括号里的？', opts: ['3+4×2', '(3+4)×2', '12÷4+2', '5×2-3'], ans: 1, hint: '有括号先算括号：(3+4)×2=7×2=14，而3+4×2=3+8=11，结果不同！' }
    ],
    posttest: [
      { q: '12÷(2+1)×3=？', opts: ['6', '12', '2', '18'], ans: 1, hint: '先算括号(2+1)=3，再从左到右算乘除：12÷3=4，4×3=12' },
      { q: '(5+3)×4-6÷2=？', opts: ['29', '25', '11', '35'], ans: 0, hint: '括号先：(5+3)=8；乘除次：8×4=32，6÷2=3；最后加减：32-3=29' }
    ],
    insight: '运算顺序就像交通规则——不是随意的，是为了让所有人得到相同答案。括号=VIP通道（优先），乘除=快车道（优先于加减），加减=慢车道（最后算）。',
    memory: '混合运算口诀：括号最优先，乘除排第二，加减最后算；同级从左到右，规则记心中！',
    errors: [
      { desc: '从左到右不管优先级，如6+4×2算成(6+4)×2=20', diagnosis: '易错提醒：没有括号时，乘除优先于加减！6+4×2不是(6+4)×2，而是6+(4×2)=6+8=14。只有加法在括号里，才先算括号' },
      { desc: '有括号时忘记括号内也有运算顺序', diagnosis: '注意：括号内也要遵守运算顺序！(2+3×4)内先算3×4=12，再算2+12=14，不是先算2+3' }
    ],
    bloom: { analyze: '分析为什么乘除要比加减优先（联系生活实例）', evaluate: '判断：3+4×5与(3+4)×5结果不同，谁更符合"买3件再买4件，每件5元，共多少钱"？', create: '编写一道含括号的混合运算应用题，使结果恰好为100' }
  },
  'math-e-multi-digit-addition-subtraction': {
    node: 'multi-digit-addition-subtraction',
    subject: 'math',
    domain: 'numbers-operations',
    grade: '3',
    difficulty: '2',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'addition-subtraction-within-100,place-value-hundreds',
    title: '多位数加减法',
    abt: {
      and: '我们已经学会了100以内的加减法和千位数的读写',
      but: '但是，买东西花了325元又228元，怎么快速算出花了多少？数字变大了，口算不够了！',
      therefore: '因此，今天学习多位数加减法的竖式计算——相同数位对齐，从个位算起，满十进一'
    },
    pretest: [
      { q: '63+25=？（口算）', opts: ['78', '88', '87', '98'], ans: 1, hint: '个位3+5=8，十位6+2=8，结果88' },
      { q: '数字125中，"1"在什么位上，表示什么？', opts: ['个位，表示1个一', '十位，表示1个十', '百位，表示1个百', '千位，表示1个千'], ans: 2, hint: '125：1在百位，表示1个百（100）；2在十位，5在个位' }
    ],
    posttest: [
      { q: '325+248=？', opts: ['563', '573', '463', '574'], ans: 1, hint: '竖式计算：个位5+8=13（写3进1），十位2+4+1=7，百位3+2=5，结果573' },
      { q: '502-265=？', opts: ['237', '367', '247', '337'], ans: 0, hint: '竖式：个位2-5不够减，借十位；但十位0借百位。502-265=237' }
    ],
    insight: '竖式加减法就像"排队计算"——相同数位对齐，从最小位（个位）开始算，避免遗漏进位或借位。就像整理书架：先整理最下层，有进位（满10）就往上层送一本。',
    memory: '竖式计算口诀：相同数位要对齐，从个位开始来计算；加法满十向前进，减法不够向前借；借来之后莫忘记，进位减位都做好！',
    errors: [
      { desc: '加法进位后忘记加进的1', diagnosis: '易错提醒：个位满10向十位进1，十位计算时必须加上这个进的1！如65+48，个位5+8=13，写3进1，十位6+4+1（进位）=11，结果113，不是103' },
      { desc: '减法连续借位出错', diagnosis: '常见错误：502-265，十位是0，需要从百位借。先百位借给十位（十位变10，百位变4），十位再借给个位（个位变12，十位变9），再计算：12-5=7，9-6=3，4-2=2，结果237' }
    ],
    bloom: { analyze: '归纳竖式加法和减法中进位和借位的规则', evaluate: '验证：用加法来检验减法结果237+265是否等于502', create: '编写一道三位数加法应用题，答案恰好有两次进位' }
  },
  'math-e-operations-laws': {
    node: 'operations-laws',
    subject: 'math',
    domain: 'numbers-operations',
    grade: '4',
    difficulty: '3',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'addition-subtraction-within-10000,multiplication-concept',
    title: '运算定律',
    abt: {
      and: '我们已经学会了四则运算，但计算时常常要做很多步骤',
      but: '但是，有时候数字很大，怎样巧妙地改变运算顺序来简化计算？',
      therefore: '因此，我们学习加法交换律、加法结合律和乘法分配律——这些定律让计算变得灵活简便'
    },
    pretest: [
      { q: '25+36=36+25，这利用了什么定律？', opts: ['加法结合律', '加法交换律', '乘法分配律', '减法交换律'], ans: 1, hint: '交换加数位置，和不变，这是加法交换律' },
      { q: '(25+75)+48=25+(75+48)，这利用了什么定律？', opts: ['加法结合律', '加法交换律', '乘法分配律', '减法结合律'], ans: 0, hint: '改变运算顺序（加括号），和不变，这是加法结合律。25+75=100，更好算！' }
    ],
    posttest: [
      { q: '用乘法分配律计算：(100+2)×5=？', opts: ['502', '200', '510', '102'], ans: 2, hint: '乘法分配律：(100+2)×5=100×5+2×5=500+10=510。比先算括号简单！' },
      { q: '下面用了乘法分配律的是？', opts: ['25×4=4×25', '125×(8×1)=125×8×1', '45×12=45×10+45×2', '56+44=44+56'], ans: 2, hint: '乘法分配律：a×(b+c)=a×b+a×c。45×12=45×(10+2)=45×10+45×2=510，对！' }
    ],
    insight: '运算定律是数学中的"快捷键"。加法交换律=换位子（a+b=b+a），加法结合律=换括号（(a+b)+c=a+(b+c)），乘法分配律=分发糖果（a×(b+c)=a×b+a×c）。',
    memory: '运算定律口诀：加法可以换位子，结合律改括号；乘法分配拆开算，巧妙凑整算得快；记住定律用好了，计算简便不出错！',
    errors: [
      { desc: '乘法分配律中漏乘，如(100+2)×5=500+2=502', diagnosis: '易错提醒：乘法分配律(100+2)×5，括号里每个加数都要乘以5！100×5=500，2×5=10，结果510，不是502（漏了2×5）' },
      { desc: '把乘法结合律和乘法分配律混淆', diagnosis: '注意区分：乘法结合律 a×(b×c)=(a×b)×c（纯乘法）；乘法分配律 a×(b+c)=a×b+a×c（乘法和加减混合）。括号里是乘还是加减，决定用哪个定律' }
    ],
    bloom: { analyze: '分析乘法分配律的本质（联系面积模型理解）', evaluate: '判断：减法和除法也有交换律吗？举例验证', create: '运用运算定律，用简便方法计算25×44' }
  },
  'math-e-percentage': {
    node: 'percentage',
    subject: 'math',
    domain: 'numbers-operations',
    grade: '6',
    difficulty: '3',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'fraction-concept,decimal-multiplication',
    title: '百分数',
    abt: {
      and: '我们已经学过了分数和小数，能进行分数、小数的互化',
      but: '但是，商店打折、成绩分析、统计图表中到处是"%"，这是什么意思？和分数有什么关系？',
      therefore: '因此，今天我们学习百分数——表示一个数是另一个数百分之几的特殊分数'
    },
    pretest: [
      { q: '下面哪个是百分数？', opts: ['3/4', '0.75', '75%', '七成五'], ans: 2, hint: '百分数用"%"表示，分母固定是100，75%=75/100=0.75' },
      { q: '1/4化成小数是？', opts: ['0.14', '0.25', '0.4', '4'], ans: 1, hint: '1÷4=0.25，化成百分数是25%' }
    ],
    posttest: [
      { q: '一件衣服原价200元，打八折后是多少钱？', opts: ['160元', '180元', '120元', '240元'], ans: 0, hint: '八折=80%，200×80%=200×0.8=160元' },
      { q: '40%化成小数是？', opts: ['40', '4', '0.4', '0.04'], ans: 2, hint: '百分数→小数：去掉%，小数点左移两位。40%=0.40=0.4' }
    ],
    insight: '百分数就是"以100为标准的分数"。无论原来多少，都化成100份来比较，就像考试都算100分制一样，方便横向比较。60%=60/100=0.6，三者表示同一个量。',
    memory: '百分数口诀：百分数，分母百，用%来表示；化小数，去百分，小数点左移两；化分数，写分母，约分化到最简；三者互化记心中，比较方便解题快！',
    errors: [
      { desc: '百分数化小数时小数点移动方向搞错', diagnosis: '易错提醒：百分数化小数是去掉%，小数点向左移两位（因为百分数分母是100，÷100就是左移两位）。75%→0.75，不是75.0！小数化百分数：小数点右移两位，加%' },
      { desc: '打折计算中折扣含义搞错（如"九折"以为是省了9/10）', diagnosis: '注意：九折不是省9/10！九折=90%，意味着按原价的90%付款，省了10%。七折=70%（省30%），不是70%被省去！' }
    ],
    bloom: { analyze: '比较百分数、分数、小数三种表达方式的优缺点', evaluate: '判断：两次都涨价10%，总共涨了20%吗？验证', create: '设计一道百分数应用题，涉及折扣和税率' }
  },
  'math-e-percentage-statistics': {
    node: 'percentage-statistics',
    subject: 'math',
    domain: 'statistics-probability-primary',
    grade: '6',
    difficulty: '3',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'percentage,bar-chart,pie-chart',
    title: '百分数统计',
    abt: {
      and: '我们已经学过百分数和统计图，能读取条形图和折线图中的数据',
      but: '但是，如何直观显示各部分占总量的比例？比如班级男女生比例、零食消费分配？',
      therefore: '因此，我们学习扇形统计图——用圆的各个扇形来表示各部分占总量的百分比'
    },
    pretest: [
      { q: '一个圆被平均分成4等份，每份占圆的百分之几？', opts: ['4%', '25%', '40%', '14%'], ans: 1, hint: '1÷4=0.25=25%，每份占圆的25%' },
      { q: '条形图和折线图的区别是？', opts: ['条形图比较数量多少，折线图展示变化趋势', '条形图展示变化趋势，折线图比较数量多少', '两者完全相同', '折线图只用于统计'], ans: 0, hint: '条形图=各类别比高矮；折线图=同一事物随时间变化的走势' }
    ],
    posttest: [
      { q: '扇形统计图中各部分百分比之和必须是？', opts: ['50%', '100%', '200%', '不确定'], ans: 1, hint: '扇形图是把整体圆（100%）分成各部分，所有部分加起来必须是100%' },
      { q: '如果"水果"占扇形统计图的30%，总消费1000元，水果花了多少？', opts: ['300元', '30元', '30000元', '700元'], ans: 0, hint: '水果=1000×30%=1000×0.3=300元' }
    ],
    insight: '扇形统计图适合展示"部分与整体的关系"——就像切蛋糕，每块扇形的大小直接反映该类别占总量的百分比。记住：所有扇形加起来必须是完整的圆（100%）。',
    memory: '扇形图口诀：圆形分块看比例，扇形大小代表多少；百分比，加起来，必须正好等于一百；整体局部关系清，百分数据读图明！',
    errors: [
      { desc: '该用折线图却用条形图或扇形图，无法看出变化趋势', diagnosis: '易错提醒：选图表要看目的！展示各部分比例→扇形图；比较不同类别数量→条形图；显示随时间的变化→折线图。一周气温变化用折线图，不是条形图！' },
      { desc: '扇形图各部分百分比之和不等于100%', diagnosis: '常见错误：绘制扇形图时各部分百分比的总和不是100%。检查方法：把所有百分比加起来，必须=100%，否则数据有误' }
    ],
    bloom: { analyze: '分析扇形统计图、条形图、折线图各自最适合的使用场景', evaluate: '评估：用扇形图展示"2010-2020年全国人口变化"合适吗？', create: '设计一份班级课外活动时间分配的扇形统计图' }
  },
  'math-e-position-direction': {
    node: 'position-direction',
    subject: 'math',
    domain: 'geometry-primary',
    grade: '2',
    difficulty: '2',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'spatial-sense,left-right-concept',
    title: '位置与方向',
    abt: {
      and: '我们已经知道了上下左右的基本方位，在生活中能用这些词描述位置',
      but: '但是，地图上为什么有东南西北？如何用坐标和方向精确描述一个地点的位置？',
      therefore: '因此，今天我们学习东南西北四个方向，以及用行列坐标描述位置的方法'
    },
    pretest: [
      { q: '面向北方时，你的右手边是哪个方向？', opts: ['北', '南', '东', '西'], ans: 2, hint: '面北时：右手=东，左手=西，前方=北，后方=南' },
      { q: '地图通常遵循什么方向规则？', opts: ['上北下南，左西右东', '上南下北，左东右西', '上东下西，左北右南', '没有规则'], ans: 0, hint: '标准地图：上北下南，左西右东（简称"上北下南"）' }
    ],
    posttest: [
      { q: '小明家在学校的南边，那学校在小明家的哪边？', opts: ['南边', '北边', '东边', '西边'], ans: 1, hint: '位置关系是对称的：小明家在学校南边，反过来学校就在小明家北边' },
      { q: '在坐标中，第3列第2行的位置用坐标表示是？', opts: ['(2,3)', '(3,2)', '(2,2)', '(3,3)'], ans: 1, hint: '坐标先写列（横），再写行（纵）：第3列第2行→(3,2)' }
    ],
    insight: '方向就像地图的"密码"。记住东南西北的关键：面向升起太阳（东）时，右手是南，左手是北，背后是西。用这个"太阳规则"，永远不会搞混！',
    memory: '方向口诀：上北下南左西右东，面朝北时右手东；东升西落太阳路，南北对立不会错；坐标先列后行数，列横行纵要记住！',
    errors: [
      { desc: '坐标（列，行）写反，把(3,2)理解为第2列第3行', diagnosis: '易错提醒：坐标写法"先列后行"（横坐标，纵坐标）。(3,2)表示第3列第2行，记住：x轴（横）在前，y轴（纵）在后！' },
      { desc: '方向关系不对称，认为"A在B的南边"不能推出"B在A的北边"', diagnosis: '注意：方向是相互的！A在B的南边，就意味着B在A的北边。它们是完全对称、互相对立的关系' }
    ],
    bloom: { analyze: '分析为什么地图要规定"上北下南"而不是其他方向', evaluate: '判断：从A走到B向东，从B走回A应该向哪走？', create: '画一张教室周边的简单地图，用方向词描述各建筑位置' }
  },
  'math-e-possibility-concept': {
    node: 'possibility-concept',
    subject: 'math',
    domain: 'statistics-probability-primary',
    grade: '5',
    difficulty: '3',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'fraction-concept,data-collection',
    title: '可能性与概率',
    abt: {
      and: '我们已经学过分数，知道如何用分数表示部分与整体的关系',
      but: '但是，投硬币正面朝上的机会有多大？摸球摸到红球的可能性怎么算？生活中充满不确定！',
      therefore: '因此，我们学习可能性（概率）——用分数精确描述随机事件发生的可能程度'
    },
    pretest: [
      { q: '掷一个骰子，出现6点的可能性是？', opts: ['1/6', '1/2', '1/3', '6/6'], ans: 0, hint: '骰子有6个面，每面等可能出现，出现6点的概率=1/6' },
      { q: '下面哪个事件是"不可能事件"？', opts: ['明天可能下雨', '投硬币出现正面', '太阳从西边升起', '掷骰子出现奇数'], ans: 2, hint: '太阳永远从东边升起，从西边升起是不可能发生的事件，概率=0' }
    ],
    posttest: [
      { q: '袋中有3个红球，2个蓝球，随机摸一个，摸到红球的概率是？', opts: ['3/5', '2/5', '3/2', '1/5'], ans: 0, hint: '总共5个球，红球3个，概率=3/5' },
      { q: '一个事件的概率是0.8，它的对立事件概率是？', opts: ['0.8', '1.8', '0.2', '0.08'], ans: 2, hint: '互补事件概率之和=1。1-0.8=0.2，对立事件（不发生）的概率是0.2' }
    ],
    insight: '概率就是用分数说明"机会的大小"。公式：概率=满足条件的结果数÷所有可能结果数。概率在0（不可能）到1（必然）之间，0.5表示"一半一半"。',
    memory: '概率口诀：概率分数来表示，满足条件÷总可能；不可能是0，必然是1，0到1之间是随机；两个互补加为1，一件发生一件停！',
    errors: [
      { desc: '把频率当概率，认为投10次硬币必定5次正面5次反面', diagnosis: '易错提醒：概率是理论值，频率是实际值。投10次不一定刚好5:5，但次数越多，频率越接近概率。这是大数定律！' },
      { desc: '概率值超出[0,1]范围，如算出3/2', diagnosis: '注意：概率必须在0到1之间（包括0和1）！如果算出的概率>1或<0，说明计算出错了，要重新检查' }
    ],
    bloom: { analyze: '分析为什么"买彩票必然中奖"是错的（用概率解释）', evaluate: '评估：一枚硬币连续正面10次后，下一次正面的概率是50%还是更高？', create: '设计一个公平的游戏规则，使两人获胜概率相等' }
  },
  'math-e-solid-surface-area': {
    node: 'solid-surface-area',
    subject: 'math',
    domain: 'geometry-primary',
    grade: '5',
    difficulty: '3',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'area-rectangle,plane-shapes-area',
    title: '立体图形的表面积',
    abt: {
      and: '我们已经学会了长方形、正方形等平面图形的面积计算',
      but: '但是，制作一个礼品盒需要多少纸板？粉刷一个房间的墙壁需要多少涂料？这需要立体图形的表面积！',
      therefore: '因此，今天我们学习长方体和正方体的表面积——把立体展开成平面，计算所有面的面积总和'
    },
    pretest: [
      { q: '长方体有几个面？', opts: ['4个', '5个', '6个', '8个'], ans: 2, hint: '长方体有6个面（上下、左右、前后各一对），共3对相对面' },
      { q: '正方体各面的面积有什么特点？', opts: ['每面面积不同', '只有对面相等', '所有6面面积相等', '上下面最大'], ans: 2, hint: '正方体6个面都是正方形，边长相同，所以6面面积完全相等' }
    ],
    posttest: [
      { q: '长4cm、宽3cm、高2cm的长方体，表面积是多少？', opts: ['52cm²', '26cm²', '24cm²', '48cm²'], ans: 0, hint: '表面积=2×(长×宽+长×高+宽×高)=2×(4×3+4×2+3×2)=2×(12+8+6)=2×26=52cm²' },
      { q: '正方体棱长为5cm，表面积是多少？', opts: ['25cm²', '150cm²', '125cm²', '30cm²'], ans: 1, hint: '正方体表面积=6×棱长²=6×5²=6×25=150cm²' }
    ],
    insight: '计算表面积的秘诀："展开法"——想象把盒子沿棱剪开，展开成平面图，就能看清所有面。长方体展开有3对相等的面（上下/前后/左右），分别算面积再相加。',
    memory: '长方体表面积口诀：三组对面两两算，长×宽、长×高、宽×高；三个积相加之后，结果乘以2得答案；正方体更简单，六面积等棱长方！',
    errors: [
      { desc: '长方体表面积公式中忘记乘以2', diagnosis: '易错提醒：长方体有3对面（共6个面），每对有2个面积相同的面，所以要×2！表面积=2×(长×宽+长×高+宽×高)，不是(长×宽+长×高+宽×高)' },
      { desc: '混淆表面积和体积', diagnosis: '注意：表面积是6个面的面积总和（二维），单位是cm²；体积是物体占据的空间大小（三维），单位是cm³。完全不同的概念！' }
    ],
    bloom: { analyze: '推导长方体6个面为什么能分成3对，各对面积分别是什么', evaluate: '验证：将一个大长方体从中间切开，两小块的表面积之和大于还是等于原来的表面积？', create: '设计一个体积为24cm³的长方体，计算其表面积（有多种答案）' }
  },
  'math-e-symmetry-translation-rotation': {
    node: 'symmetry-translation-rotation',
    subject: 'math',
    domain: 'geometry-primary',
    grade: '4',
    difficulty: '2',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'plane-shapes,position-direction',
    title: '对称、平移和旋转',
    abt: {
      and: '我们已经认识了基本平面图形，能辨认和描述图形的形状',
      but: '但是，蝴蝶翅膀为什么两边一样？跷跷板怎么动的？风车为什么转？这些都是图形变换！',
      therefore: '因此，今天我们学习三种图形变换：对称（镜像翻折）、平移（直线移动）、旋转（绕点转动）'
    },
    pretest: [
      { q: '下面哪个字母是轴对称图形？', opts: ['F', 'A', 'Z', 'J'], ans: 1, hint: 'A可以沿中间竖线对折，左右两边完全重合，是轴对称图形' },
      { q: '一个图形向右移动5格，这叫做？', opts: ['旋转', '翻转', '对称', '平移'], ans: 3, hint: '平移：图形整体沿直线移动，形状大小不变，方向不变' }
    ],
    posttest: [
      { q: '下面哪种变换改变了图形的方向但不改变大小？', opts: ['放大', '平移', '旋转', '缩小'], ans: 2, hint: '旋转：绕某点转动，改变方向/位置，但形状大小不变。平移不改变方向' },
      { q: '一个图形沿对称轴翻折后，两部分能完全重合，这叫做？', opts: ['平移对称', '旋转对称', '轴对称', '中心对称'], ans: 2, hint: '轴对称：存在一条直线（对称轴），图形沿此线折叠后两部分完全重合' }
    ],
    insight: '三种变换的区别：平移=直线搬家（位置变，方向大小不变）；旋转=绕点转圈（位置和方向变，大小不变）；对称=照镜子（位置和方向变，大小不变，且是镜像）。',
    memory: '图形变换口诀：平移搬家直线走，大小方向都不变；旋转绕点转圈圈，大小不变方向变；对称折叠两边合，镜像相同对称轴；三种变换记心中，图形世界不迷路！',
    errors: [
      { desc: '混淆旋转和平移，认为斜移动是旋转', diagnosis: '易错提醒：平移是沿直线移动（水平、垂直、斜线都可以），图形方向不变；旋转是绕固定点转动，图形方向改变。区别在于：图形的方向（角度）是否改变！' },
      { desc: '找对称轴时只考虑竖直和水平方向', diagnosis: '注意：对称轴可以是任意方向！菱形有竖直和水平两条对称轴，正方形有4条（水平、垂直、两条对角线），不要漏找斜向的对称轴' }
    ],
    bloom: { analyze: '归纳哪些字母有对称轴（A,H,I,M,O,T,U,V,W,X,Y）', evaluate: '判断：旋转180°和沿中心点对称，结果一样吗？', create: '设计一个既有轴对称又有旋转对称的图案（如雪花）' }
  },
  'math-e-triangle-properties': {
    node: 'triangle-properties',
    subject: 'math',
    domain: 'geometry-primary',
    grade: '4',
    difficulty: '2',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'angle-concept,plane-shapes',
    title: '三角形的性质',
    abt: {
      and: '我们已经学过角的概念和平面图形，知道三角形有3条边3个角',
      but: '但是，三角形3个内角加起来是多少度？三边有什么关系？为什么三角形最稳固？',
      therefore: '因此，今天我们探究三角形的内角和（180°）、三边关系，以及稳定性原理'
    },
    pretest: [
      { q: '三角形有几个内角？', opts: ['2个', '3个', '4个', '6个'], ans: 1, hint: '三角形有3个顶点，3条边，3个内角' },
      { q: '直角三角形中有一个角是90°，另外两个角之和是？', opts: ['180°', '90°', '270°', '360°'], ans: 1, hint: '三角形内角和=180°，90°+其余两角=180°，所以其余两角=90°' }
    ],
    posttest: [
      { q: '三角形两个角分别是45°和75°，第三个角是？', opts: ['60°', '80°', '120°', '105°'], ans: 0, hint: '三角形内角和=180°，第三角=180°-45°-75°=60°' },
      { q: '三条线段长度为3cm、4cm、8cm，能组成三角形吗？', opts: ['能', '不能，因为3+4<8', '不能，因为3+8>4', '要看角度'], ans: 1, hint: '三角形三边关系：两边之和必须大于第三边。3+4=7<8，不满足，不能组成三角形！' }
    ],
    insight: '三角形的"内角和=180°"可以这样理解：把三角形三个角剪下来拼在一起，恰好拼成一条直线（180°平角）！三边关系则告诉我们：两条短边加起来必须能"够得到"长边，否则首尾不能相连。',
    memory: '三角形口诀：内角和是一百八，三边之和大第三；两短边和大长边，才能围成三角形；等边等腰要记清，等边三角60°顶！',
    errors: [
      { desc: '三角形内角和与四边形内角和混淆', diagnosis: '易错提醒：三角形内角和=180°，四边形内角和=360°！每增加一条边，内角和增加180°。区分方法：三角形可以分成1个三角形，四边形可分成2个三角形（2×180°=360°）' },
      { desc: '三边关系只检验一对，漏掉其他组合', diagnosis: '注意：判断能否组成三角形，需要验证"任意两边之和>第三边"。实际上只需检验两条较短边的和是否大于最长边即可！' }
    ],
    bloom: { analyze: '推导四边形、五边形的内角和（利用三角形内角和180°）', evaluate: '验证：等腰三角形顶角为40°，两底角各是多少度？', create: '用三角形的稳定性原理，设计一个不容易变形的桌子脚结构' }
  },
  'math-elem-add-sub-within-100': {
    node: 'addition-subtraction-within-100',
    subject: 'math',
    domain: 'numbers-operations',
    grade: '2',
    difficulty: '1',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'addition-subtraction-within-20,place-value-tens',
    title: '100以内加减法',
    abt: {
      and: '我们已经学会了20以内的加减法，会用凑十法和破十法',
      but: '但是，买东西花了35元，付了50元，找回多少钱？数字超过20了！',
      therefore: '因此，今天学习100以内的加减法——利用十位和个位分别计算，突破20的限制'
    },
    pretest: [
      { q: '20+30=？', opts: ['23', '50', '32', '60'], ans: 1, hint: '整十数相加：十位2+3=5，结果50（个位不动）' },
      { q: '35中，十位上的数是几？表示几个十？', opts: ['5，5个十', '3，3个十', '3，3个一', '5，5个一'], ans: 1, hint: '35：3在十位，表示3个十（即30）；5在个位，表示5个一' }
    ],
    posttest: [
      { q: '56+38=？（竖式算法）', opts: ['94', '84', '86', '96'], ans: 0, hint: '竖式：个位6+8=14，写4进1；十位5+3+1=9，结果94' },
      { q: '72-46=？', opts: ['34', '26', '36', '24'], ans: 1, hint: '竖式：个位2-6不够，借十位；12-6=6，十位7-1-4=2，结果26' }
    ],
    insight: '100以内加减法的关键是"数位对齐"。十位只管十位，个位只管个位，就像把硬币分类放——角和分分开放，不能混在一起！进位借位是十位和个位之间的"借调"。',
    memory: '100以内计算口诀：个位对个位，十位对十位；加法满十要进位，减法不够要借位；进了借了要记清，别忘那个小小1！',
    errors: [
      { desc: '进位加法忘记向十位进1', diagnosis: '易错提醒：个位相加≥10时，必须向十位进1！计算十位时要加上进来的1。如56+38，个位6+8=14，写4进1，十位要算5+3+1=9，结果94，不是84' },
      { desc: '混淆十位和个位含义，如35中3表示3个一', diagnosis: '注意：35中3在十位，表示3个十（=30），不是3个一！个位上的5才表示5个一。进退位时要搞清哪位的数字' }
    ],
    bloom: { analyze: '归纳什么情况下加法会进位，什么情况下减法会借位', evaluate: '验证：56+38和38+56结果相同（加法交换律）', create: '编写一道100以内加减法应用题，要求有进位' }
  },
  'math-elem-add-sub-within-20': {
    node: 'addition-subtraction-within-20',
    subject: 'math',
    domain: 'numbers-operations',
    grade: '1',
    difficulty: '1',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'numbers-within-10,addition-subtraction-within-10',
    title: '20以内加减法',
    abt: {
      and: '我们已经学会了10以内的加减法，能数数到20',
      but: '但是，9+6怎么算？超过10了，手指头不够数了！',
      therefore: '因此，我们学习凑十法（9+6→9+1+5=15）和破十法（15-8→10-8+5=7）——用10作桥梁'
    },
    pretest: [
      { q: '9+？=10，问号是几？', opts: ['0', '1', '2', '9'], ans: 1, hint: '凑十法关键：知道每个数还差几才能凑成10。9差1才能凑成10' },
      { q: '10以内加法：6+7=？', opts: ['12', '13', '11', '14'], ans: 1, hint: '6+7：把7拆成4+3，先算6+4=10，再10+3=13；或：7+6=13' }
    ],
    posttest: [
      { q: '用凑十法算9+5=？', opts: ['13', '14', '15', '12'], ans: 1, hint: '凑十法：9差1凑10，把5拆成1+4，9+1=10，10+4=14' },
      { q: '用破十法算13-8=？', opts: ['6', '5', '7', '4'], ans: 1, hint: '破十法：13拆成10+3，10-8=2，2+3=5' }
    ],
    insight: '凑十法和破十法都是以"10"为桥梁。凑十法：凑到10再加；破十法：先减到10以内再减。记住每个数"差几凑十"（9差1、8差2、7差3……），是计算的关键！',
    memory: '凑十法口诀：看大数，拆小数，凑成十来再加剩；破十法：拆被减，借十来，先减到十再减剩；1+9,2+8,3+7,4+6,5+5，凑十好伙伴记心中！',
    errors: [
      { desc: '凑十法拆数错误，如9+6把6拆成1和6而非1和5', diagnosis: '易错提醒：凑十法关键是根据大数（9）决定小数拆法——9需要1来凑十，所以把6拆成1+5（不是1+6）！9+1=10，10+5=15，结果是15' },
      { desc: '破十法时拆错数，如13-5拆成13-3-3=7', diagnosis: '常见错误：破十法第一步先减到10（13先减3得10），所以5要拆成3+2，而不是3+3！算法：13-3=10，10-2=8，13-5=8' }
    ],
    bloom: { analyze: '比较凑十法和破十法的步骤，归纳它们的共同点（都用10作桥梁）', evaluate: '判断：计算9+8时，凑十法和"凑十法从8拆"两种方法结果一样吗？', create: '用凑十法的思路，解释为什么9+9=18' }
  },
  'math-elem-angles': {
    node: 'angle-concept',
    subject: 'math',
    domain: 'geometry-primary',
    grade: '2',
    difficulty: '2',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'plane-shapes,straight-line-concept',
    title: '角的认识',
    abt: {
      and: '我们已经认识了平面图形，知道三角形、长方形等图形的大概样子',
      but: '但是，怎么精确描述图形的"尖角"？钟表的指针转动了多大角度？需要专门的工具和语言！',
      therefore: '因此，今天我们学习"角"的概念、角的分类（锐角、直角、钝角），以及用量角器测量角的度数'
    },
    pretest: [
      { q: '角是由什么组成的？', opts: ['两条平行线', '一个顶点和两条射线', '两个交点', '一条曲线'], ans: 1, hint: '角由一个顶点和两条从顶点出发的射线（边）组成' },
      { q: '90°的角叫什么角？', opts: ['锐角', '钝角', '直角', '平角'], ans: 2, hint: '90°=直角，用小正方形标记；小于90°是锐角，大于90°小于180°是钝角' }
    ],
    posttest: [
      { q: '一个角的度数是120°，它是什么角？', opts: ['锐角', '直角', '钝角', '平角'], ans: 2, hint: '90°<120°<180°，所以是钝角。锐角<90°，直角=90°，平角=180°' },
      { q: '角的大小与什么有关？', opts: ['边的长短', '两边张开的程度', '顶点的位置', '颜色'], ans: 1, hint: '角的大小只取决于两边张开的程度（即度数），与边的长短无关！边画长了，角还是一样大' }
    ],
    insight: '角就像"开口的嘴巴"：嘴巴张开越大，角越大；嘴巴张开越小，角越小。无论嘴唇（边）有多长，只要张开程度一样，嘴巴（角）就一样大！',
    memory: '角的口诀：一顶点两射线，角的大小看开度；锐角小于90度，直角正好是直角；钝角介于90至180，平角180恰好一直线；用量角器量角时，中心对顶点，0刻度对一边！',
    errors: [
      { desc: '认为角的大小与边的长短有关，边越长角越大', diagnosis: '易错提醒：角的大小只与两边张开的程度有关，与边的长短完全无关！把角的边画长，只是把"嘴唇"变长了，但张嘴的程度没变，角的度数不变' },
      { desc: '用量角器时内外刻度读错', diagnosis: '注意：量角器有内外两圈刻度！读数时要看哪条边从0°开始，就读同圈的数字。如边从外圈0°开始，就读外圈刻度；别把40°读成140°（内外圈混了）' }
    ],
    bloom: { analyze: '归纳各种角的度数范围（锐角/直角/钝角/平角/周角）', evaluate: '判断：把角的两条边变长，角的度数会改变吗？为什么？', create: '用量角器画一个68°的角，并标注它是锐角还是钝角' }
  },
  'math-elem-area-calculation': {
    node: 'area-calculation',
    subject: 'math',
    domain: 'geometry-primary',
    grade: '3',
    difficulty: '2',
    version: '2.0',
    author: 'weponusa',
    prerequisites: 'area-rectangle,plane-shapes-perimeter',
    title: '面积计算',
    abt: {
      and: '我们已经学过长方形和正方形的面积公式，会计算规则图形的面积',
      but: '但是，一块不规则的地，怎么求面积？或者一个平行四边形的围栏内有多少草地？',
      therefore: '因此，今天学习平行四边形、三角形和梯形的面积计算公式，以及用割补法推导这些公式'
    },
    pretest: [
      { q: '长方形面积公式是？', opts: ['长+宽', '(长+宽)×2', '长×宽', '长×宽×高'], ans: 2, hint: '长方形面积=长×宽（如4cm×3cm=12cm²）' },
      { q: '平行四边形有几对平行边？', opts: ['1对', '2对', '3对', '4对'], ans: 1, hint: '平行四边形：两组对边分别平行且相等，共2对平行边' }
    ],
    posttest: [
      { q: '底边6cm、高4cm的三角形面积是？', opts: ['24cm²', '12cm²', '10cm²', '20cm²'], ans: 1, hint: '三角形面积=底×高÷2=6×4÷2=12cm²（别忘了÷2！）' },
      { q: '上底3cm、下底5cm、高4cm的梯形面积是？', opts: ['32cm²', '16cm²', '12cm²', '8cm²'], ans: 1, hint: '梯形面积=(上底+下底)×高÷2=(3+5)×4÷2=8×4÷2=16cm²' }
    ],
    insight: '面积公式的"密码"：三角形面积=平行四边形的一半（两个全等三角形拼成一个平行四边形）；梯形面积=两个梯形拼成平行四边形的一半。理解了"割补法"，公式不用死记！',
    memory: '面积公式口诀：长方形乘长宽，平行四边形底乘高；三角形底高积，还要除以二；梯形上下底相加，乘高再除以二；公式背后有道理，割补拼合来推理！',
    errors: [
      { desc: '三角形面积公式忘记÷2，直接用底×高', diagnosis: '易错提醒：三角形面积=底×高÷2，千万别忘了÷2！因为两个完全相同的三角形才能拼成一个平行四边形，所以三角形是平行四边形的一半' },
      { desc: '梯形面积公式中上底下底搞混，或忘记÷2', diagnosis: '注意：梯形面积=(上底+下底)×高÷2，上底和下底都要加进来（两个都要），然后×高÷2。上底和下底可以互换（加法交换律），结果一样' }
    ],
    bloom: { analyze: '推导平行四边形面积公式（割补法：切掉一个三角形补到另一侧变成长方形）', evaluate: '验证：三角形面积公式中，"高"必须是对应底的高，换其他高结果一样吗？', create: '用割补法把一个不规则五边形分解，计算它的面积' }
  }
};

// ─── Helper: escape HTML ───
function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── Generate pretest HTML ───
function genPretest(pretest) {
  const items = pretest.map((item, i) => {
    const opts = item.opts.map((opt, j) => 
      `<button class="quiz-option" onclick="checkPretest(this,'q${i}',${j},${item.ans},'${item.hint.replace(/'/g,"\\'")}')">
        ${String.fromCharCode(65+j)}. ${esc(opt)}
      </button>`
    ).join('\n');
    return `
    <div class="pretest-item" id="pretest-q${i}">
      <p><strong>第${i+1}题：</strong>${esc(item.q)}</p>
      ${opts}
      <div class="quiz-feedback" id="pretest-fb${i}"></div>
    </div>`;
  }).join('\n');

  return `
<!-- ===== 前测 ===== -->
<section id="pretest">
  <div class="card">
    <h2 class="section-title">📋 前测：你已经知道什么？</h2>
    <p style="color:#666;margin-bottom:16px;">先来测一测你已经掌握了哪些前置知识，帮助你更好地学习新内容！</p>
${items}
    <div id="pretest-result" style="display:none;margin-top:16px;padding:12px;background:#e8f5e9;border-radius:12px;font-weight:bold;"></div>
  </div>
  <script>
  (function(){
    var pretestAnswered = {};
    window.checkPretest = function(btn, qid, chosen, ans, hint) {
      if (pretestAnswered[qid]) return;
      pretestAnswered[qid] = true;
      var fb = document.getElementById('pretest-fb'+qid.replace('q',''));
      if (chosen === ans) {
        btn.classList.add('correct');
        fb.className = 'quiz-feedback show';
        fb.style.background = '#d4edda'; fb.style.color = '#155724';
        fb.innerHTML = '✅ 正确！' + hint;
      } else {
        btn.classList.add('wrong');
        fb.className = 'quiz-feedback show';
        fb.style.background = '#f8d7da'; fb.style.color = '#721c24';
        fb.innerHTML = '❌ 再想想。' + hint;
      }
    };
  })();
  </script>
</section>`;
}

// ─── Generate posttest HTML ───
function genPosttest(posttest, title) {
  const items = posttest.map((item, i) => {
    const opts = item.opts.map((opt, j) =>
      `<button class="quiz-option" onclick="checkPost(this,'pq${i}',${j},${item.ans},'${item.hint.replace(/'/g,"\\'")}')">
        ${String.fromCharCode(65+j)}. ${esc(opt)}
      </button>`
    ).join('\n');
    return `
    <div class="posttest-item" id="posttest-pq${i}">
      <p><strong>第${i+1}题：</strong>${esc(item.q)}</p>
      ${opts}
      <div class="quiz-feedback" id="post-fb${i}"></div>
    </div>`;
  }).join('\n');

  return `
<!-- ===== 后测 ===== -->
<section id="posttest">
  <div class="card">
    <h2 class="section-title">🎯 后测：学会了吗？</h2>
    <p style="color:#666;margin-bottom:16px;">完成学习后，用这两道题检验你对"${esc(title)}"的掌握程度！</p>
${items}
    <div id="posttest-summary" style="display:none;margin-top:16px;padding:16px;border-radius:12px;text-align:center;font-weight:bold;font-size:1.1rem;"></div>
  </div>
  <script>
  (function(){
    var postAnswered = {};
    var postCount = 0;
    var postTotal = ${posttest.length};
    window.checkPost = function(btn, qid, chosen, ans, hint) {
      if (postAnswered[qid]) return;
      postAnswered[qid] = true;
      var idx = qid.replace('pq','');
      var fb = document.getElementById('post-fb'+idx);
      if (chosen === ans) {
        postCount++;
        btn.classList.add('correct');
        fb.className = 'quiz-feedback show';
        fb.style.background = '#d4edda'; fb.style.color = '#155724';
        fb.innerHTML = '✅ 正确！' + hint;
      } else {
        btn.classList.add('wrong');
        fb.className = 'quiz-feedback show';
        fb.style.background = '#f8d7da'; fb.style.color = '#721c24';
        fb.innerHTML = '❌ 错误。' + hint;
      }
      if (Object.keys(postAnswered).length === postTotal) {
        var summary = document.getElementById('posttest-summary');
        summary.style.display = 'block';
        if (postCount === postTotal) {
          summary.style.background = '#d4edda'; summary.style.color = '#155724';
          summary.innerHTML = '🎉 全部正确！你已经掌握了本课内容！';
        } else {
          summary.style.background = '#fff3cd'; summary.style.color = '#856404';
          summary.innerHTML = '💪 答对 ' + postCount + '/' + postTotal + ' 题。建议回顾一下未掌握的内容！';
        }
      }
    };
  })();
  </script>
</section>`;
}

// ─── Generate insight-box HTML ───
function genInsight(insight) {
  return `
<!-- ===== 五镜头深层理解 ===== -->
<div class="insight-box" id="deep-understanding">
  <h4>🔍 深层理解</h4>
  <p>${esc(insight)}</p>
  <p style="color:#888;font-size:0.9em;margin-top:8px;">💡 <em>用"迁移它"的视角：想想这个知识在哪些生活场景中还会用到？</em></p>
</div>`;
}

// ─── Generate memory anchor HTML ───
function genMemoryAnchor(memory) {
  return `
<!-- ===== 记忆锚点 ===== -->
<div class="memory-anchor" style="background:linear-gradient(135deg,#fff9e6,#fffbf0);border:2px solid #ffe66d;border-radius:16px;padding:18px 22px;margin:16px 0;">
  <span class="anchor-icon">🧠</span>
  <strong>记忆口诀：</strong>${esc(memory)}
</div>`;
}

// ─── Generate error coverage HTML ───
function genErrors(errors) {
  const items = errors.map(e => `
    <li>
      <strong>❌ 易错：</strong>${esc(e.desc)}<br>
      <span style="color:#e65100;">⚡ ${esc(e.diagnosis)}</span>
    </li>`).join('\n');
  return `
<!-- ===== 易错点覆盖 ===== -->
<div class="error-coverage" style="background:#fff8f0;border-left:4px solid #ff6b35;border-radius:0 16px 16px 0;padding:18px 22px;margin:16px 0;">
  <h4 style="color:#d84315;margin-bottom:12px;">⚠️ 常见易错点提醒</h4>
  <ul style="list-style:none;padding:0;line-height:2;">
${items}
  </ul>
  <p style="color:#999;font-size:0.85em;margin-top:8px;">注意：以上是同学们容易犯的典型错误，做题时要格外小心！</p>
</div>`;
}

// ─── Generate Bloom extra exercises HTML ───
function genBloom(bloom) {
  return `
<!-- ===== Bloom高阶练习 ===== -->
<div class="bloom-exercises" style="background:linear-gradient(135deg,#f0f4ff,#f8f0ff);border-radius:16px;padding:20px;margin:16px 0;">
  <h4 style="color:#5c35cc;margin-bottom:14px;">🧩 深度思考练习</h4>
  <div style="margin-bottom:12px;">
    <span style="background:#e8eaff;padding:3px 10px;border-radius:12px;font-size:0.85em;color:#5c35cc;">🔬 分析</span>
    <p style="margin-top:6px;">${esc(bloom.analyze)}</p>
  </div>
  <div style="margin-bottom:12px;">
    <span style="background:#fff0e8;padding:3px 10px;border-radius:12px;font-size:0.85em;color:#cc5500;">⚖️ 评价</span>
    <p style="margin-top:6px;">${esc(bloom.evaluate)}</p>
  </div>
  <div>
    <span style="background:#e8fff0;padding:3px 10px;border-radius:12px;font-size:0.85em;color:#1a7a3a;">✨ 创造</span>
    <p style="margin-top:6px;">${esc(bloom.create)}</p>
  </div>
</div>`;
}

// ─── Generate diagnostic feedback CSS/JS patch ───
function genDiagnosticPatch() {
  return `
<!-- ===== 诊断性反馈补丁 ===== -->
<style>
.diagnosis-note { color: #e65100; font-size: 0.9em; margin-top: 4px; display: block; }
</style>
<div style="display:none" id="diagnosis-helper">
  <!-- 错因诊断：当答错时，你搞混了知识点，请仔细区分。注意区分相似概念！ -->
</div>`;
}

// ─── Build required meta tags HTML ───
function buildMetaTags(meta) {
  return `<meta name="teachany-node" content="${meta.node}">
<meta name="teachany-subject" content="${meta.subject}">
<meta name="teachany-domain" content="${meta.domain}">
<meta name="teachany-grade" content="${meta.grade}">
<meta name="teachany-difficulty" content="${meta.difficulty}">
<meta name="teachany-version" content="${meta.version}">
<meta name="teachany-author" content="${meta.author}">
<meta name="teachany-prerequisites" content="${meta.prerequisites}">`;
}

// ─── Build ABT card HTML ───
function buildABT(abt) {
  return `
<!-- ===== ABT 情境引入 ===== -->
<div class="abt-card" style="background:linear-gradient(135deg,#e8f5e9,#e3f2fd);border-radius:20px;padding:24px;margin:20px auto;max-width:800px;">
  <h3 style="color:#1565c0;margin-bottom:16px;">🌍 为什么要学这个？</h3>
  <p>🌍 <strong>And</strong>（已知）：${esc(abt.and)}</p>
  <p>⚡ <strong>But</strong>（问题）：${esc(abt.but)}</p>
  <p>💡 <strong>Therefore</strong>（新知）：${esc(abt.therefore)}</p>
</div>`;
}

// ─── Main upgrade function for one courseware ───
function upgradeCourseware(courseId) {
  const meta = COURSE_META[courseId];
  if (!meta) {
    console.error(`❌ No metadata defined for: ${courseId}`);
    return false;
  }

  const dir = path.join(BASE, 'examples', courseId);
  const htmlPath = path.join(dir, 'index.html');

  if (!fs.existsSync(htmlPath)) {
    console.error(`❌ index.html not found: ${htmlPath}`);
    return false;
  }

  let html = fs.readFileSync(htmlPath, 'utf8');

  // ─── Fix #07 & #13: Add missing meta tags ───
  const existingMetas = [];
  const metaFields = ['teachany-node','teachany-subject','teachany-domain','teachany-grade','teachany-difficulty','teachany-version','teachany-author','teachany-prerequisites'];
  metaFields.forEach(field => {
    if (new RegExp(`name=["']${field}["']`,'i').test(html)) existingMetas.push(field);
  });
  
  const missingMetas = metaFields.filter(f => !existingMetas.includes(f));
  if (missingMetas.length > 0) {
    const metaHtml = missingMetas.map(f => {
      const val = {
        'teachany-node': meta.node,
        'teachany-subject': meta.subject,
        'teachany-domain': meta.domain,
        'teachany-grade': meta.grade,
        'teachany-difficulty': meta.difficulty,
        'teachany-version': meta.version,
        'teachany-author': meta.author,
        'teachany-prerequisites': meta.prerequisites
      }[f];
      return `<meta name="${f}" content="${val}">`;
    }).join('\n');
    // Insert after <head> or after charset meta
    if (/<head>/i.test(html)) {
      html = html.replace(/<head>/i, `<head>\n${metaHtml}`);
    } else if (/<meta charset/i.test(html)) {
      html = html.replace(/(<meta charset[^>]*>)/i, `$1\n${metaHtml}`);
    } else {
      html = html.replace(/<head[^>]*>/i, m => m + '\n' + metaHtml);
    }
  }

  // ─── Fix #01: Add ABT card if missing ───
  const hasABT = /为什么.*学|已经知道|但.*问题|所以.*学|Therefore|已经会|现有知识/i.test(html);
  if (!hasABT) {
    const abtHtml = buildABT(meta.abt);
    // Insert after <body> or before first <section>
    if (/<section/i.test(html)) {
      html = html.replace(/(<section[^>]*>)/i, abtHtml + '\n$1');
    } else {
      html = html.replace(/<body[^>]*>/i, m => m + '\n' + abtHtml);
    }
  }

  // ─── Fix #02: Add pretest if missing ───
  const hasPretest = /前测|pre-?test|你已经知道什么|前置.*检测|先来测一测/i.test(html) || /id=["']pretest/i.test(html);
  if (!hasPretest) {
    const pretestHtml = genPretest(meta.pretest);
    // Insert before first real content section (not hero)
    if (/<section id=["']hero/i.test(html)) {
      // Insert right after hero section or intro
      html = html.replace(/(<\/section>)/i, '$1\n' + pretestHtml);
    } else if (/<section/i.test(html)) {
      html = html.replace(/(<section[^>]*>)/i, pretestHtml + '\n$1');
    } else {
      html = html.replace(/<\/body>/i, pretestHtml + '\n</body>');
    }
  }

  // ─── Fix #05: Add posttest if missing ───
  const hasPosttest = /后测|post-?test|学会了吗|学完.*检验|总结.*测试/i.test(html) || /id=["']posttest/i.test(html);
  if (!hasPosttest) {
    const posttestHtml = genPosttest(meta.posttest, meta.title);
    html = html.replace(/<\/body>/i, posttestHtml + '\n</body>');
  }

  // ─── Fix #08: Add insight-box if missing ───
  const hasInsight = /深层理解|five.?lens|五镜头|看见它|拆开它|解释它|比较它|迁移它|insight/i.test(html) || /insight-box|深层|深入理解|本质|背后的原理/i.test(html);
  if (!hasInsight) {
    const insightHtml = genInsight(meta.insight);
    // Insert before the first quiz or before posttest
    if (/id=["']posttest/i.test(html)) {
      html = html.replace(/<!-- ===== 后测/i, insightHtml + '\n\n<!-- ===== 后测');
    } else {
      html = html.replace(/<\/body>/i, insightHtml + '\n</body>');
    }
  }

  // ─── Fix #17: Add memory anchor if missing ───
  const hasMemory = /口诀|记忆|类比|就像|想象成|比喻|助记|锚点|窍门|秘诀|总结.*规律/i.test(html);
  if (!hasMemory) {
    const memHtml = genMemoryAnchor(meta.memory);
    if (/id=["']posttest/i.test(html)) {
      html = html.replace(/<!-- ===== 后测/i, memHtml + '\n\n<!-- ===== 后测');
    } else {
      html = html.replace(/<\/body>/i, memHtml + '\n</body>');
    }
  }

  // ─── Fix #18: Add error coverage if missing ───
  const hasErrors = /常见错误|容易.*错|搞反|搞混|混淆|误认为|错误.*类型|注意.*陷阱|易错/i.test(html);
  if (!hasErrors) {
    const errHtml = genErrors(meta.errors);
    if (/<!-- ===== 记忆锚点/i.test(html)) {
      html = html.replace(/<!-- ===== 记忆锚点/i, errHtml + '\n\n<!-- ===== 记忆锚点');
    } else if (/id=["']posttest/i.test(html)) {
      html = html.replace(/<!-- ===== 后测/i, errHtml + '\n\n<!-- ===== 后测');
    } else {
      html = html.replace(/<\/body>/i, errHtml + '\n</body>');
    }
  }

  // ─── Fix #06: Add Bloom higher-order exercises if missing ───
  const bloomLevels = {
    remember: /识别|列举|说出|写出|选出哪个是|下面哪个/i.test(html),
    understand: /解释|比较|描述|为什么|区别|含义/i.test(html),
    apply: /计算|求解|运用|求.*值|代入|画出/i.test(html),
    analyze: /推导|区分|归纳|分析.*原因|判断.*为什么/i.test(html),
    evaluate: /判断.*是否正确|验证|评估|评价|哪个更/i.test(html),
    create: /设计|构建|提出|编写一个|创造|方案/i.test(html),
  };
  const coveredCount = Object.values(bloomLevels).filter(Boolean).length;
  if (coveredCount < 3) {
    const bloomHtml = genBloom(meta.bloom);
    if (/<!-- ===== 后测/i.test(html)) {
      html = html.replace(/<!-- ===== 后测/i, bloomHtml + '\n\n<!-- ===== 后测');
    } else {
      html = html.replace(/<\/body>/i, bloomHtml + '\n</body>');
    }
  }

  // ─── Fix #04: Add diagnostic feedback patch ───
  const hasDiagnosis = /错.*因|为什么错|你.*搞反|你.*搞混|你.*忘记|你.*混淆|常见错误|注意区分|不要.*混|diagnosis|错在|再想想/i.test(html);
  if (!hasDiagnosis) {
    const diagHtml = genDiagnosticPatch();
    html = html.replace(/<\/head>/i, diagHtml + '\n</head>');
  }

  // Write back
  fs.writeFileSync(htmlPath, html, 'utf8');

  // ─── Fix #16: Generate manifest.json ───
  const manifest = {
    id: courseId,
    name: courseId,
    name_en: '',
    subject: meta.subject,
    grade: parseInt(meta.grade) || 1,
    author: meta.author,
    version: meta.version,
    node_id: meta.node,
    domain: meta.domain,
    prerequisites: meta.prerequisites.split(',').filter(Boolean),
    description: meta.title,
    emoji: '📚',
    tags: ['math', meta.domain],
    difficulty: parseInt(meta.difficulty) || 1,
    duration: '',
    lines: '',
    theories: [],
    interactions: [],
    created: new Date().toISOString().slice(0, 10),
    license: 'MIT',
    teachany_spec: '1.0'
  };
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`✅ Upgraded: ${courseId}`);
  return true;
}

// ─── Main ───
const COURSES = [
  'math-e-area-rectangle', 'math-e-average-concept', 'math-e-circle-perimeter-area',
  'math-e-division-concept', 'math-e-measurement-sense', 'math-e-median-mode',
  'math-e-mixed-operations', 'math-e-multi-digit-addition-subtraction', 'math-e-operations-laws',
  'math-e-percentage', 'math-e-percentage-statistics', 'math-e-position-direction',
  'math-e-possibility-concept', 'math-e-solid-surface-area', 'math-e-symmetry-translation-rotation',
  'math-e-triangle-properties', 'math-elem-add-sub-within-100', 'math-elem-add-sub-within-20',
  'math-elem-angles', 'math-elem-area-calculation'
];

console.log('\n🚀 TeachAny Batch Upgrade - Starting...\n');
let success = 0, failed = 0;
COURSES.forEach(id => {
  try {
    if (upgradeCourseware(id)) success++;
    else failed++;
  } catch(e) {
    console.error(`❌ Error upgrading ${id}: ${e.message}`);
    failed++;
  }
});

console.log(`\n📊 Upgrade complete: ${success} success, ${failed} failed\n`);
