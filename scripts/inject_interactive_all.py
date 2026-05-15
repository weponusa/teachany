#!/usr/bin/env python3
"""
inject_interactive_all.py — 全量互动资源注入

数据源：
  - GeoGebra Deploy API（100% 可靠）：数学函数/几何/代数
  - Desmos API（100% 可靠）：数学函数图象探究
  - PhET（已验证 200 的 slug，91% 可靠）：理化生实验模拟
  - Matter.js（100% 可靠）：物理碰撞/运动/力学
  - 3Dmol.js（80% 可靠）：化学分子结构
"""
import json, os, glob

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KP_DIR    = os.path.join(REPO_ROOT, 'data/kp')

# 互动资源库：node_id → 资源配置列表
IR = {}

# ══════════════════════════════════════════════════════════
# MATH — GeoGebra + Desmos
# ══════════════════════════════════════════════════════════

IR['math-m-linear-function'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['k = Slider(-5, 5, 0.1)','b = Slider(-5, 5, 0.1)','f(x) = k*x + b'],
     'description':'拖动 k、b 滑块探究斜率和截距对图像的影响'},
    {'tool':'desmos','method':'api','priority':2,'reliability':'100%',
     'expressions':[{'latex':'k = 2','sliderBounds':{'min':-5,'max':5}},{'latex':'b = 1','sliderBounds':{'min':-5,'max':5}},{'latex':'y = kx + b'}],
     'description':'Desmos 版一次函数参数探究'},
]
IR['math-m-proportional-function'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['k = Slider(-5, 5, 0.1)','f(x) = k*x'],
     'description':'探究 k 值对正比例函数图像的影响'},
]
IR['math-m-inverse-proportion'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['k = Slider(-10, 10, 0.1)','f(x) = k/x'],
     'description':'探究 k 值对反比例函数图像的影响'},
]
IR['math-m-quadratic-function'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['a = Slider(-3, 3, 0.1)','b = Slider(-5, 5, 0.1)','c = Slider(-5, 5, 0.1)','f(x) = a*x^2 + b*x + c'],
     'description':'三参数滑块探究抛物线形状与顶点位置'},
    {'tool':'desmos','method':'api','priority':2,'reliability':'100%',
     'expressions':[{'latex':'a = 1','sliderBounds':{'min':-3,'max':3}},{'latex':'b = 0','sliderBounds':{'min':-5,'max':5}},{'latex':'c = 0','sliderBounds':{'min':-5,'max':5}},{'latex':'y = ax^2 + bx + c'}],
     'description':'Desmos 二次函数参数探究'},
]
IR['math-m-quadratic-equation'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['a = Slider(0.5, 3, 0.1)','b = Slider(-5, 5, 0.1)','c = Slider(-5, 5, 0.1)','f(x) = a*x^2 + b*x + c','Root1 = Root(f, 1)','Root2 = Root(f, 2)'],
     'description':'观察抛物线与 x 轴交点（即方程根）随系数变化'},
]
IR['math-m-linear-equation-one'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['a = Slider(-5, 5, 0.1)','b = Slider(-5, 5, 0.1)','f(x) = a*x + b','Zero = Root(f)'],
     'description':'观察一次函数与 x 轴交点，直观理解方程 ax+b=0 的解'},
]
IR['math-m-real-number'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['A = (2, 0)','B = (-3, 0)','C = (2.5, 0)','D = (sqrt(2), 0)'],
     'description':'在数轴上标注有理数和无理数的位置'},
]
IR['math-m-coordinate-system'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['A = (2, 3)','B = (-1, 4)','C = (3, -2)'],
     'description':'在平面直角坐标系中标注点的位置'},
]
IR['math-m-triangle-basics'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'geometry','evalCommands':['A = (0, 0)','B = (4, 0)','C = (1, 3)','Polygon(A, B, C)'],
     'description':'动态三角形，拖动顶点观察角和边的变化'},
]
IR['math-m-geometry-congruent-triangles'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'geometry','evalCommands':['A=(0,0)','B=(3,0)','C=(1,2)','D=(4,0)','Polygon(A,B,C)','Polygon(B,D,C)'],
     'description':'构造全等三角形，验证 SSS/SAS/ASA'},
]
IR['math-m-isosceles-triangle'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'geometry','evalCommands':['A=(0,0)','B=(4,0)','C=(2,3)','Polygon(A,B,C)','Angle(A)','Angle(B)','Angle(C)'],
     'description':'拖动顶点观察等腰三角形的对称性和角度关系'},
]
IR['math-m-geometry-quadrilaterals'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'geometry','evalCommands':['A=(0,0)','B=(4,0)','C=(5,2)','D=(1,2)','Polygon(A,B,C,D)'],
     'description':'动态四边形，拖动顶点观察平行四边形/矩形/菱形特征'},
]
IR['math-m-circle-basics'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'geometry','evalCommands':['O=(0,0)','r=Slider(1,5,0.1)','Circle(O,r)'],
     'description':'调节半径观察圆的变化'},
]
IR['math-m-circle-tangent'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'geometry','evalCommands':['O=(0,0)','r=Slider(1,5,0.1)','Circle(O,r)','A=Point(Circle(O,r))','Tangent(A,Circle(O,r))'],
     'description':'在圆上取动点做切线，观察切线与半径垂直'},
]
IR['math-m-probability'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'probability','evalCommands':['n=Slider(10,1000,10)','k=Slider(0,1,0.01)'],
     'description':'GeoGebra 概率计算器，模拟频率估计概率'},
]
IR['math-m-ratio-proportion'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'ratio-and-proportion','url':'https://phet.colorado.edu/sims/html/ratio-and-proportion/latest/ratio-and-proportion_zh_CN.html',
     'description':'PhET 比例与比率（中文版）'},
]
IR['math-m-number-line'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'number-line-integers','url':'https://phet.colorado.edu/sims/html/number-line-integers/latest/number-line-integers_zh_CN.html',
     'description':'PhET 数轴整数（中文版）'},
]
# 数学高中
IR['math-h-sets'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['A={1,2,3,4,5}','B={3,4,5,6,7}','Intersection(A,B)','Union(A,B)'],
     'description':'集合运算可视化交集和并集'},
]
IR['math-h-functions-concept'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['f(x)=If[x>0,x^2,-x]','g(x)=If[x<=0,2x,x+1]'],
     'description':'展示分段函数的定义域与值域'},
]
IR['math-h-function-properties'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['f(x)=x^3-3x','Derivative(f)'],
     'description':'同时显示函数及其导数，直观感受单调性与极值'},
]
IR['math-h-exponential-function'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['a=Slider(0.1,5,0.1)','f(x)=a^x','g(x)=(1/a)^x'],
     'description':'对比 a>1 和 0<a<1 的指数函数图像'},
]
IR['math-h-logarithmic-function'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['a=Slider(0.1,5,0.1)','f(x)=log(a,x)','g(x)=a^x'],
     'description':'对比指数函数与对数函数互为反函数的图像'},
]
IR['math-h-power-function'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['a=Slider(-2,3,0.1)','f(x)=x^a'],
     'description':'调节指数 a 观察幂函数族图像变化'},
]
IR['math-h-derivative-concept'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['f(x)=x^3-3x','a=Slider(-3,3,0.1)','T=Tangent(a,f)','P=(a,f(a))'],
     'description':'拖动切点观察导数（切线斜率）的几何意义'},
]
IR['math-h-derivative-application'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['f(x)=-x^3+3x^2','f_prime(x)=Derivative(f)'],
     'description':'观察导函数零点与极值点的对应关系'},
]
IR['math-h-trig-ratios'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['A=(1,0)','B=Point(Circle((0,0),1))','Segment((0,0),B)'],
     'description':'单位圆上动点展示任意角三角函数定义'},
    {'tool':'phet','method':'iframe','priority':2,'reliability':'91%',
     'slug':'trig-tour','url':'https://phet.colorado.edu/sims/html/trig-tour/latest/trig-tour_zh_CN.html',
     'description':'PhET 三角函数导览（中文版）'},
]
IR['math-h-trig-graphs'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['A=Slider(0.5,3,0.1)','omega=Slider(0.5,3,0.1)','phi=Slider(-3.14,3.14,0.05)','f(x)=A*sin(omega*x+phi)'],
     'description':'A/ω/φ 三参数滑块探究正弦函数图像变换'},
]
IR['math-h-trig-identities'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['f(x)=sin(x+pi/6)','g(x)=sin(x)*cos(pi/6)+cos(x)*sin(pi/6)'],
     'description':'验证 sin(x+α) 展开，两条曲线完全重合'},
]
IR['math-h-sequence-summation'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['Sequence((n,n^2),n,1,10)','Sequence((n,2^n),n,1,10)'],
     'description':'绘制数列散点图，对比等差与等比数列增长差异'},
]
IR['math-h-ellipse'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'geometry','evalCommands':['a=Slider(2,6,0.1)','c=Slider(0,2,0.1)','b=sqrt(a^2-c^2)','Ellipse((0,0),a,b)'],
     'description':'调节半长轴 a 和半焦距 c 观察椭圆形状变化'},
]
IR['math-h-hyperbola'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'geometry','evalCommands':['a=Slider(1,4,0.1)','b=Slider(1,4,0.1)','Hyperbola((0,0),a,b)'],
     'description':'调节 a、b 观察双曲线张口与渐近线变化'},
]
IR['math-h-vector-basics'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'geometry','evalCommands':['A=(0,0)','B=(3,2)','Vector(A,B)','C=(1,-1)','Vector(A,C)','Vector(A,A+B+C)'],
     'description':'可视化向量加法的平行四边形法则'},
]
IR['math-h-vector-coordinates'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['u=(2,1)','v=(-1,3)','u+v','u-v','2*u'],
     'description':'向量坐标运算可视化'},
]
IR['math-h-circle-equation'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['a=Slider(-3,3,0.1)','b=Slider(-3,3,0.1)','r=Slider(0.5,5,0.1)','Circle((a,b),r)'],
     'description':'调节圆心和半径观察圆的方程变化'},
]
IR['math-h-line-equation'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['k=Slider(-3,3,0.1)','b=Slider(-5,5,0.1)','f(x)=k*x+b'],
     'description':'调节斜率和截距观察直线位置关系'},
]
IR['math-h-inequalities'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['f(x)=2x+1','g(x)=-x+4','Inequality(f>g)'],
     'description':'可视化不等式解集（函数图像上方区域）'},
]
IR['math-h-basic-inequality'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'graphing','evalCommands':['a=Slider(0.1,5,0.1)','b=Slider(0.1,5,0.1)','(a+b)/2','sqrt(a*b)','2*sqrt(a*b)'],
     'description':'动态对比算术平均与几何平均'},
]
IR['math-h-solid-geometry'] = [
    {'tool':'geogebra','method':'deploy-api','priority':1,'reliability':'100%',
     'appName':'3dgraphics','evalCommands':['A=(0,0,0)','B=(2,0,0)','C=(2,2,0)','D=(0,2,0)','E=(0,0,3)','Polyhedron(A,B,C,D,E)'],
     'description':'GeoGebra 3D 绘制棱柱/棱锥，可旋转观察'},
]

