#!/usr/bin/env python3
"""
inject_interactive_v2.py — 全量知识点互动资源注入（v2）
基于 v7.9.6 实测可用度，按"现场自建 > LLM 猜+验"原则为所有 K12 学科知识点注入 interactive_resources。

平台可用度优先级：
1. GeoGebra Deploy API（100%）— 数学/几何/函数
2. Desmos API（100%）— 数学/函数/统计
3. Matter.js（100%）— 物理/化学/生物/地理
4. PhET（91%）— 物理/化学/生物/地理/数学
5. 3Dmol.js（80%）— 化学/生物

规则：
- "现成 ID"不可靠，"现场自建"最可靠
- GeoGebra: 用 Deploy API 现场组装（evalCommand），不依赖现成 applet ID
- PhET: LLM 知识储备给候选 slug + curl 验证
- 现有 interactive_resources 非空的跳过（不覆盖）
"""

import json
import os
import sys
import glob

KP_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'kp')
KP_DIR = os.path.abspath(KP_DIR)

# ============================================================
# 资源映射表：node_id 前缀/关键词 → 互动资源配置
# ============================================================
# 每条规则是一个 dict:
#   match: "prefix" | "contains" | "exact"  — 匹配方式
#   pattern: str — node_id 的匹配模式
#   resources: list[dict] — 要注入的资源条目

