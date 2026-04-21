#!/usr/bin/env node
/**
 * TeachAny 课件升级脚本 - 第3批（20个课件）
 * 补充：#01 ABT引入、#02 前测、#05 后测、#11 前置知识链、#17 记忆锚点、#18 易错点
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'examples');

// 每个课件的升级配置
const COURSES = {
  'math-elem-multi-digit-multiply': {
    title: '多位数乘法',
    prerequisites: 'multiplication-table,numbers-within-10000',
    abtWhy: '我们已经会用乘法口诀算一位数乘法（And），但遇到23×12这样的多位数时就卡住了（But），所以我们需要学习竖式乘法来解决更复杂的计算！（Therefore）',
    pretest: [
      { q: '7×8等于多少？', opts: ['54','56','63','48'], ans: 1, explain: '7×8=56，来自乘法口诀"七八五十六"' },
      { q: '23可以拆成哪两个数？', opts: ['20和3','2和3','20和30','10和13'], ans: 0, explain: '23=20+3，十位是2个十，个位是3个一' }
    ],
    posttest: [
      { q: '23×12的结果是多少？', opts: ['256','276','286','246'], ans: 1, explain: '23×12=23×2+23×10=46+230=276' },
      { q: '计算45×13，下面哪步是错的？', opts: ['45×3=135','45×10=450','135+450=585','以上都正确'], ans: 3, explain: '45×13=45×3+45×10=135+450=585，每步都正确' }
    ],
    memoryAnchor: '记忆口诀：个位乘个位，十位错一位，最后相加别忘了！助记：先算"小的"，再算"大的"，错位对齐加一加。',
    errorNote: '易错提醒：①错位对齐是关键，十位乘完结果要向左移一位；②进位不要漏掉；③常见错误：23×12=23×2+23×2（忘记十位是×10不是×2）',
    errorNodeId: 'multi-digit-multiplication'
  },
  'math-elem-multiplication-table': {
    title: '九九乘法表',
    prerequisites: 'numbers-within-100,addition-subtraction-within-20',
    abtWhy: '我们已经会把相同的数连续相加（And），但每次算3+3+3+3很麻烦（But），所以我们学习乘法口诀，一秒记住所有答案！（Therefore）',
    pretest: [
      { q: '3+3+3等于多少？', opts: ['6','9','12','8'], ans: 1, explain: '3+3+3=9，三个3相加等于9' },
      { q: '5个2相加是多少？', opts: ['7','10','12','8'], ans: 1, explain: '2+2+2+2+2=10，5个2是10' }
    ],
    posttest: [
      { q: '根据乘法口诀"六七四十二"，6×7=？', opts: ['35','42','48','36'], ans: 1, explain: '六七四十二，所以6×7=42' },
      { q: '9×6=？（口诀：九六五十四）', opts: ['54','56','63','45'], ans: 0, explain: '九六五十四，9×6=54' }
    ],
    memoryAnchor: '记忆口诀表：一一得一，一二得二…九九八十一。助记法：对角线都是完全平方数（1,4,9,16,25,36,49,64,81），记住规律背起来更快！秘诀：大数×小数换顺序背，如8×3=3×8=24',
    errorNote: '易错提醒：①6×7和7×6记混（结果相同但口诀不同）；②常见错误：6×8=46（正确是48，六八四十八）；③口诀中"得"字前是积，如"三四十二"不是"得十二"',
    errorNodeId: 'multiplication-table'
  },
  'math-elem-negative-numbers': {
    title: '负数的认识',
    prerequisites: 'numbers-within-10000,addition-subtraction-within-100',
    abtWhy: '我们已经认识了正数，能表示很多事物（And），但温度零下5度、欠钱5元这些情况，正数无法表示（But），所以我们引入负数来表达比零还小的量！（Therefore）',
    pretest: [
      { q: '温度计上比0℃还冷的温度怎么表示？', opts: ['用很小的正数','用负数','无法表示','用分数'], ans: 1, explain: '比0℃低的温度用负数表示，如零下5摄氏度写作-5℃' },
      { q: '正3和负3哪个大？', opts: ['正3大','负3大','一样大','不能比较'], ans: 0, explain: '正数大于负数，+3>-3' }
    ],
    posttest: [
      { q: '-5和-3哪个小？', opts: ['-5小','-3小','一样小','不能比较'], ans: 0, explain: '在数轴上-5在-3左边，所以-5<-3，-5更小' },
      { q: '在数轴上，-2在哪里？', opts: ['0右边2格','0左边2格','与2重合','无法表示'], ans: 1, explain: '负数在数轴0的左边，-2在0左边2格的位置' }
    ],
    memoryAnchor: '记忆口诀：正数在右，负数在左，零在中央。助记：温度计就是竖着的数轴，零度以下是负数，越往下越冷数越小。口诀：左小右大，零为界线，负号表示反方向。',
    errorNote: '易错提醒：①混淆负数大小：-5不比-3大，数轴左边的数小；②常见错误：以为-5>-3（错！负数绝对值越大，数越小）；③负号不是减号，-3读作"负三"不是"减三"',
    errorNodeId: 'negative-numbers'
  },
  'math-elem-number-recognition': {
    title: '数的认识',
    prerequisites: '',
    abtWhy: '我们在生活中到处都能看到数字（And），但不知道怎么数数和比大小（But），所以我们先认识1到10这些最基本的数，打好数学的地基！（Therefore）',
    pretest: [
      { q: '下面哪个数字表示"五"？', opts: ['3','5','8','7'], ans: 1, explain: '5就是表示五的数字' },
      { q: '3和7哪个大？', opts: ['3大','7大','一样大','不能比较'], ans: 1, explain: '7>3，7比3大' }
    ],
    posttest: [
      { q: '按从小到大排列：5、2、8、1', opts: ['1,2,5,8','8,5,2,1','2,1,5,8','5,2,1,8'], ans: 0, explain: '从小到大：1<2<5<8' },
      { q: '数一数：🌟🌟🌟🌟🌟，一共几颗星？', opts: ['4','5','6','3'], ans: 1, explain: '数一数：1,2,3,4,5，一共5颗星' }
    ],
    memoryAnchor: '记忆口诀：1像铅笔细又长，2像鸭子水中游，3像耳朵听声音，4像小旗迎风飘，5像钩子来钓鱼，6像哨子吹一吹，7像镰刀割庄稼，8像麻花扭一扭，9像气球拿绳子，10像铅笔加鸡蛋。助记：用手指数数，配合儿歌记忆。',
    errorNote: '易错提醒：①数字6和9容易搞反，记住6像哨子，9像气球；②0也是数，表示一个也没有；③常见错误：写数时写反（镜像），要注意笔画方向',
    errorNodeId: 'numbers-within-10'
  },
  'math-elem-numbers-within-100': {
    title: '100以内数的认识',
    prerequisites: 'numbers-within-20,numbers-within-10',
    abtWhy: '我们已经会数20以内的数了（And），但超市里商品价格、班级人数这些数字往往比20大（But），所以我们要学习100以内的数，认识十位和个位！（Therefore）',
    pretest: [
      { q: '数字35中，3在哪个数位？', opts: ['个位','十位','百位','千位'], ans: 1, explain: '35中，3在十位，5在个位' },
      { q: '20以内最大的数是多少？', opts: ['19','20','18','21'], ans: 1, explain: '20以内最大的数是20（包含20）' }
    ],
    posttest: [
      { q: '68的十位数字是几？表示多少？', opts: ['8个十','6个十','8个一','6个一'], ans: 1, explain: '68十位是6，表示6个十，即60' },
      { q: '比56大，比60小的数有哪些？', opts: ['57,58,59','55,56,57','60,61,62','54,55,56'], ans: 0, explain: '56<57<58<59<60，所以57、58、59在56和60之间' }
    ],
    memoryAnchor: '记忆口诀：十位表示多少个十，个位表示多少个一。助记：35=3个十+5个一=30+5。口诀：高位是几十，低位是几一，合起来就是这个数。记住：百以内数都由十位和个位组成。',
    errorNote: '易错提醒：①混淆十位和个位：35中3是十位不是个位；②常见错误：认为35中3表示3个一（错！3在十位表示3个十=30）；③位值原理：同一数字位置不同含义不同',
    errorNodeId: 'numbers-within-100'
  },
  'math-elem-numbers-within-10000': {
    title: '万以内数的认识',
    prerequisites: 'numbers-within-100,numbers-within-1000',
    abtWhy: '我们已经认识了千以内的数（And），但学校有2000多名学生、城市有几万人口，这些数字怎么表示呢？（But），所以我们要学习万以内数，掌握万位！（Therefore）',
    pretest: [
      { q: '1000里面有多少个100？', opts: ['10个','100个','1000个','1个'], ans: 0, explain: '1000=10×100，所以有10个100' },
      { q: '999的下一个整数是什么？', opts: ['1000','9999','998','9990'], ans: 0, explain: '999+1=1000，999的下一个整数是1000' }
    ],
    posttest: [
      { q: '3456中，千位数字是几，表示多少？', opts: ['3,3000','4,400','5,50','6,6'], ans: 0, explain: '3456中，千位是3，表示3个千=3000' },
      { q: '最大的四位数是多少？', opts: ['9999','1000','9000','10000'], ans: 0, explain: '四位数最大是9999（每位都是9）' }
    ],
    memoryAnchor: '记忆口诀：个十百千万，从右往左数。助记：3456=3千+4百+5十+6一=3000+400+50+6。口诀：数位顺序歌——个位十位百千万，从右数起要记牢！记住：每高一位是低一位的10倍。',
    errorNote: '易错提醒：①写数时中间有0要写上：如一千零五写1005不是15；②常见错误：读数时0的读法——1003读"一千零三"，不能读"一千三"；③万以内数位顺序：个十百千（从右到左）',
    errorNodeId: 'numbers-within-10000'
  },
  'math-elem-numbers-within-20': {
    title: '20以内数的认识',
    prerequisites: 'numbers-within-10,number-recognition',
    abtWhy: '我们已经认识了1到10（And），但买东西需要找零，比10大的数怎么数呢？（But），所以我们要学习11到20，认识"十"和"几"的组合！（Therefore）',
    pretest: [
      { q: '10以内最大的数是？', opts: ['9','10','8','11'], ans: 1, explain: '10以内最大的数是10' },
      { q: '10和3合起来是多少？', opts: ['30','103','13','7'], ans: 2, explain: '10+3=13，十和三合起来是十三' }
    ],
    posttest: [
      { q: '15是几个十和几个一？', opts: ['1个十5个一','5个十1个一','15个十','1个一5个十'], ans: 0, explain: '15=1个十+5个一，十位是1，个位是5' },
      { q: '从11到20共有几个数？', opts: ['9个','10个','11个','20个'], ans: 1, explain: '11,12,13,14,15,16,17,18,19,20共10个数' }
    ],
    memoryAnchor: '记忆口诀：十一、十二、十三……记住"十"加"几"就是"十几"！助记：用小棒帮助记忆，1捆（10根）加散的几根=十几。口诀：一捆加零头，就是十几数；满了二十，就用2个十来表示。',
    errorNote: '易错提醒：①混淆11和12的写法；②常见错误：认为11=1+1=2（错！11是十位1个十加个位1个一）；③数数时跳数：12数成13，要一个一个数清楚',
    errorNodeId: 'addition-subtraction-within-20'
  },
  'math-elem-perimeter': {
    title: '周长',
    prerequisites: 'plane-shapes,length-units',
    abtWhy: '我们已经认识了各种平面图形（And），但如果要给花坛围一圈栅栏，需要多少材料呢？（But），所以我们学习周长——把图形一圈的总长度加起来！（Therefore）',
    pretest: [
      { q: '正方形有几条边？', opts: ['3条','4条','5条','6条'], ans: 1, explain: '正方形有4条相等的边' },
      { q: '什么是"封闭图形"？', opts: ['有缺口的图形','首尾相接没有缺口的图形','三角形','圆形'], ans: 1, explain: '封闭图形是边首尾相接、没有缺口的图形，如正方形、三角形等' }
    ],
    posttest: [
      { q: '长4cm宽3cm的长方形，周长是多少？', opts: ['7cm','12cm','14cm','24cm'], ans: 2, explain: '长方形周长=(长+宽)×2=(4+3)×2=14cm' },
      { q: '边长5cm的正方形，周长是多少？', opts: ['15cm','20cm','25cm','10cm'], ans: 1, explain: '正方形周长=边长×4=5×4=20cm' }
    ],
    memoryAnchor: '记忆口诀：长方形周长=(长+宽)×2；正方形周长=边长×4。助记：想象蚂蚁爬一圈边，走完所有边的总距离就是周长。口诀："长加宽，乘以二，长方周长记牢里；四边等长是正方，边长乘四是周长。"',
    errorNote: '易错提醒：①混淆周长和面积：周长是"线"的总长，面积是"面"的大小；②常见错误：长方形周长=(长+宽)忘乘2；③单位不统一就计算，要先换算成相同单位',
    errorNodeId: 'perimeter'
  },
  'math-elem-pictograph': {
    title: '象形统计图',
    prerequisites: 'numbers-within-100,data-collection-chart',
    abtWhy: '我们已经会收集和整理数据（And），但一堆数字不直观，很难快速看出谁多谁少（But），所以我们用象形统计图——用图案代替数字，一眼看出数量！（Therefore）',
    pretest: [
      { q: '什么是统计图？', opts: ['用图形表示数量的图','美术画','地图','数字表格'], ans: 0, explain: '统计图用图形直观表示数量，便于比较和分析' },
      { q: '如果🍎代表5个苹果，3个🍎代表几个苹果？', opts: ['3个','8个','15个','53个'], ans: 2, explain: '3个图案×每个代表5=15个苹果' }
    ],
    posttest: [
      { q: '象形图中每个📚代表2本书，图中有4个📚，共几本书？', opts: ['4本','6本','8本','2本'], ans: 2, explain: '4个图案×2=8本书' },
      { q: '看象形图的第一步是什么？', opts: ['直接数图案数量','先看图例——每个图案代表几','画图案','比大小'], ans: 1, explain: '看象形图必须先看图例，知道每个图案代表的数量，才能正确读图' }
    ],
    memoryAnchor: '记忆口诀：看图三步走——①先看图例（每图代几）②数图案数量③用乘法算总数。助记：象形图=图案×每个代表的数，就像计算"有几袋，每袋几个"一样。',
    errorNote: '易错提醒：①忽略图例直接数图案数量（错！一定要看每个图案代表几）；②常见错误：半个图案的处理——半个图案代表一半数量；③比较时要算出实际数量再比，不能只看图案多少',
    errorNodeId: 'data-collection-chart'
  },
  'math-elem-pie-chart': {
    title: '扇形统计图',
    prerequisites: 'fraction-concept,ratio-proportion,possibility-concept',
    abtWhy: '我们已经学会了折线图和条形图（And），但要表示各部分占总体的比例关系时，这些图形不够直观（But），所以我们学习扇形图——用扇形面积展示每部分的百分比！（Therefore）',
    pretest: [
      { q: '百分之五十（50%）表示什么？', opts: ['50个','一半','50倍','五十分之一'], ans: 1, explain: '50%=50/100=1/2，表示一半' },
      { q: '圆的一圈是多少度？', opts: ['180°','270°','360°','90°'], ans: 2, explain: '一个完整的圆是360度' }
    ],
    posttest: [
      { q: '扇形图中某扇形占圆的25%，对应圆心角是多少度？', opts: ['25°','45°','90°','180°'], ans: 2, explain: '360°×25%=90°，25%对应90度圆心角' },
      { q: '看扇形图：语文40%，数学35%，英语25%，哪科比例最大？', opts: ['数学','英语','语文','一样大'], ans: 2, explain: '40%>35%>25%，语文占比最大' }
    ],
    memoryAnchor: '记忆口诀：扇形图显示比例，各扇形加起来是100%（整圆360°）。助记：把圆饼切开，每块大小代表该类别占总体的比例。口诀：百分比×360°=对应圆心角。扇形越大，比例越高。',
    errorNote: '易错提醒：①所有扇形百分比之和必须等于100%；②常见错误：看图时误读百分比（要看标注，不要估算）；③混淆条形图和扇形图——条形比绝对量，扇形比相对比例',
    errorNodeId: 'data-collection-chart'
  },
  'math-elem-plane-shapes': {
    title: '平面图形',
    prerequisites: 'number-recognition,position-direction',
    abtWhy: '我们的生活中到处都是形状（And），但面对各种图形，我们不知道它们叫什么、有什么特点（But），所以我们来认识基本平面图形——三角形、正方形、长方形和圆！（Therefore）',
    pretest: [
      { q: '下面哪个是三角形？', opts: ['有3条边的图形','有4条边的图形','圆形','没有角的图形'], ans: 0, explain: '三角形有3条边、3个角' },
      { q: '正方形的四条边有什么特点？', opts: ['长短不等','全部相等','两长两短','只有两条平行'], ans: 1, explain: '正方形四条边全部相等，四个角都是直角' }
    ],
    posttest: [
      { q: '长方形有几条边？几个角？', opts: ['3边3角','4边4角','5边5角','6边6角'], ans: 1, explain: '长方形有4条边、4个直角，对边相等' },
      { q: '圆有几条边？几个角？', opts: ['1条边0个角','没有直线边也没有角','4条边4个角','无数条边'], ans: 1, explain: '圆是曲线图形，没有直线边，也没有角' }
    ],
    memoryAnchor: '记忆口诀：三角三边三个角，正方四边全相等，长方对边两两等，圆圆没边没有角。助记：用手比划——三角形像山峰，正方形像窗户，长方形像课桌，圆形像皮球。',
    errorNote: '易错提醒：①混淆正方形和长方形——正方形是特殊的长方形，四边都相等；②常见错误：认为长方形没有直角（错！长方形四个角都是直角）；③菱形和正方形的区别：菱形四边等长但角不一定是直角',
    errorNodeId: 'plane-shapes'
  },
  'math-elem-possibility': {
    title: '可能性',
    prerequisites: 'fraction-concept,numbers-within-100',
    abtWhy: '我们每天都在猜测事情会不会发生（And），但"可能""不可能""一定"这些概念有时让我们困惑（But），所以我们学习可能性——用数学方式量化事件发生的可能程度！（Therefore）',
    pretest: [
      { q: '掷骰子，出现7点的可能性是？', opts: ['很大','很小','没有可能','一定会'], ans: 2, explain: '骰子只有1-6点，不可能出现7点，可能性为0' },
      { q: '"太阳从东边升起"的可能性是？', opts: ['不可能','可能','一定','不一定'], ans: 2, explain: '太阳必定从东边升起，这是确定事件，可能性为1（100%）' }
    ],
    posttest: [
      { q: '袋中有3个红球2个蓝球，随机摸一个是红球的可能性大还是蓝球大？', opts: ['红球大','蓝球大','一样大','无法判断'], ans: 0, explain: '红球3个比蓝球2个多，摸到红球的可能性更大（3/5>2/5）' },
      { q: '可能性用分数表示，0到1之间，1代表什么？', opts: ['不可能','可能','一定发生','不确定'], ans: 2, explain: '可能性=1表示该事件一定发生（100%确定）' }
    ],
    memoryAnchor: '记忆口诀：不可能=0，一定发生=1，可能发生在0到1之间。助记：可能性越接近1越"有把握"，越接近0越"没希望"。口诀："确定事件等于一，不可能事件等于零，其余事件在中间。"',
    errorNote: '易错提醒：①"可能"不等于"一定"：可能发生的事也可能不发生；②常见错误：把"不太可能"理解为"不可能"（有区别！）；③可能性大的事件不一定每次都发生，只是从长期来看出现频率更高',
    errorNodeId: 'possibility-concept'
  },
  'math-elem-ratio-proportion': {
    title: '比和比例',
    prerequisites: 'fraction-concept,division-concept,decimal-operations',
    abtWhy: '我们已经学了分数和除法（And），但怎么描述"1杯橙汁兑3杯水"这种比较关系呢？（But），所以我们学习"比"——直接表达两个量之间的倍数关系！（Therefore）',
    pretest: [
      { q: '6÷2=3，可以说6是2的几倍？', opts: ['2倍','3倍','6倍','1/2倍'], ans: 1, explain: '6÷2=3，所以6是2的3倍' },
      { q: '1/2和0.5相等吗？', opts: ['相等','不相等','不知道','有时相等'], ans: 0, explain: '1/2=0.5，分数和小数可以互相转化' }
    ],
    posttest: [
      { q: '3:4化简成最简比是什么？', opts: ['1:2','3:4（已是最简）','6:8','9:12'], ans: 1, explain: '3和4的最大公因数是1，所以3:4已是最简比' },
      { q: '如果a:b=2:3，且a=4，则b=？', opts: ['3','6','8','2'], ans: 1, explain: '2:3=4:b，交叉相乘：2b=12，b=6' }
    ],
    memoryAnchor: '记忆口诀：比=前项÷后项，比值是商。助记：3:4读作"3比4"，比值=3÷4=0.75。化简比=÷公因数。比例：a:b=c:d 等价于 a×d=b×c（交叉相乘）。口诀："外项积等内项积，比例关系记心里。"',
    errorNote: '易错提醒：①比和比值的区别：3:4是比，0.75是比值（数）；②常见错误：化简3:6时约成1:2（正确），但漏算单位（有单位的比化简前先统一单位）；③比例的解法：用交叉相乘法，别用除法凑',
    errorNodeId: 'ratio-proportion'
  },
  'math-elem-simple-equation': {
    title: '简单方程',
    prerequisites: 'four-operations-laws,numbers-within-10000',
    abtWhy: '我们已经会做加减乘除（And），但"某数加5等于12，某数是多少"这类问题用算术很费力（But），所以我们学方程——用字母代表未知数，列式子解题！（Therefore）',
    pretest: [
      { q: 'x+5=12，x等于多少？', opts: ['5','7','12','17'], ans: 1, explain: 'x=12-5=7，两边各减5' },
      { q: '方程中的"x"代表什么？', opts: ['字母x','乘号','未知数','数字10'], ans: 2, explain: 'x是方程中的未知数，代表我们要求的那个数' }
    ],
    posttest: [
      { q: '解方程：3x=18，x=？', opts: ['3','6','15','21'], ans: 1, explain: '3x=18，两边÷3，x=18÷3=6' },
      { q: '列方程：小明有x本书，给了弟弟5本后还剩8本，方程是？', opts: ['x+5=8','x-5=8','5x=8','x÷5=8'], ans: 1, explain: '给出5本后剩8本：x-5=8，x=13' }
    ],
    memoryAnchor: '记忆口诀：方程两边同加同减，等式不变；同乘同除（不为0），等式不变。助记：天平保持平衡——左边加重，右边也要加同样重量。口诀："等式两边同操作，平衡不变可解x；移项要变号，验算别忘记。"',
    errorNote: '易错提醒：①移项忘记变号：x+5=12→x=12-5（+5移到右边变-5）；②常见错误：3x=18÷3=6（错！应该3x÷3=18÷3，即x=6）；③验算要代回原方程：把解出的x代入原方程检验',
    errorNodeId: 'algebraic-expressions'
  },
  'math-elem-solid-shapes': {
    title: '立体图形',
    prerequisites: 'plane-shapes,number-recognition',
    abtWhy: '我们认识了平面图形（And），但真实世界的物体是立体的——魔方、球、罐头都不是平面的（But），所以我们来认识立体图形——长方体、正方体、圆柱和球！（Therefore）',
    pretest: [
      { q: '下面哪个是立体图形？', opts: ['正方形','圆形','正方体','三角形'], ans: 2, explain: '正方体是立体图形，有长、宽、高三个维度，正方形是平面图形' },
      { q: '乒乓球是哪种立体图形？', opts: ['长方体','圆柱','球（球体）','正方体'], ans: 2, explain: '乒乓球是球体（球形），各方向一样圆' }
    ],
    posttest: [
      { q: '长方体有几个面、几条棱、几个顶点？', opts: ['4面4棱4顶','6面12棱8顶','6面8棱12顶','4面12棱8顶'], ans: 1, explain: '长方体：6个面，12条棱，8个顶点' },
      { q: '圆柱有几个底面？底面是什么形状？', opts: ['1个圆形底面','2个圆形底面','0个底面','1个长方形底面'], ans: 1, explain: '圆柱有2个圆形底面（上底和下底），1个侧面（弯曲面）' }
    ],
    memoryAnchor: '记忆口诀：长方体六面体，12棱8顶点；正方体特殊长方体，六面全相等；圆柱两圆一侧面，圆锥一圆一侧尖；球体到处都一样，没有棱也没有角。助记：联系生活——鞋盒=长方体，骰子=正方体，罐头=圆柱，冰淇淋=圆锥，地球=球体。',
    errorNote: '易错提醒：①混淆正方体和正方形——正方体是立体（3D），正方形是平面（2D）；②常见错误：以为圆柱只有1个面（错！圆柱有3个面：2个圆形底面+1个弯曲侧面）；③棱和面的区别：棱是边（线），面是表面（面）',
    errorNodeId: 'solid-shapes'
  },
  'math-elem-time-units': {
    title: '时间单位',
    prerequisites: 'numbers-within-100,number-recognition',
    abtWhy: '我们每天都需要知道时间（And），但时针、分针怎么看，1小时是多少分钟我们还不清楚（But），所以我们学习时间单位——秒、分、时、天，掌握时间的换算！（Therefore）',
    pretest: [
      { q: '一天有几个小时？', opts: ['12小时','24小时','60小时','10小时'], ans: 1, explain: '一天=24小时' },
      { q: '时钟上分针走一圈是多少分钟？', opts: ['12分','24分','60分','100分'], ans: 2, explain: '分针走一圈=60分钟=1小时' }
    ],
    posttest: [
      { q: '2小时30分等于多少分钟？', opts: ['130分','150分','230分','32分'], ans: 1, explain: '2小时=120分，120+30=150分钟' },
      { q: '从8:45到9:15，过了多少分钟？', opts: ['20分','30分','40分','70分'], ans: 1, explain: '从8:45到9:00是15分，9:00到9:15是15分，共30分钟' }
    ],
    memoryAnchor: '记忆口诀：1分=60秒，1时=60分，1天=24时，1周=7天，1月≈30天，1年=12月。助记：时钟就是最好的记忆工具——分针走一大格是5分，走一圈是60分=1小时。口诀："六十秒是一分钟，六十分钟是一小时，二十四小时是一天。"',
    errorNote: '易错提醒：①混淆时间进率：时和分之间是60进制，不是100进制；②常见错误：1.5小时=150分（错！1.5×60=90分）；③计算时间差：不能用普通减法，要注意"满60进1"的特点',
    errorNodeId: 'time-units'
  },
  'math-elem-triangles-quadrilaterals': {
    title: '三角形和四边形',
    prerequisites: 'plane-shapes,angle-concept,length-units',
    abtWhy: '我们已经认识了基本图形（And），但三角形有多少种？四边形哪些是特殊的？我们还不了解它们的性质（But），所以我们深入学习三角形分类和四边形家族！（Therefore）',
    pretest: [
      { q: '三角形三个内角之和是多少度？', opts: ['90°','180°','270°','360°'], ans: 1, explain: '任意三角形三个内角之和=180°，这是三角形内角和定理' },
      { q: '平行四边形有什么特点？', opts: ['四个角都是直角','对边平行且相等','四边都相等','只有两条平行边'], ans: 1, explain: '平行四边形：两组对边分别平行且相等' }
    ],
    posttest: [
      { q: '等腰三角形两个底角各60°，顶角是多少度？', opts: ['60°','90°','120°','180°'], ans: 0, explain: '三角形内角和180°，两底角各60°，顶角=180°-60°-60°=60°，这是等边三角形！' },
      { q: '下面哪个不是平行四边形的特例？', opts: ['长方形','菱形','正方形','梯形'], ans: 3, explain: '梯形只有一组平行边，不是平行四边形的特例；而长方形、菱形、正方形都是特殊的平行四边形' }
    ],
    memoryAnchor: '记忆口诀：三角形内角和=180°；四边形内角和=360°。助记：四边形=两个三角形（对角连线），所以360°=2×180°。三角形分类口诀："锐角三角形全锐，直角三角形一直，钝角三角形一钝。"四边形家族树：平行四边形→长方形、菱形→正方形。',
    errorNote: '易错提醒：①三角形三边关系：两边之和大于第三边（1,2,4不能组成三角形）；②常见错误：认为等腰≠等边（等边三角形是特殊的等腰三角形）；③梯形不是平行四边形（只有一组平行边）',
    errorNodeId: 'triangle-properties'
  },
  'math-elem-volume-calculation': {
    title: '体积计算',
    prerequisites: 'solid-shapes,area-rectangle,length-units',
    abtWhy: '我们学会了计算面积（平面大小）（And），但装水的桶、放东西的箱子能装多少——这需要测量"空间大小"（But），所以我们学习体积——三维空间所占的大小！（Therefore）',
    pretest: [
      { q: '长方形的面积公式是？', opts: ['长+宽','长×宽','(长+宽)×2','长×宽×高'], ans: 1, explain: '长方形面积=长×宽（二维，没有高）' },
      { q: '长方体有几个面？', opts: ['4个','5个','6个','8个'], ans: 2, explain: '长方体有6个面，分三对相对的面' }
    ],
    posttest: [
      { q: '长5cm宽4cm高3cm的长方体，体积是多少？', opts: ['47cm³','60cm³','12cm³','35cm³'], ans: 1, explain: 'V=长×宽×高=5×4×3=60cm³' },
      { q: '正方体边长为4cm，体积是多少？', opts: ['16cm³','48cm³','64cm³','12cm³'], ans: 2, explain: 'V=棱长³=4³=4×4×4=64cm³' }
    ],
    memoryAnchor: '记忆口诀：长方体V=长×宽×高；正方体V=棱长³（棱长的三次方）。助记：面积是"铺满一层"（长×宽），体积是"叠好多层"（长×宽×高）。单位：cm²是面积，cm³是体积（"³"代表三维）。口诀："长宽高乘起来，长方体积算出来；棱长自乘三次方，正方体积不用慌。"',
    errorNote: '易错提醒：①混淆面积和体积单位：面积cm²，体积cm³；②常见错误：正方体体积=边长×3（错！应该是边长³=边长×边长×边长）；③体积和容积的区别：容积是容器内部体积，要减去壁厚',
    errorNodeId: 'solid-volume'
  },
  'math-elem-volume-units': {
    title: '体积单位与换算',
    prerequisites: 'volume-calculation,length-units,area-units',
    abtWhy: '我们学会了计算体积（And），但不同场合用不同单位——瓶子用mL，游泳池用m³，怎么换算呢？（But），所以我们学习体积单位和换算关系！（Therefore）',
    pretest: [
      { q: '1m等于多少cm？', opts: ['10cm','100cm','1000cm','10000cm'], ans: 1, explain: '1米=100厘米（长度单位基本换算）' },
      { q: '1cm³大约是多大？', opts: ['一个西瓜大','一个骰子大','一个房间大','一粒沙大'], ans: 1, explain: '1cm³大约是一个小骰子或一个方糖的大小' }
    ],
    posttest: [
      { q: '1m³等于多少cm³？', opts: ['100cm³','1000cm³','10000cm³','1000000cm³'], ans: 3, explain: '1m=100cm，所以1m³=100×100×100=1,000,000cm³' },
      { q: '1L（升）等于多少mL（毫升）？', opts: ['10mL','100mL','1000mL','10000mL'], ans: 2, explain: '1升=1000毫升（L和mL的换算）' }
    ],
    memoryAnchor: '记忆口诀：体积单位：cm³、dm³、m³，每级相差1000倍（因为每边×10，三边就×1000）。容积单位：mL=cm³，L=dm³，1L=1000mL。助记：想象一个1dm³的正方体容器（边长10cm），装满水就是1升（1L）。口诀："体积单位跳千倍，cm³换dm³×1000；容积升和毫升，1升等于千毫升。"',
    errorNote: '易错提醒：①1m³≠1000cm³（错！是100万cm³）；②常见错误：单位换算时用×100（长度进率）而不是×1000000（体积进率）；③容积和体积单位对应：mL=cm³，L=dm³，这个对应关系要记牢',
    errorNodeId: 'solid-volume'
  },
  'math-elem-word-problems-basic': {
    title: '基本应用题',
    prerequisites: 'numbers-within-100,addition-subtraction-within-100',
    abtWhy: '我们已经会加减乘除了（And），但遇到文字描述的题目，不知道该用哪种运算（But），所以我们学习应用题解题策略——读题、找关键词、列算式！（Therefore）',
    pretest: [
      { q: '"共有多少"通常用什么运算？', opts: ['减法','加法','乘法','除法'], ans: 1, explain: '"共有多少"表示合并，通常用加法' },
      { q: '"还剩多少"通常用什么运算？', opts: ['减法','加法','乘法','除法'], ans: 0, explain: '"还剩多少"表示求剩余，通常用减法' }
    ],
    posttest: [
      { q: '小明有8个苹果，小红有5个苹果，小明比小红多几个？', opts: ['3个','13个','2个','40个'], ans: 0, explain: '求"多几个"用减法：8-5=3个' },
      { q: '每盒6个，买了4盒，共有多少个？', opts: ['10个','2个','24个','24盒'], ans: 2, explain: '"每盒6个，4盒"用乘法：6×4=24个（注意单位是"个"不是"盒"）' }
    ],
    memoryAnchor: '记忆口诀：关键词助记——"共/一共/总共/合计"→加法；"剩/还剩/少了/差"→减法；"每个×几个"→乘法；"平均/每份"→除法。助记：解应用题四步：①读题②找关键词③列算式④检验答案。口诀："加法合并减求差，乘法倍数除平均；关键词语告诉你，运算方法要想清。"',
    errorNote: '易错提醒：①单位错误：求"多少个"答案不能写"多少元"；②常见错误：比多比少问题——"A比B多5"列成A+5而不是B+5=A；③读题要完整，不要漏看"剩下"这类关键词',
    errorNodeId: 'addition-subtraction-within-100'
  }
};

function getErrorsForNode(nodeId) {
  const errorDirs = [
    'numbers-operations',
    'geometry-primary',
    'measurement',
    'statistics-probability-primary',
    'algebra'
  ];
  for (const dir of errorDirs) {
    const errFile = path.join(__dirname, '..', 'data', 'math', dir, '_errors.json');
    if (fs.existsSync(errFile)) {
      try {
        const errors = JSON.parse(fs.readFileSync(errFile, 'utf8'));
        const arr = Array.isArray(errors) ? errors : (errors.errors || []);
        const found = arr.filter(e => e.node_id === nodeId);
        if (found.length > 0) return found;
      } catch(e) {}
    }
  }
  return [];
}

function buildPretestHTML(items) {
  return items.map((item, i) => `
    <div class="quiz-item" style="margin-bottom:20px;padding:16px;background:#f8f9fa;border-radius:12px;border-left:4px solid var(--secondary,#4ecdc4);">
      <p style="font-weight:700;margin-bottom:10px;">Q${i+1}：${item.q}</p>
      <div class="options" style="display:flex;flex-direction:column;gap:8px;">
        ${item.opts.map((opt, j) => `
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 12px;border-radius:8px;background:#fff;border:2px solid #e9ecef;transition:all .2s;"
          onmouseover="this.style.borderColor='var(--secondary,#4ecdc4)'" onmouseout="this.style.borderColor='#e9ecef'">
          <input type="radio" name="pre_q${i}" value="${j}" style="accent-color:var(--secondary,#4ecdc4);">
          <span>${['A','B','C','D'][j]}. ${opt}</span>
        </label>`).join('')}
      </div>
      <div class="pre-explain-${i}" style="display:none;margin-top:10px;padding:10px;background:#d4edda;border-radius:8px;color:#155724;font-size:14px;">
        ✅ ${item.explain}
      </div>
    </div>`).join('');
}

function buildPosttestHTML(items) {
  return items.map((item, i) => `
    <div class="quiz-item" style="margin-bottom:20px;padding:16px;background:#f8f9fa;border-radius:12px;border-left:4px solid var(--primary,#ff6b6b);">
      <p style="font-weight:700;margin-bottom:10px;">Q${i+1}：${item.q}</p>
      <div class="options" style="display:flex;flex-direction:column;gap:8px;">
        ${item.opts.map((opt, j) => `
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 12px;border-radius:8px;background:#fff;border:2px solid #e9ecef;transition:all .2s;"
          onmouseover="this.style.borderColor='var(--primary,#ff6b6b)'" onmouseout="this.style.borderColor='#e9ecef'">
          <input type="radio" name="post_q${i}" value="${j}" style="accent-color:var(--primary,#ff6b6b);">
          <span>${['A','B','C','D'][j]}. ${opt}</span>
        </label>`).join('')}
      </div>
      <div class="post-explain-${i}" style="display:none;margin-top:10px;padding:10px;background:#d4edda;border-radius:8px;color:#155724;font-size:14px;">
        ✅ ${item.explain}
      </div>
    </div>`).join('');
}

function buildCheckScript(prefix, items) {
  return items.map((item, i) => `
    var sel${i} = document.querySelector('input[name="${prefix}_q${i}"]:checked');
    if(sel${i}) {
      var exp = document.querySelector('.${prefix}-explain-${i}');
      if(exp) { exp.style.display='block'; }
      if(parseInt(sel${i}.value)===${item.ans}) score++;
    }`).join('');
}

function upgradeCourse(courseName) {
  const cfg = COURSES[courseName];
  if (!cfg) {
    console.error(`No config for ${courseName}`);
    return false;
  }

  const htmlFile = path.join(BASE, courseName, 'index.html');
  if (!fs.existsSync(htmlFile)) {
    console.error(`File not found: ${htmlFile}`);
    return false;
  }

  let html = fs.readFileSync(htmlFile, 'utf8');

  // ===== #11 前置知识链 =====
  if (!/teachany-prerequisites/i.test(html)) {
    html = html.replace(
      /(<meta name="teachany-author"[^>]*>)/i,
      `$1\n<meta name="teachany-prerequisites" content="${cfg.prerequisites}">`
    );
    if (!/teachany-prerequisites/i.test(html)) {
      // fallback: insert after last meta before </head>
      html = html.replace(
        /(<\/head>)/i,
        `<meta name="teachany-prerequisites" content="${cfg.prerequisites}">\n$1`
      );
    }
  }

  // ===== #01 ABT引入 =====
  if (!/为什么.*学|已经知道|但.*问题|所以.*学|Therefore|已经会|现有知识/i.test(html)) {
    const abtBlock = `
<!-- #01 ABT引入 -->
<section class="section" id="abt-intro" style="margin:20px 0;">
  <div class="card" style="background:linear-gradient(135deg,#fff9e6,#fff3cd);border:2px solid #ffc107;border-radius:16px;padding:24px;">
    <div style="font-size:22px;font-weight:900;margin-bottom:12px;color:#e67e00;">🤔 为什么学${cfg.title}？</div>
    <p style="font-size:16px;line-height:1.8;color:#333;">${cfg.abtWhy}</p>
  </div>
</section>`;
    // Insert after hero section or at start of container body
    if (html.includes('id="life-scene"')) {
      html = html.replace(/(<section[^>]*id="life-scene")/i, `${abtBlock}\n$1`);
    } else if (html.includes('id="concepts"')) {
      html = html.replace(/(<section[^>]*id="concepts")/i, `${abtBlock}\n$1`);
    } else if (html.includes('class="section"')) {
      html = html.replace(/(<section[^>]*class="section")/i, `${abtBlock}\n$1`);
    } else {
      html = html.replace(/(<\/div>\s*<!-- .*?container|<div class="container">)/i, `$1\n${abtBlock}`);
    }
  }

  // ===== #02 前测 =====
  if (!/id=["']pretest/i.test(html)) {
    const pretestHTML = buildPretestHTML(cfg.pretest);
    const pretestCheckScript = buildCheckScript('pre', cfg.pretest);
    const pretestBlock = `
<!-- #02 前测 -->
<section id="pretest" class="section" style="margin:30px 0;">
  <div class="section-title">📝 前测：你已经知道什么？</div>
  <div class="card" style="padding:24px;">
    <p style="color:#666;margin-bottom:20px;font-size:14px;">在学习新内容之前，先测测你的基础知识！</p>
    ${pretestHTML}
    <button onclick="(function(){var score=0;${pretestCheckScript}alert('前测结果：'+score+'/${cfg.pretest.length}分！'+(score===${cfg.pretest.length}?'👏基础扎实，来看看新内容吧！':'💪继续学习，打好基础！'));})();"
      style="margin-top:16px;padding:12px 32px;background:linear-gradient(135deg,var(--secondary,#4ecdc4),var(--blue,#339af0));color:#fff;border:none;border-radius:24px;font-size:16px;font-weight:700;cursor:pointer;">
      提交前测 ✓
    </button>
  </div>
</section>`;
    // Insert before abt-intro if exists, otherwise before first section
    if (html.includes('id="abt-intro"')) {
      html = html.replace(/(<!-- #01 ABT引入 -->)/i, `${pretestBlock}\n$1`);
    } else if (html.includes('class="section"')) {
      html = html.replace(/(<section[^>]*class="section")/i, `${pretestBlock}\n$1`);
    }
  }

  // ===== #05 后测 =====
  if (!/id=["']posttest/i.test(html)) {
    const posttestHTML = buildPosttestHTML(cfg.posttest);
    const posttestCheckScript = buildCheckScript('post', cfg.posttest);
    const posttestBlock = `
<!-- #05 后测 -->
<section id="posttest" class="section" style="margin:40px 0;">
  <div class="section-title">🎯 后测：学会了吗？</div>
  <div class="card" style="padding:24px;">
    <p style="color:#666;margin-bottom:20px;font-size:14px;">完成学习后，用这两道题检验你的掌握程度！</p>
    ${posttestHTML}
    <button onclick="(function(){var score=0;${posttestCheckScript}var msg=score===${cfg.posttest.length}?'🌟完全掌握！你已经学会${cfg.title}了！':score===1?'💡部分掌握，再复习一下易错点吧！':'🔁需要再学一遍，别担心，多练习就能掌握！';alert('后测结果：'+score+'/${cfg.posttest.length}分！'+msg);})();"
      style="margin-top:16px;padding:12px 32px;background:linear-gradient(135deg,var(--primary,#ff6b6b),var(--orange,#ff922b));color:#fff;border:none;border-radius:24px;font-size:16px;font-weight:700;cursor:pointer;">
      提交后测 ✓
    </button>
  </div>
</section>`;
    // Insert before </body>
    html = html.replace(/(<\/body>)/i, `${posttestBlock}\n$1`);
  }

  // ===== #17 记忆锚点 (if missing) =====
  if (!/口诀|记忆|类比|就像|想象成|比喻|助记|锚点|窍门|秘诀|总结.*规律/i.test(html)) {
    const memoryBlock = `
<!-- #17 记忆锚点 -->
<section class="section" id="memory-anchor" style="margin:30px 0;">
  <div class="section-title">🧠 记忆锚点</div>
  <div class="card" style="background:linear-gradient(135deg,#f3e5f5,#e8d5f0);border:2px solid #ab47bc;border-radius:16px;padding:24px;">
    <p style="font-size:16px;line-height:2;color:#4a148c;">${cfg.memoryAnchor}</p>
  </div>
</section>`;
    html = html.replace(/(<\/body>)/i, `${memoryBlock}\n$1`);
  }

  // ===== #18 易错点 =====
  if (!/常见错误|容易.*错|搞反|搞混|混淆|误认为|错误.*类型|注意.*陷阱|易错/i.test(html)) {
    // Get errors from data files
    const dataErrors = getErrorsForNode(cfg.errorNodeId);
    let errorItems = '';
    if (dataErrors.length > 0) {
      const topErrors = dataErrors.filter(e => e.frequency === 'high').slice(0, 3);
      const useErrors = topErrors.length > 0 ? topErrors : dataErrors.slice(0, 3);
      errorItems = useErrors.map(e => `
        <div style="padding:12px;background:#fff;border-radius:10px;margin-bottom:10px;border-left:3px solid #e53935;">
          <p style="font-weight:700;color:#c62828;">❌ 易错：${e.description}</p>
          <p style="font-size:13px;color:#666;margin-top:4px;">错误示例：${e.wrong_answer} → 正确：${e.correct_answer}</p>
          <p style="font-size:13px;color:#388e3c;margin-top:4px;">💡 ${e.diagnosis}</p>
        </div>`).join('');
    }
    if (!errorItems) {
      errorItems = `<div style="padding:12px;background:#fff;border-radius:10px;border-left:3px solid #e53935;"><p style="color:#333;">${cfg.errorNote}</p></div>`;
    }
    const errorBlock = `
<!-- #18 易错点 -->
<section class="section" id="common-errors" style="margin:30px 0;">
  <div class="section-title">⚠️ 易错点警示</div>
  <div class="card" style="padding:24px;background:linear-gradient(135deg,#fff5f5,#ffe8e8);">
    <p style="color:#666;margin-bottom:16px;font-size:14px;">这些是同学们最容易犯的错误，注意避开！</p>
    ${errorItems}
    <div style="margin-top:16px;padding:12px;background:#fff3e0;border-radius:10px;border-left:3px solid #ff9800;">
      <p style="font-weight:700;color:#e65100;">📌 记住：${cfg.errorNote}</p>
    </div>
  </div>
</section>`;
    html = html.replace(/(<\/body>)/i, `${errorBlock}\n$1`);
  }

  fs.writeFileSync(htmlFile, html, 'utf8');
  return true;
}

// Main: upgrade all courses
const courses = Object.keys(COURSES);
console.log(`\n🚀 开始升级第3批课件（共${courses.length}个）...\n`);

for (const course of courses) {
  process.stdout.write(`  升级 ${course}... `);
  try {
    const ok = upgradeCourse(course);
    console.log(ok ? '✅' : '❌');
  } catch(e) {
    console.log(`❌ 错误: ${e.message}`);
  }
}

console.log('\n✅ 升级完成，开始质检...\n');