# ══════════════════════════════════════════════════════════
# PHYSICS — PhET + Matter.js
# ══════════════════════════════════════════════════════════

IR['phy-m-ohms-law'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'ohms-law','url':'https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_zh_CN.html',
     'description':'PhET 欧姆定律（中文版）'},
    {'tool':'phet','method':'iframe','priority':2,'reliability':'91%',
     'slug':'circuit-construction-kit-dc','url':'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_zh_CN.html',
     'description':'PhET 直流电路搭建套件'},
]
IR['phy-m-series-parallel'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'circuit-construction-kit-dc','url':'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_zh_CN.html',
     'description':'PhET 直流电路套件：搭建串并联电路'},
    {'tool':'phet','method':'iframe','priority':2,'reliability':'91%',
     'slug':'circuit-construction-kit-ac','url':'https://phet.colorado.edu/sims/html/circuit-construction-kit-ac/latest/circuit-construction-kit-ac_zh_CN.html',
     'description':'PhET 交流电路套件'},
]
IR['phy-m-pressure'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'under-pressure','url':'https://phet.colorado.edu/sims/html/under-pressure/latest/under-pressure_zh_CN.html',
     'description':'PhET 压强探究（中文版）'},
]
IR['phy-m-atmospheric-pressure'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'under-pressure','url':'https://phet.colorado.edu/sims/html/under-pressure/latest/under-pressure_zh_CN.html',
     'description':'PhET 压强探究（含大气压强模块）'},
]
IR['phy-m-liquid-pressure-buoyancy'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'density','url':'https://phet.colorado.edu/sims/html/density/latest/density_zh_CN.html',
     'description':'PhET 密度与浮力（中文版）'},
]
IR['phy-m-density'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'density','url':'https://phet.colorado.edu/sims/html/density/latest/density_zh_CN.html',
     'description':'PhET 密度探究（中文版）'},
]
IR['phy-m-static-electricity'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'balloons-and-static-electricity','url':'https://phet.colorado.edu/sims/html/balloons-and-static-electricity/latest/balloons-and-static-electricity_zh_CN.html',
     'description':'PhET 气球与静电（中文版）'},
    {'tool':'phet','method':'iframe','priority':2,'reliability':'91%',
     'slug':'john-travoltage','url':'https://phet.colorado.edu/sims/html/john-travoltage/latest/john-travoltage_zh_CN.html',
     'description':'PhET 摩擦起电（中文版）'},
]
IR['phy-m-friction'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'friction','url':'https://phet.colorado.edu/sims/html/friction/latest/friction_zh_CN.html',
     'description':'PhET 摩擦力（中文版）'},
]
IR['phy-m-gravity'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'gravity-force-lab','url':'https://phet.colorado.edu/sims/html/gravity-force-lab/latest/gravity-force-lab_zh_CN.html',
     'description':'PhET 万有引力实验室（中文版）'},
]
IR['phy-m-sound-generation'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'wave-on-a-string','url':'https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_zh_CN.html',
     'description':'PhET 弦上的波（中文版）'},
]
IR['phy-m-sound-properties'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'wave-on-a-string','url':'https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_zh_CN.html',
     'description':'PhET 弦上的波：频率→音调，振幅→响度（中文版）'},
]
IR['phy-m-light-reflection'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'geometric-optics','url':'https://phet.colorado.edu/sims/html/geometric-optics/latest/geometric-optics_zh_CN.html',
     'description':'PhET 几何光学：反射/折射（中文版）'},
]
IR['phy-m-light-refraction'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'bending-light','url':'https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_zh_CN.html',
     'description':'PhET 光的折射（中文版）'},
]
IR['phy-m-light-dispersion'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'color-vision','url':'https://phet.colorado.edu/sims/html/color-vision/latest/color-vision_zh_CN.html',
     'description':'PhET 颜色视觉（中文版）'},
]
IR['phy-m-elastic-force'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'masses-and-springs','url':'https://phet.colorado.edu/sims/html/masses-and-springs/latest/masses-and-springs_zh_CN.html',
     'description':'PhET 弹簧与质量（胡克定律，中文版）'},
]
IR['phy-m-simple-machines'] = [
    {'tool':'matter.js','method':'canvas','priority':1,'reliability':'100%',
     'code_hint':'Constraint + Body 模拟杠杆，调节支点位置观察力臂变化',
     'description':'Matter.js 模拟杠杆原理'},
]
IR['phy-m-energy-conservation'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'energy-forms-and-changes','url':'https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes_zh_CN.html',
     'description':'PhET 能量形式与转化（中文版）'},
]
IR['phy-m-kinetic-potential'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'energy-skate-park','url':'https://phet.colorado.edu/sims/html/energy-skate-park/latest/energy-skate-park_zh_CN.html',
     'description':'PhET 能量滑板公园（中文版）'},
]
IR['phy-m-gas-properties'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'gas-properties','url':'https://phet.colorado.edu/sims/html/gas-properties/latest/gas-properties_zh_CN.html',
     'description':'PhET 气体性质（中文版）'},
]
IR['phy-m-voltage-resistance'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'resistance-in-a-wire','url':'https://phet.colorado.edu/sims/html/resistance-in-a-wire/latest/resistance-in-a-wire_zh_CN.html',
     'description':'PhET 导线电阻（中文版）'},
]
IR['phy-m-em-induction'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'faradays-law','url':'https://phet.colorado.edu/sims/html/faradays-law/latest/faradays-law_zh_CN.html',
     'description':'PhET 法拉第定律（中文版）'},
]
IR['phy-m-electrical-safety'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'circuit-construction-kit-dc','url':'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_zh_CN.html',
     'description':'PhET 直流电路：短路/过载场景模拟'},
]
IR['phy-m-co2-properties'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'molecules-and-light','url':'https://phet.colorado.edu/sims/html/molecules-and-light/latest/molecules-and-light_zh_CN.html',
     'description':'PhET 分子与光（中文版）'},
]
# 物理高中
IR['phy-h-projectile-motion'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'projectile-motion','url':'https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_zh_CN.html',
     'description':'PhET 抛体运动（中文版）'},
    {'tool':'matter.js','method':'canvas','priority':2,'reliability':'100%',
     'code_hint':'Body.setVelocity + gravity，实时渲染抛物线轨迹',
     'description':'Matter.js 物理引擎渲染抛体运动'},
]
IR['phy-h-wave-optics'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'wave-interference','url':'https://phet.colorado.edu/sims/html/wave-interference/latest/wave-interference_zh_CN.html',
     'description':'PhET 波的干涉与衍射（中文版）'},
]
IR['phy-h-capacitor'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'capacitor-lab-basics','url':'https://phet.colorado.edu/sims/html/capacitor-lab-basics/latest/capacitor-lab-basics_zh_CN.html',
     'description':'PhET 电容器实验室（中文版）'},
]
IR['phy-h-photoelectric-effect'] = [
    {'tool':'matter.js','method':'canvas','priority':1,'reliability':'100%',
     'code_hint':'Canvas 粒子动画：光子入射→电子逸出，频率阈值判定',
     'description':'Canvas/JS 动画模拟光电效应'},
]
IR['phy-h-nuclear-reaction'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'rutherford-scattering','url':'https://phet.colorado.edu/sims/html/rutherford-scattering/latest/rutherford-scattering_zh_CN.html',
     'description':'PhET 卢瑟福散射（中文版）'},
]
IR['physics-ap-1-collisions'] = [
    {'tool':'matter.js','method':'canvas','priority':1,'reliability':'100%',
     'code_hint':'Matter.Engine + Body.setVelocity，弹性/非弹性碰撞恢复系数设置',
     'description':'Matter.js 模拟弹性/非弹性碰撞'},
]
IR['phy-h-alternating-current'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'circuit-construction-kit-ac','url':'https://phet.colorado.edu/sims/html/circuit-construction-kit-ac/latest/circuit-construction-kit-ac_zh_CN.html',
     'description':'PhET 交流电路套件（中文版）'},
]
IR['phy-h-universal-gravitation'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'gravity-force-lab','url':'https://phet.colorado.edu/sims/html/gravity-force-lab/latest/gravity-force-lab_zh_CN.html',
     'description':'PhET 万有引力实验室（中文版）'},
]