INTERACTIVE_MAP = [
    # ================================================================
    # 数学 — GeoGebra + Desmos 为主
    # ================================================================
    # --- 一次函数 ---
    {"match": "contains", "pattern": "linear-function", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["A=(0,0)", "B=(4,2)", "f(x)=m*x+b", "m=Slider(-3,3,0.1)", "b=Slider(-5,5,0.5)", "f(x)=m*x+b"],
         "description": "GeoGebra 一次函数参数调节：拖动滑块改变斜率 m 和截距 b"},
        {"platform": "desmos", "method": "api", "priority": 2, "reliability": "100%",
         "expressions": [{"latex": "y = m x + b", "sliderBounds": {"m": {"min": -3, "max": 3, "step": 0.1}, "b": {"min": -5, "max": 5, "step": 0.5}}}],
         "description": "Desmos 一次函数交互：滑块调节 y=mx+b 参数"}
    ]},
    # --- 二次函数 ---
    {"match": "contains", "pattern": "quadratic", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["a=Slider(-3,3,0.1)", "b=Slider(-3,3,0.1)", "c=Slider(-5,5,0.5)", "f(x)=a*x^2+b*x+c", "V=(-b/(2a), c-b^2/(4a))"],
         "description": "GeoGebra 二次函数参数调节：改变 a/b/c 观察图像变化"},
        {"platform": "desmos", "method": "api", "priority": 2, "reliability": "100%",
         "expressions": [{"latex": "y = a x^2 + b x + c", "sliderBounds": {"a": {"min": -3, "max": 3, "step": 0.1}, "b": {"min": -3, "max": 3, "step": 0.1}, "c": {"min": -5, "max": 5, "step": 0.5}}}],
         "description": "Desmos 二次函数交互：滑块调节 y=ax²+bx+c"}
    ]},
    # --- 顶点式 ---
    {"match": "contains", "pattern": "vertex-form", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["a=Slider(-3,3,0.1)", "h=Slider(-5,5,0.5)", "k=Slider(-5,5,0.5)", "f(x)=a*(x-h)^2+k", "V=(h,k)"],
         "description": "GeoGebra 二次函数顶点式：调节 a/h/k 观察顶点位置"},
        {"platform": "desmos", "method": "api", "priority": 2, "reliability": "100%",
         "expressions": [{"latex": "y = a (x - h)^2 + k", "sliderBounds": {"a": {"min": -3, "max": 3, "step": 0.1}, "h": {"min": -5, "max": 5, "step": 0.5}, "k": {"min": -5, "max": 5, "step": 0.5}}}],
         "description": "Desmos 顶点式交互：滑块调节 y=a(x-h)²+k"}
    ]},
    # --- 反比例函数 ---
    {"match": "contains", "pattern": "inverse-proportion", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["k=Slider(-5,5,0.5)", "f(x)=k/x"],
         "description": "GeoGebra 反比例函数 y=k/x 参数调节"},
        {"platform": "desmos", "method": "api", "priority": 2, "reliability": "100%",
         "expressions": [{"latex": "y = \\frac{k}{x}", "sliderBounds": {"k": {"min": -5, "max": 5, "step": 0.5}}}],
         "description": "Desmos 反比例函数交互"}
    ]},
    # --- 三角函数 ---
    {"match": "contains", "pattern": "trigonometric", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["A=Slider(0.1,5,0.1)", "ω=Slider(0.1,5,0.1)", "φ=Slider(0,6.28,0.1)", "f(x)=A*sin(ω*x+φ)"],
         "description": "GeoGebra 三角函数参数调节：振幅A/角频率ω/初相φ"},
        {"platform": "desmos", "method": "api", "priority": 2, "reliability": "100%",
         "expressions": [{"latex": "y = A \\sin(\\omega x + \\phi)", "sliderBounds": {"A": {"min": 0.1, "max": 5, "step": 0.1}, "\\omega": {"min": 0.1, "max": 5, "step": 0.1}, "\\phi": {"min": 0, "max": 6.28, "step": 0.1}}}],
         "description": "Desmos 三角函数交互"}
    ]},
    # --- 指数函数 ---
    {"match": "contains", "pattern": "exponential-function", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["a=Slider(0.1,5,0.1)", "b=Slider(-2,2,0.1)", "f(x)=a*e^(b*x)"],
         "description": "GeoGebra 指数函数参数调节"},
        {"platform": "desmos", "method": "api", "priority": 2, "reliability": "100%",
         "expressions": [{"latex": "y = a e^{bx}", "sliderBounds": {"a": {"min": 0.1, "max": 5, "step": 0.1}, "b": {"min": -2, "max": 2, "step": 0.1}}}],
         "description": "Desmos 指数函数交互"}
    ]},
    # --- 对数函数 ---
    {"match": "contains", "pattern": "logarithm", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["a=Slider(0.2,5,0.1)", "f(x)=a*ln(x)", "g(x)=ln(x)/ln(a)"],
         "description": "GeoGebra 对数函数参数调节"},
        {"platform": "desmos", "method": "api", "priority": 2, "reliability": "100%",
         "expressions": [{"latex": "y = a \\ln(x)", "sliderBounds": {"a": {"min": 0.2, "max": 5, "step": 0.1}}}],
         "description": "Desmos 对数函数交互"}
    ]},
    # --- 圆 ---
    {"match": "contains", "pattern": "circle-properties", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["r=Slider(1,8,0.5)", "h=Slider(-5,5,0.5)", "k=Slider(-5,5,0.5)", "c:Circle((h,k),r)"],
         "description": "GeoGebra 圆的方程参数调节：圆心(h,k)和半径r"}
    ]},
    # --- 椭圆 ---
    {"match": "contains", "pattern": "ellipse", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["a=Slider(1,8,0.5)", "b=Slider(1,8,0.5)", "e:x^2/a^2+y^2/b^2=1"],
         "description": "GeoGebra 椭圆标准方程参数调节"}
    ]},
    # --- 双曲线 ---
    {"match": "contains", "pattern": "hyperbola", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["a=Slider(1,8,0.5)", "b=Slider(1,8,0.5)", "h:x^2/a^2-y^2/b^2=1"],
         "description": "GeoGebra 双曲线标准方程参数调节"}
    ]},
    # --- 抛物线 ---
    {"match": "contains", "pattern": "parabola-conic", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["p=Slider(0.5,5,0.5)", "par:y^2=2*p*x", "F=(p/2,0)", "d:x=-p/2"],
         "description": "GeoGebra 抛物线参数调节：焦参数p"}
    ]},
    # --- 向量 ---
    {"match": "contains", "pattern": "vector", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["A=(0,0)", "B=(3,2)", "v=Vector(A,B)", "C=Slider(-3,3,0.5)", "D=Slider(-3,3,0.5)"],
         "description": "GeoGebra 向量可视化：拖动端点观察向量变化"}
    ]},
    # --- 概率统计 ---
    {"match": "contains", "pattern": "probability", "resources": [
        {"platform": "desmos", "method": "api", "priority": 1, "reliability": "100%",
         "expressions": [{"latex": "P(X=k) = \\binom{n}{k} p^k (1-p)^{n-k}", "sliderBounds": {"n": {"min": 1, "max": 20, "step": 1}, "p": {"min": 0, "max": 1, "step": 0.05}}}],
         "description": "Desmos 二项分布概率交互"}
    ]},
    # --- 导数 ---
    {"match": "contains", "pattern": "derivative", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["f(x)=x^3-3x+1", "Derivative(f)", "T=Slider(-3,3,0.1)", "t: Tangent(T,f)"],
         "description": "GeoGebra 导数与切线：拖动点观察切线斜率变化"},
        {"platform": "desmos", "method": "api", "priority": 2, "reliability": "100%",
         "expressions": [{"latex": "f(x) = x^3 - 3x + 1", "sliderBounds": {}}, {"latex": "y = f'(a)(x - a) + f(a)", "sliderBounds": {"a": {"min": -3, "max": 3, "step": 0.1}}}],
         "description": "Desmos 导数与切线交互"}
    ]},
    # --- 积分 ---
    {"match": "contains", "pattern": "integral", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["f(x)=sin(x)", "a=Slider(0,3,0.1)", "b=Slider(0,6.28,0.1)", "Integral(f,a,b)"],
         "description": "GeoGebra 定积分：调节积分上下限观察面积变化"},
        {"platform": "desmos", "method": "api", "priority": 2, "reliability": "100%",
         "expressions": [{"latex": "\\int_a^b \\sin(x) dx", "sliderBounds": {"a": {"min": 0, "max": 3, "step": 0.1}, "b": {"min": 0, "max": 6.28, "step": 0.1}}}],
         "description": "Desmos 定积分交互"}
    ]},
    # --- 勾股定理 ---
    {"match": "contains", "pattern": "pythagorean", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["a=Slider(1,8,0.5)", "b=Slider(1,8,0.5)", "A=(0,0)", "B=(a,0)", "C=(0,b)", "Polygon(A,B,C,3)"],
         "description": "GeoGebra 勾股定理可视化：改变直角边观察斜边变化"}
    ]},
    # --- 相似三角形 ---
    {"match": "contains", "pattern": "similar-triangle", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["k=Slider(0.5,3,0.1)", "A=(0,0)", "B=(3,0)", "C=(1,2)", "A'=k*A", "B'=k*B", "C'=k*C"],
         "description": "GeoGebra 相似三角形缩放：调节比例因子k"}
    ]},
    # --- 全等三角形 ---
    {"match": "contains", "pattern": "congruent", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["A=(0,0)", "B=(4,0)", "C=(2,3)", "t1=Polygon(A,B,C,3)", "Rotate(t1,45,(2,1))"],
         "description": "GeoGebra 全等三角形：旋转/平移/翻折验证全等"}
    ]},
    # --- 平面直角坐标系 ---
    {"match": "contains", "pattern": "coordinate-system", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["P=(3,4)", "Q=(-2,1)", "Segment(P,Q)", "Midpoint(P,Q)"],
         "description": "GeoGebra 坐标系：描点连线观察坐标变化"}
    ]},
    # --- 数列 ---
    {"match": "contains", "pattern": "sequence-arithmetic", "resources": [
        {"platform": "desmos", "method": "api", "priority": 1, "reliability": "100%",
         "expressions": [{"latex": "a_n = a_1 + (n-1)d", "sliderBounds": {"a_1": {"min": -5, "max": 5, "step": 0.5}, "d": {"min": -3, "max": 3, "step": 0.5}}}],
         "description": "Desmos 等差数列通项公式交互"}
    ]},
    {"match": "contains", "pattern": "sequence-geometric", "resources": [
        {"platform": "desmos", "method": "api", "priority": 1, "reliability": "100%",
         "expressions": [{"latex": "a_n = a_1 \\cdot q^{n-1}", "sliderBounds": {"a_1": {"min": 0.1, "max": 5, "step": 0.5}, "q": {"min": 0.1, "max": 3, "step": 0.1}}}],
         "description": "Desmos 等比数列通项公式交互"}
    ]},

    # ================================================================
    # 物理 — PhET + GeoGebra + Matter.js
    # ================================================================
    # --- 力学 ---
    {"match": "contains", "pattern": "force", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "forces-and-motion-basics", "url": "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_zh_CN.html",
         "description": "PhET 力与运动基础：推拉小车观察加速度（中文版）"},
        {"platform": "geogebra", "method": "deploy-api", "priority": 2, "reliability": "100%",
         "evalCommands": ["m=Slider(1,10,0.5)", "F=Slider(0,50,1)", "a=F/m", "v=a*t"],
         "description": "GeoGebra 牛顿第二定律 F=ma 参数调节"}
    ]},
    {"match": "contains", "pattern": "newton-law", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "forces-and-motion-basics", "url": "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_zh_CN.html",
         "description": "PhET 力与运动基础（中文版）"},
        {"platform": "matter.js", "method": "canvas", "priority": 2, "reliability": "100%",
         "code_hint": "Matter.js 模拟碰撞：两物体碰撞观察动量守恒，可调质量/速度",
         "description": "Matter.js 牛顿定律碰撞模拟"}
    ]},
    {"match": "contains", "pattern": "pressure", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "under-pressure", "url": "https://phet.colorado.edu/sims/html/under-pressure/latest/under-pressure_zh_CN.html",
         "description": "PhET 压强：测量不同深度液体压强（中文版）"}
    ]},
    {"match": "contains", "pattern": "friction", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "friction", "url": "https://phet.colorado.edu/sims/html/friction/latest/friction_zh_CN.html",
         "description": "PhET 摩擦力：推物体观察摩擦力变化（中文版）"}
    ]},
    # --- 运动学 ---
    {"match": "contains", "pattern": "kinematics", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "the-moving-man", "url": "https://phet.colorado.edu/sims/html/the-moving-man/latest/the-moving-man_zh_CN.html",
         "description": "PhET 运动人：位置/速度/加速度关系（中文版）"},
        {"platform": "desmos", "method": "api", "priority": 2, "reliability": "100%",
         "expressions": [{"latex": "x(t) = x_0 + v_0 t + \\frac{1}{2} a t^2", "sliderBounds": {"x_0": {"min": -5, "max": 5, "step": 0.5}, "v_0": {"min": -5, "max": 5, "step": 0.5}, "a": {"min": -3, "max": 3, "step": 0.1}}}],
         "description": "Desmos 匀变速直线运动公式交互"}
    ]},
    # --- 能量 ---
    {"match": "contains", "pattern": "energy-conservation", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "energy-skate-park-basics", "url": "https://phet.colorado.edu/sims/html/energy-skate-park-basics/latest/energy-skate-park-basics_zh_CN.html",
         "description": "PhET 能量滑板公园：动能势能转换（中文版）"}
    ]},
    {"match": "contains", "pattern": "work-energy", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "energy-skate-park-basics", "url": "https://phet.colorado.edu/sims/html/energy-skate-park-basics/latest/energy-skate-park-basics_zh_CN.html",
         "description": "PhET 能量滑板公园：动能势能转换（中文版）"}
    ]},
    # --- 电学 ---
    {"match": "contains", "pattern": "circuit", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "circuit-construction-kit-dc", "url": "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_zh_CN.html",
         "description": "PhET 电路构建：搭电路测电流电压（中文版）"}
    ]},
    {"match": "contains", "pattern": "ohm-law", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "ohms-law", "url": "https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_zh_CN.html",
         "description": "PhET 欧姆定律：调电压电阻观察电流（中文版）"}
    ]},
    {"match": "contains", "pattern": "electromagnetic", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "faradays-electromagnetic-lab", "url": "https://phet.colorado.edu/sims/html/faradays-electromagnetic-lab/latest/faradays-electromagnetic-lab_zh_CN.html",
         "description": "PhET 法拉第电磁实验室（中文版）"}
    ]},
    # --- 光学 ---
    {"match": "contains", "pattern": "light-refraction", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "bending-light", "url": "https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_zh_CN.html",
         "description": "PhET 折射定律：光线穿过介质观察折射角（中文版）"}
    ]},
    {"match": "contains", "pattern": "optics", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["f=Slider(2,10,0.5)", "L:Line((-8,0),(8,0))", "F=(f,0)", "F'=(-f,0)"],
         "description": "GeoGebra 透镜成像：调节焦距观察成像规律"}
    ]},
    # --- 波 ---
    {"match": "contains", "pattern": "wave", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "wave-on-a-string", "url": "https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_zh_CN.html",
         "description": "PhET 绳上波：调节频率振幅观察波形（中文版）"}
    ]},
    # --- 热学 ---
    {"match": "contains", "pattern": "temperature", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "states-of-matter-basics", "url": "https://phet.colorado.edu/sims/html/states-of-matter-basics/latest/states-of-matter-basics_zh_CN.html",
         "description": "PhET 物质状态：加热冷却观察分子运动（中文版）"}
    ]},
    {"match": "contains", "pattern": "gas-law", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "gas-properties", "url": "https://phet.colorado.edu/sims/html/gas-properties/latest/gas-properties_zh_CN.html",
         "description": "PhET 气体性质：调温度体积观察压强（中文版）"}
    ]},
    # --- 磁场 ---
    {"match": "contains", "pattern": "magnetic", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "magnets-and-electromagnets", "url": "https://phet.colorado.edu/sims/html/magnets-and-electromagnets/latest/magnets-and-electromagnets_zh_CN.html",
         "description": "PhET 磁铁与电磁铁（中文版）"}
    ]},
    # --- 重力 ---
    {"match": "contains", "pattern": "gravity", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "gravity-and-orbits", "url": "https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits_zh_CN.html",
         "description": "PhET 重力与轨道：天体运动模拟（中文版）"}
    ]},
    # --- 浮力 ---
    {"match": "contains", "pattern": "buoyancy", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "buoyancy", "url": "https://phet.colorado.edu/sims/html/buoyancy/latest/buoyancy_zh_CN.html",
         "description": "PhET 浮力：物体在液体中的浮沉（中文版）"}
    ]},
    # --- 密度 ---
    {"match": "contains", "pattern": "density", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "density", "url": "https://phet.colorado.edu/sims/html/density/latest/density_zh_CN.html",
         "description": "PhET 密度：测不同物体密度（中文版）"}
    ]},
    # --- 声音 ---
    {"match": "contains", "pattern": "sound", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "sound", "url": "https://phet.colorado.edu/sims/html/sound/latest/sound_zh_CN.html",
         "description": "PhET 声音：调节频率振幅听声音变化（中文版）"}
    ]},
    # --- 动量 ---
    {"match": "contains", "pattern": "momentum", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Matter.js 碰撞模拟：两球碰撞观察动量守恒，可调质量/初速度，显示动量条形图",
         "description": "Matter.js 动量守恒碰撞模拟"},
        {"platform": "phet", "method": "iframe", "priority": 2, "reliability": "91%",
         "slug": "collision-lab", "url": "https://phet.colorado.edu/sims/html/collision-lab/latest/collision-lab_zh_CN.html",
         "description": "PhET 碰撞实验室：动量守恒验证（中文版）"}
    ]},

    # ================================================================
    # 化学 — PhET + 3Dmol.js + GeoGebra
    # ================================================================
    {"match": "contains", "pattern": "atomic-structure", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "build-an-atom", "url": "https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_zh_CN.html",
         "description": "PhET 建造原子：拖动质子/中子/电子组装原子（中文版）"}
    ]},
    {"match": "contains", "pattern": "chemical-bond", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "molecule-shapes", "url": "https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes_zh_CN.html",
         "description": "PhET 分子形状：VSEPR 理论（中文版）"},
        {"platform": "3dmol", "method": "api", "priority": 2, "reliability": "80%",
         "pdb_hint": "常见分子 PDB: H2O=1H2O, CO2=1CO2, NH3=1NH3, CH4=1CH4",
         "description": "3Dmol.js 分子三维结构展示"}
    ]},
    {"match": "contains", "pattern": "concentration", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "concentration", "url": "https://phet.colorado.edu/sims/html/concentration/latest/concentration_zh_CN.html",
         "description": "PhET 溶液浓度（中文版）"}
    ]},
    {"match": "contains", "pattern": "acid-base", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "ph-scale", "url": "https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale_zh_CN.html",
         "description": "PhET pH 标度：测试酸碱性（中文版）"}
    ]},
    {"match": "contains", "pattern": "reaction-rate", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "reactions-and-rates", "url": "https://phet.colorado.edu/sims/html/reactions-and-rates/latest/reactions-and-rates_zh_CN.html",
         "description": "PhET 反应与速率（中文版）"}
    ]},
    {"match": "contains", "pattern": "molecular", "resources": [
        {"platform": "3dmol", "method": "api", "priority": 1, "reliability": "80%",
         "pdb_hint": "搜索 PDB ID: water=1H2O, ethanol=1EHT, glucose=1DLG, caffeine=1CAV",
         "description": "3Dmol.js 分子三维结构：PDB ID 渲染分子模型"}
    ]},
    {"match": "contains", "pattern": "equilibrium", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "reversible-reactions", "url": "https://phet.colorado.edu/sims/html/reversible-reactions/latest/reversible-reactions_zh_CN.html",
         "description": "PhET 可逆反应：化学平衡（中文版）"}
    ]},
    {"match": "contains", "pattern": "electrolysis", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "circuit-construction-kit-dc", "url": "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_zh_CN.html",
         "description": "PhET 电路构建：电解实验电路搭建（中文版）"}
    ]},

    # ================================================================
    # 生物 — PhET + Matter.js + Canvas
    # ================================================================
    {"match": "contains", "pattern": "natural-selection", "resources": [
        {"platform": "phet", "method": "iframe", "priority": 1, "reliability": "91%",
         "slug": "natural-selection", "url": "https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection_zh_CN.html",
         "description": "PhET 自然选择模拟（中文版）"}
    ]},
    {"match": "contains", "pattern": "infectious", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "粒子模拟 SIR 传染病模型：调节传染率β/恢复率γ，观察 S→I→R 人数曲线实时绘制",
         "description": "Matter.js/Canvas 传染病 SIR 模型粒子模拟"}
    ]},
    {"match": "contains", "pattern": "cell-division", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 动画模拟有丝分裂/减数分裂过程：间期→前期→中期→后期→末期，可点击切换阶段",
         "description": "Canvas/JS 细胞分裂过程动画"}
    ]},
    {"match": "contains", "pattern": "photosynthesis", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 动画模拟光合作用：CO2+H2O→C6H12O6+O2，调节光照强度观察产物速率变化",
         "description": "Canvas/JS 光合作用过程模拟"}
    ]},
    {"match": "contains", "pattern": "nervous", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 动画模拟神经冲动传导：刺激→去极化→复极化，调节刺激强度观察阈值效应",
         "description": "Canvas/JS 神经冲动传导模拟"}
    ]},
    {"match": "contains", "pattern": "dna", "resources": [
        {"platform": "3dmol", "method": "api", "priority": 1, "reliability": "80%",
         "pdb_hint": "DNA 双螺旋 PDB ID: 1BNA, 1ZHH, 2BNA",
         "description": "3Dmol.js DNA 双螺旋三维结构展示"}
    ]},
    {"match": "contains", "pattern": "enzyme", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 动画：酶-底物锁钥模型，调节温度/pH 观察酶活性变化曲线",
         "description": "Canvas/JS 酶促反应锁钥模型模拟"}
    ]},
    {"match": "contains", "pattern": "ecology", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 生态瓶模拟：调节生产者/消费者/分解者数量，观察种群动态平衡",
         "description": "Canvas/JS 生态系统种群动态模拟"}
    ]},

    # ================================================================
    # 地理 — GeoGebra + Canvas + PhET
    # ================================================================
    {"match": "contains", "pattern": "earth-rotation", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 地球自转动画：日照面/背光面，调节经度观察时区变化",
         "description": "Canvas/JS 地球自转与时区模拟"}
    ]},
    {"match": "contains", "pattern": "plate-tectonics", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 板块运动模拟：拖动板块观察碰撞/张裂/滑移，标注火山地震带",
         "description": "Canvas/JS 板块构造运动模拟"}
    ]},
    {"match": "contains", "pattern": "climate", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 全球气候带分布：调节纬度观察气温降水变化曲线",
         "description": "Canvas/JS 气候带分布模拟"}
    ]},
    {"match": "contains", "pattern": "ocean-current", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 洋流流动动画：暖流/寒流路径与方向，调节温度观察影响",
         "description": "Canvas/JS 洋流运动模拟"}
    ]},
    {"match": "contains", "pattern": "map-projection", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["proj=Slider(0,1,0.01)", "r=5", "lo=Slider(-180,180,5)", "la=Slider(-90,90,5)"],
         "description": "GeoGebra 地图投影参数调节：对比不同投影变形"}
    ]},
    {"match": "contains", "pattern": "world-region", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 交互地图：点击大洲高亮+弹出信息卡，可切换人口/GDP/面积数据图层",
         "description": "Canvas/JS 世界分区交互地图"}
    ]},

    # ================================================================
    # 历史 — Canvas + Timeline
    # ================================================================
    {"match": "contains", "pattern": "dynasty", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 中国朝代时间轴：可拖动/点击各朝代卡片，展示疆域变化+关键事件+文化成就",
         "description": "Canvas/JS 朝代演变互动时间轴"}
    ]},
    {"match": "contains", "pattern": "war", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 战役动态地图：标注行军路线+关键节点，点击节点查看战术说明",
         "description": "Canvas/JS 战役路线动态地图"}
    ]},
    {"match": "contains", "pattern": "revolution", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 革命事件时间轴：标注关键事件节点，可展开详情卡片",
         "description": "Canvas/JS 革命事件互动时间轴"}
    ]},

    # ================================================================
    # 数学通用（匹配含 function/graph/equation 等关键词）
    # ================================================================
    {"match": "contains", "pattern": "function-graph", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["f(x)=a*x^2+b*x+c", "a=Slider(-3,3,0.1)", "b=Slider(-3,3,0.1)", "c=Slider(-5,5,0.5)"],
         "description": "GeoGebra 函数图像参数调节"}
    ]},
    {"match": "contains", "pattern": "equation-solve", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["f(x)=x^2-4", "g(x)=2*x", "Intersect(f,g)"],
         "description": "GeoGebra 方程求解：交点法求方程的解"}
    ]},
    {"match": "contains", "pattern": "inequality", "resources": [
        {"platform": "desmos", "method": "api", "priority": 1, "reliability": "100%",
         "expressions": [{"latex": "y > 2x + 1"}, {"latex": "y < -x + 3"}],
         "description": "Desmos 不等式区域可视化"}
    ]},
    {"match": "contains", "pattern": "statistics", "resources": [
        {"platform": "desmos", "method": "api", "priority": 1, "reliability": "100%",
         "expressions": [{"latex": "\\mu = \\frac{1}{n}\\sum_{i=1}^{n} x_i"}, {"latex": "\\sigma = \\sqrt{\\frac{1}{n}\\sum_{i=1}^{n}(x_i - \\mu)^2}"}],
         "description": "Desmos 统计学均值与标准差交互"}
    ]},
    {"match": "contains", "pattern": "geometry-transform", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["A=(1,2)", "B=(3,1)", "C=(2,4)", "t=Polygon(A,B,C,3)", "Rotate(t,90,(0,0))", "Translate(t,(3,0))", "Reflect(t,xAxis)"],
         "description": "GeoGebra 几何变换：旋转/平移/对称"}
    ]},
    {"match": "contains", "pattern": "angle", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["A=(0,0)", "B=(3,0)", "C=Slider(0,6.28,0.1)", "P=(cos(C),sin(C))", "α=Angle(A,B,P)"],
         "description": "GeoGebra 角的概念：拖动点观察角度变化"}
    ]},
    {"match": "contains", "pattern": "symmetry", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["f(x)=x^3-x", "g(x)=x^3-x", "AxisOfSymmetry(f)"],
         "description": "GeoGebra 对称性探究"}
    ]},
    {"match": "contains", "pattern": "limit", "resources": [
        {"platform": "desmos", "method": "api", "priority": 1, "reliability": "100%",
         "expressions": [{"latex": "f(x) = \\frac{\\sin(x)}{x}", "sliderBounds": {}}, {"latex": "x = a", "sliderBounds": {"a": {"min": -3, "max": 3, "step": 0.01}}}],
         "description": "Desmos 极限概念交互：观察 sin(x)/x 趋近 0 的行为"}
    ]},

    # ================================================================
    # 通用前缀匹配 — 覆盖未命中具体关键词的学科知识点
    # 策略：按学科+学段给一个该学科最常见的互动工具
    # ================================================================
    # --- 数学通用（math- 前缀但未匹配到具体关键词）---
    {"match": "prefix", "pattern": "math-", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["a=Slider(-3,3,0.1)", "b=Slider(-3,3,0.1)", "c=Slider(-5,5,0.5)", "f(x)=a*x^2+b*x+c"],
         "description": "GeoGebra 数学可视化：参数调节探索函数图像"}
    ]},
    # --- 物理通用 ---
    {"match": "prefix", "pattern": "phy-", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["m=Slider(1,10,0.5)", "F=Slider(0,50,1)", "a=F/m"],
         "description": "GeoGebra 物理公式可视化：调节参数观察物理量关系"}
    ]},
    {"match": "prefix", "pattern": "physics-", "resources": [
        {"platform": "geogebra", "method": "deploy-api", "priority": 1, "reliability": "100%",
         "evalCommands": ["m=Slider(1,10,0.5)", "F=Slider(0,50,1)", "a=F/m"],
         "description": "GeoGebra 物理公式可视化：调节参数观察物理量关系"}
    ]},
    # --- 化学通用 ---
    {"match": "prefix", "pattern": "chem-", "resources": [
        {"platform": "3dmol", "method": "api", "priority": 1, "reliability": "80%",
         "pdb_hint": "搜索 RCSB PDB 数据库获取分子 ID，常见: H2O=1H2O, NaCl=1NAC, C2H5OH=1EHT",
         "description": "3Dmol.js 化学分子三维结构展示"},
        {"platform": "geogebra", "method": "deploy-api", "priority": 2, "reliability": "100%",
         "evalCommands": ["n=Slider(1,20,1)", "m=Slider(1,20,1)", "ratio=n/m"],
         "description": "GeoGebra 化学计量比可视化"}
    ]},
    {"match": "prefix", "pattern": "chemistry-", "resources": [
        {"platform": "3dmol", "method": "api", "priority": 1, "reliability": "80%",
         "pdb_hint": "搜索 RCSB PDB 数据库获取分子 ID",
         "description": "3Dmol.js 化学分子三维结构展示"}
    ]},
    # --- 生物通用 ---
    {"match": "prefix", "pattern": "bio-", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 生物过程动画：细胞/分子/生态系统等可视化模拟",
         "description": "Canvas/JS 生物过程可视化模拟"}
    ]},
    {"match": "prefix", "pattern": "biology-", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 生物过程动画：细胞/分子/生态系统等可视化模拟",
         "description": "Canvas/JS 生物过程可视化模拟"}
    ]},
    # --- 地理通用 ---
    {"match": "prefix", "pattern": "geo-", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 地理过程动画：地球运动/气候/洋流/地形等可视化模拟",
         "description": "Canvas/JS 地理过程可视化模拟"}
    ]},
    {"match": "prefix", "pattern": "geography-", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 地理过程动画：地球运动/气候/洋流/地形等可视化模拟",
         "description": "Canvas/JS 地理过程可视化模拟"}
    ]},
    # --- 历史通用 ---
    {"match": "prefix", "pattern": "hist-", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 历史时间轴：朝代/事件节点交互，点击展开详情卡片",
         "description": "Canvas/JS 历史互动时间轴"}
    ]},
    {"match": "prefix", "pattern": "history-", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 历史时间轴：朝代/事件节点交互，点击展开详情卡片",
         "description": "Canvas/JS 历史互动时间轴"}
    ]},
    # --- 科学通用（小学科学）---
    {"match": "prefix", "pattern": "sci-", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 科学探究动画：观察/假设/实验/结论可视化",
         "description": "Canvas/JS 科学探究过程模拟"}
    ]},
    {"match": "prefix", "pattern": "science-", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 科学探究动画：观察/假设/实验/结论可视化",
         "description": "Canvas/JS 科学探究过程模拟"}
    ]},
    # --- 经济学通用 ---
    {"match": "prefix", "pattern": "economics-", "resources": [
        {"platform": "desmos", "method": "api", "priority": 1, "reliability": "100%",
         "expressions": [{"latex": "P = a - bQ", "sliderBounds": {"a": {"min": 1, "max": 20, "step": 0.5}, "b": {"min": 0.1, "max": 5, "step": 0.1}}}, {"latex": "P = c + dQ", "sliderBounds": {"c": {"min": 0, "max": 10, "step": 0.5}, "d": {"min": 0.1, "max": 5, "step": 0.1}}}],
         "description": "Desmos 供需曲线交互：调节参数观察均衡价格变化"}
    ]},
    # --- 计算机科学通用 ---
    {"match": "prefix", "pattern": "cs-", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 算法可视化：排序/搜索/递归过程动画，逐步高亮当前操作元素",
         "description": "Canvas/JS 算法过程可视化"}
    ]},
    # --- 人文通用 ---
    {"match": "prefix", "pattern": "humanities-", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 人文思维导图/时间轴：概念关系可视化",
         "description": "Canvas/JS 人文概念关系可视化"}
    ]},
    # --- 探究通用 ---
    {"match": "prefix", "pattern": "inquiry-", "resources": [
        {"platform": "matter.js", "method": "canvas", "priority": 1, "reliability": "100%",
         "code_hint": "Canvas 探究式学习动画：问题→假设→实验→结论流程可视化",
         "description": "Canvas/JS 探究学习过程可视化"}
    ]},
]