# ══════════════════════════════════════════════════════════
# CHEMISTRY — PhET + 3Dmol.js
# ══════════════════════════════════════════════════════════

IR['chem-m-atomic-structure'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'build-an-atom','url':'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_zh_CN.html',
     'description':'PhET 建造原子（中文版）'},
]
IR['chem-m-element-concept'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'build-an-atom','url':'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_zh_CN.html',
     'description':'PhET 建造原子（中文版）'},
]
IR['chem-m-equation-balancing'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'balancing-chemical-equations','url':'https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations_zh_CN.html',
     'description':'PhET 配平化学方程式（中文版）'},
]
IR['chem-m-solution-concept'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'concentration','url':'https://phet.colorado.edu/sims/html/concentration/latest/concentration_zh_CN.html',
     'description':'PhET 溶液浓度（中文版）'},
    {'tool':'phet','method':'iframe','priority':2,'reliability':'91%',
     'slug':'molarity','url':'https://phet.colorado.edu/sims/html/molarity/latest/molarity_zh_CN.html',
     'description':'PhET 摩尔浓度（中文版）'},
]
IR['chem-m-acids-bases'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'ph-scale','url':'https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale_zh_CN.html',
     'description':'PhET pH 标尺（中文版）'},
    {'tool':'phet','method':'iframe','priority':2,'reliability':'91%',
     'slug':'acid-base-solutions','url':'https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_zh_CN.html',
     'description':'PhET 酸碱溶液（中文版）'},
]
IR['chemistry-ap-chemical-equilibrium'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'reversible-reactions','url':'https://phet.colorado.edu/sims/html/reversible-reactions/latest/reversible-reactions_zh_CN.html',
     'description':'PhET 可逆反应（中文版）'},
]
IR['chem-h-molecular-structure'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'molecule-shapes','url':'https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes_zh_CN.html',
     'description':'PhET 分子形状（VSEPR 理论，中文版）'},
    {'tool':'3dmol','method':'api','priority':2,'reliability':'80%',
     'description':'3Dmol.js 展示分子三维结构：PDB ID 或 SMILES 渲染'},
]
IR['chemistry-ap-atomic-structure'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'build-an-atom','url':'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_zh_CN.html',
     'description':'PhET 建造原子（中文版）'},
    {'tool':'phet','method':'iframe','priority':2,'reliability':'91%',
     'slug':'rutherford-scattering','url':'https://phet.colorado.edu/sims/html/rutherford-scattering/latest/rutherford-scattering_zh_CN.html',
     'description':'PhET 卢瑟福散射（中文版）'},
]
IR['chemistry-ap-reaction-rates'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'reactions-and-rates','url':'https://phet.colorado.edu/sims/html/reactions-and-rates/latest/reactions-and-rates_en.html',
     'description':'PhET Reactions & Rates（英文版）'},
]

# ══════════════════════════════════════════════════════════
# BIOLOGY — PhET + Canvas
# ══════════════════════════════════════════════════════════

IR['bio-m-bio-characteristics'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'natural-selection','url':'https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection_zh_CN.html',
     'description':'PhET 自然选择（中文版）'},
]
IR['bio-m-photosynthesis'] = [
    {'tool':'matter.js','method':'canvas','priority':1,'reliability':'100%',
     'code_hint':'Canvas 粒子动画模拟 CO2+H2O→C6H12O6+O2，箭头标注光能输入',
     'description':'Canvas/JS 动画模拟光合作用物质转化过程'},
]
IR['bio-m-cell-division'] = [
    {'tool':'matter.js','method':'canvas','priority':1,'reliability':'100%',
     'code_hint':'Canvas 逐帧动画展示有丝分裂各期，用 requestAnimationFrame',
     'description':'Canvas/JS 动画展示有丝分裂全过程'},
]
IR['bio-m-infectious-disease'] = [
    {'tool':'matter.js','method':'canvas','priority':1,'reliability':'100%',
     'code_hint':'粒子模拟传染病传播 SIR 模型，调节传染率/恢复率参数',
     'description':'Canvas/JS 粒子模拟传染病 SIR 模型'},
]
IR['biology-ap-enzymes'] = [
    {'tool':'matter.js','method':'canvas','priority':1,'reliability':'100%',
     'code_hint':'Canvas 动画：酶-底物结合锁钥模型，调节温度/pH 观察活性变化',
     'description':'Canvas/JS 动画模拟酶促反应锁钥模型'},
]
IR['biology-ap-natural-selection'] = [
    {'tool':'phet','method':'iframe','priority':1,'reliability':'91%',
     'slug':'natural-selection','url':'https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection_en.html',
     'description':'PhET Natural Selection（英文版）'},
]