def match_node(node_id, rule):
    """检查 node_id 是否匹配规则"""
    if rule["match"] == "prefix":
        return node_id.startswith(rule["pattern"])
    elif rule["match"] == "contains":
        return rule["pattern"] in node_id
    elif rule["match"] == "exact":
        return node_id == rule["pattern"]
    return False


def main():
    dry_run = "--dry-run" in sys.argv

    # 收集所有卫星文件
    all_files = []
    for f in sorted(glob.glob(os.path.join(KP_DIR, "*", "*.json"))):
        basename = os.path.basename(f)
        if basename.startswith("_"):
            continue
        all_files.append(f)

    print(f"共 {len(all_files)} 个卫星文件")

    injected_count = 0
    skipped_existing = 0
    skipped_no_match = 0
    total_entries_added = 0
    subject_stats = {}

    for fpath in all_files:
        try:
            data = json.load(open(fpath, encoding="utf-8"))
        except:
            continue

        # 用文件名（去掉.json后缀）作为匹配key，因为很多文件 node_id 为空
        fname = os.path.splitext(os.path.basename(fpath))[0]
        existing_ir = data.get("interactive_resources", [])

        # 已有非空资源的跳过
        if existing_ir and len(existing_ir) > 0:
            skipped_existing += 1
            continue

        # 匹配规则（同时匹配 fname 和 node_id）
        matched_resources = []
        node_id = data.get("node_id", "")
        for rule in INTERACTIVE_MAP:
            if match_node(fname, rule) or (node_id and match_node(node_id, rule)):
                matched_resources.extend(rule["resources"])

        if not matched_resources:
            skipped_no_match += 1
            continue

        # 注入
        data["interactive_resources"] = matched_resources
        injected_count += 1
        total_entries_added += len(matched_resources)

        # 统计
        subject = os.path.basename(os.path.dirname(fpath))
        subject_stats[subject] = subject_stats.get(subject, 0) + 1

        if not dry_run:
            with open(fpath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write("\n")

    print(f"\n=== 注入结果 ===")
    print(f"新增注入: {injected_count} 个知识点")
    print(f"新增资源条目: {total_entries_added} 条")
    print(f"跳过(已有资源): {skipped_existing}")
    print(f"跳过(无匹配规则): {skipped_no_match}")
    print(f"\n按学科分布:")
    for s, c in sorted(subject_stats.items(), key=lambda x: -x[1]):
        print(f"  {s}: {c}")

    if dry_run:
        print(f"\n⚠️ DRY RUN — 未写入文件，去掉 --dry-run 执行写入")


if __name__ == "__main__":
    main()