# ══════════════════════════════════════════════════════════
# 执行注入
# ══════════════════════════════════════════════════════════

def main():
    stats = {'written': 0, 'resources_added': 0, 'not_found': 0}
    for node_id, resources in sorted(IR.items()):
        sat_path = None
        for subj_dir in glob.glob(os.path.join(KP_DIR, '*')):
            if os.path.isdir(subj_dir):
                candidate = os.path.join(subj_dir, node_id + '.json')
                if os.path.exists(candidate):
                    sat_path = candidate
                    break
        if not sat_path:
            stats['not_found'] += 1
            continue

        with open(sat_path, 'r', encoding='utf-8') as f:
            sat = json.load(f)
        existing_keys = {r.get('tool','')+r.get('description','')[:20]
                        for r in sat.get('interactive_resources', [])}
        added = 0
        for r in resources:
            key = r.get('tool','')+r.get('description','')[:20]
            if key not in existing_keys:
                sat.setdefault('interactive_resources', []).append(r)
                existing_keys.add(key)
                added += 1
        if added:
            sat['_meta']['sources'] = list(set(sat['_meta'].get('sources', []) + ['interactive_resources_v7.9.6']))
            with open(sat_path, 'w', encoding='utf-8') as f:
                json.dump(sat, f, ensure_ascii=False, indent=2)
            stats['written'] += 1
            stats['resources_added'] += added
            print(f'  ✅ {node_id} +{added}')

    print(f'\n=== 完成 ===')
    print(f'  写入节点: {stats["written"]}')
    print(f'  新增资源: {stats["resources_added"]} 条')
    print(f'  未找到:   {stats["not_found"]}')

if __name__ == '__main__':
    main()
