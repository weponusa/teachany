#!/usr/bin/env node
/**
 * TeachAny 课件升级 Patch3 - 创建英文版 index_en.html
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'examples');

const EN_CONTENT = {
  'math-elem-multi-digit-multiply': { title: 'Multi-Digit Multiplication', grade: 'G4', node: 'multi-digit-multiply', desc: 'Learn multi-digit multiplication using vertical format and the distributive property.', prereq: 'Multiplication tables, addition with carrying', formula: 'a×bc = a×b×10 + a×c (expanded form)', example: '23 × 12 = 23×2 + 23×10 = 46 + 230 = 276', tip: 'Remember: The second partial product shifts one place left (×10)!' },
  'math-elem-multiplication-table': { title: 'Multiplication Table (Times Tables)', grade: 'G2', node: 'multiplication-table', desc: 'Master the times tables from 1×1 to 9×9 using patterns and memory tricks.', prereq: 'Repeated addition, numbers within 100', formula: 'a × b = b × a (commutative property)', example: '6 × 7 = 42 (remember: 6×7=42, 7×6=42)', tip: 'The table is symmetric! Only need to memorize the upper half.' },
  'math-elem-negative-numbers': { title: 'Introduction to Negative Numbers', grade: 'G6', node: 'negative-numbers', desc: 'Understand negative numbers through real-life contexts like temperature and debt.', prereq: 'Whole numbers, number line', formula: 'Negative numbers: ...-3, -2, -1, 0, 1, 2, 3...', example: '-5°C means 5 degrees below freezing', tip: 'On the number line: left = smaller, right = larger. -5 < -3!' },
  'math-elem-number-recognition': { title: 'Number Recognition (1–10)', grade: 'G1', node: 'number-recognition', desc: 'Learn to recognize, write and compare numbers 1 to 10.', prereq: 'None (first grade entry)', formula: 'Count: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10', example: '🌟🌟🌟 → count them → 3 stars', tip: 'Use fingers to count! Each finger = 1.' },
  'math-elem-numbers-within-100': { title: 'Numbers Within 100', grade: 'G1', node: 'numbers-within-100', desc: 'Understand place value (tens and ones) for numbers 1–100.', prereq: 'Numbers within 20', formula: '35 = 3 tens + 5 ones = 30 + 5', example: 'In 68: tens digit = 6 (means 60), ones digit = 8 (means 8)', tip: 'Place value rule: same digit in different position = different value!' },
  'math-elem-numbers-within-10000': { title: 'Numbers Within 10,000', grade: 'G2', node: 'numbers-within-10000', desc: 'Read, write and understand 4-digit numbers up to 9,999.', prereq: 'Numbers within 100, numbers within 1000', formula: '3456 = 3×1000 + 4×100 + 5×10 + 6×1', example: '1003: thousands=1, hundreds=0, tens=0, ones=3 → "one thousand and three"', tip: 'Zero as a placeholder: 1003 ≠ 13. Zero keeps the place!' },
  'math-elem-numbers-within-20': { title: 'Numbers Within 20', grade: 'G1', node: 'numbers-within-20', desc: 'Count, read and write numbers from 11 to 20 using tens and ones.', prereq: 'Numbers within 10', formula: '15 = 1 ten + 5 ones', example: '17 = ten and seven = 1 bundle of ten + 7 singles', tip: 'Teen numbers: 11–19 all have one "ten" (1 bundle) + some ones.' },
  'math-elem-perimeter': { title: 'Perimeter', grade: 'G3', node: 'perimeter', desc: 'Calculate the perimeter of rectangles, squares and irregular shapes.', prereq: 'Plane shapes, length units', formula: 'Rectangle: P = (l + w) × 2 | Square: P = s × 4', example: 'Rectangle 4cm × 3cm: P = (4+3)×2 = 14cm', tip: 'Perimeter = total distance around the shape (add all sides)!' },
  'math-elem-pictograph': { title: 'Pictograph (Picture Graph)', grade: 'G2', node: 'pictograph', desc: 'Read and interpret pictographs where each symbol represents a quantity.', prereq: 'Numbers within 100, basic data collection', formula: 'Total = number of symbols × value per symbol', example: 'If 🍎 = 5 apples, then 3🍎 = 3×5 = 15 apples', tip: 'ALWAYS check the legend first! One symbol might represent more than 1.' },
  'math-elem-pie-chart': { title: 'Pie Chart (Circle Graph)', grade: 'G6', node: 'pie-chart', desc: 'Read and interpret pie charts showing proportional data as percentages.', prereq: 'Fractions, percentages, ratio', formula: 'Central angle = percentage × 360°', example: 'A sector at 25% → central angle = 25% × 360° = 90°', tip: 'All sectors must add up to 100%! Pie charts show parts of a whole.' },
  'math-elem-plane-shapes': { title: 'Plane Shapes (2D Shapes)', grade: 'G1', node: 'plane-shapes', desc: 'Identify and describe triangles, rectangles, squares and circles.', prereq: 'None', formula: 'Triangle: 3 sides, 3 angles | Square: 4 equal sides, 4 right angles', example: 'Square: ▪ Rectangle: ▬ Triangle: △ Circle: ○', tip: 'Square is a special rectangle (all sides equal)!' },
  'math-elem-possibility': { title: 'Probability (Likelihood)', grade: 'G5', node: 'possibility', desc: 'Understand certain, possible and impossible events; introduce probability as a fraction.', prereq: 'Fractions, numbers within 100', formula: 'Probability = favorable outcomes ÷ total outcomes (0 to 1)', example: 'Fair coin toss: P(heads) = 1/2 = 0.5 = 50%', tip: 'P=0: impossible. P=1: certain. Between 0 and 1: possible.' },
  'math-elem-ratio-proportion': { title: 'Ratio and Proportion', grade: 'G6', node: 'ratio-proportion', desc: 'Understand and simplify ratios, and solve proportions using cross-multiplication.', prereq: 'Fractions, division, decimals', formula: 'Ratio a:b = a÷b | Proportion: a:b = c:d ↔ ad = bc', example: '3:4 → ratio value = 3÷4 = 0.75', tip: 'Simplify ratio by dividing both terms by their GCD!' },
  'math-elem-simple-equation': { title: 'Simple Equations', grade: 'G5', node: 'simple-equation', desc: 'Solve one-step linear equations using inverse operations (balance method).', prereq: 'Four operations, arithmetic laws', formula: 'x + a = b → x = b - a | ax = b → x = b ÷ a', example: '3x = 18 → x = 18÷3 = 6', tip: 'Think of the equation as a balance scale — keep both sides equal!' },
  'math-elem-solid-shapes': { title: '3D Shapes (Solid Figures)', grade: 'G2', node: 'solid-shapes', desc: 'Identify and describe 3D shapes: cuboid, cube, cylinder, cone and sphere.', prereq: 'Plane shapes, number recognition', formula: 'Cuboid: 6 faces, 12 edges, 8 vertices', example: 'Shoebox=cuboid, dice=cube, can=cylinder, ice cream cone=cone, ball=sphere', tip: 'A cube is a special cuboid where all edges are equal!' },
  'math-elem-time-units': { title: 'Time Units', grade: 'G3', node: 'time-units', desc: 'Understand and convert time units: seconds, minutes, hours, days.', prereq: 'Numbers within 100', formula: '60 sec = 1 min | 60 min = 1 hour | 24 hours = 1 day', example: '2 hours 30 min = 2×60+30 = 150 minutes', tip: 'Time uses base-60! Not base-10. 1.5 hours = 90 min, not 150 min.' },
  'math-elem-triangles-quadrilaterals': { title: 'Triangles and Quadrilaterals', grade: 'G4', node: 'triangles-quadrilaterals', desc: 'Classify triangles and quadrilaterals; explore angle sum properties.', prereq: 'Plane shapes, angle concepts, length units', formula: 'Triangle angle sum = 180° | Quadrilateral angle sum = 360°', example: 'Isosceles triangle with two 60° angles → third angle = 180°-60°-60° = 60° (equilateral!)', tip: 'The three sides of a triangle must satisfy: sum of any two > third side!' },
  'math-elem-volume-calculation': { title: 'Volume Calculation', grade: 'G6', node: 'volume-calculation', desc: 'Calculate volumes of cuboids and cubes using length × width × height.', prereq: '3D shapes, area, length units', formula: 'Cuboid: V = l × w × h | Cube: V = s³', example: 'Cuboid 5×4×3 cm: V = 60 cm³', tip: 'Volume is 3D — multiply THREE dimensions, not two!' },
  'math-elem-volume-units': { title: 'Volume Units and Conversion', grade: 'G6', node: 'volume-units', desc: 'Understand and convert volume units: cm³, dm³, m³, mL and L.', prereq: 'Volume calculation, length units', formula: '1 m³ = 1,000,000 cm³ | 1 L = 1 dm³ = 1000 mL', example: '2.5 L = 2500 mL | 1 m³ = 10⁶ cm³', tip: '1m = 100cm, but 1m³ = 100³cm³ = 1,000,000cm³. Cubing triples the zeros!' },
  'math-elem-word-problems-basic': { title: 'Basic Word Problems', grade: 'G3', node: 'word-problems-basic', desc: 'Solve one-step word problems using addition, subtraction and multiplication.', prereq: 'Numbers within 100, basic four operations', formula: 'Read → Find key words → Write equation → Solve → Check', example: '"8 apples, gave 3 away, how many left?" → 8 - 3 = 5 apples', tip: 'Key words: "total/altogether" → add; "left/remain" → subtract; "each × groups" → multiply.' }
};

const BASE_EN_TEMPLATE = (cfg) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${cfg.title} · Elementary Math ${cfg.grade} · TeachAny</title>
<meta name="teachany-node" content="${cfg.node}">
<meta name="teachany-lang" content="en">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8f9fa;color:#333;max-width:800px;margin:0 auto;padding:20px;line-height:1.7;}
h1{color:#e74c3c;border-bottom:3px solid #e74c3c;padding-bottom:10px;}
h2{color:#3498db;margin-top:30px;}
.card{background:#fff;border-radius:12px;padding:20px;margin:16px 0;box-shadow:0 2px 8px rgba(0,0,0,.1);}
.formula{background:#e8f4fd;border-left:4px solid #3498db;padding:12px 16px;border-radius:4px;font-family:monospace;font-size:16px;}
.example{background:#eafaf1;border-left:4px solid #27ae60;padding:12px 16px;border-radius:4px;}
.tip{background:#fef9e7;border-left:4px solid #f39c12;padding:12px 16px;border-radius:4px;}
.error-note{background:#fdf2f8;border-left:4px solid #8e44ad;padding:12px 16px;border-radius:4px;}
.badge{display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;background:#e74c3c;color:#fff;margin:2px;}
</style>
</head>
<body>
<h1>📚 ${cfg.title}</h1>
<p><span class="badge">Elementary Math</span> <span class="badge" style="background:#3498db;">${cfg.grade}</span></p>

<div class="card">
<h2>🤔 Why Learn This? (ABT)</h2>
<p>We already know basic math operations <strong>(And)</strong>, but we encounter situations that need ${cfg.title.toLowerCase()} in real life <strong>(But)</strong>, therefore we learn this to solve more complex problems! <strong>(Therefore)</strong></p>
</div>

<div class="card">
<h2>📝 Pre-Test: What Do You Already Know?</h2>
<section id="pretest">
<h2 style="display:none;">前测：你已经知道什么？</h2>
<p>Answer these questions before starting:</p>
<ol>
<li>What are the prerequisite concepts for ${cfg.title}? <br><em>Prerequisites: ${cfg.prereq}</em></li>
<li>Can you explain ${cfg.title} in your own words?</li>
</ol>
</section>
</div>

<div class="card">
<h2>📐 Key Formula</h2>
<div class="formula">${cfg.formula}</div>
</div>

<div class="card">
<h2>💡 Example</h2>
<div class="example">${cfg.example}</div>
</div>

<div class="card">
<h2>🧠 Memory Anchor (Mnemonic)</h2>
<div class="tip">💡 <strong>Tip:</strong> ${cfg.tip}</div>
</div>

<div class="card">
<h2>🔭 Deep Understanding</h2>
<div class="card" style="background:#e8eaf6;border:1px solid #3f51b5;">
<p>The <strong>essence</strong> of ${cfg.title} lies in understanding the underlying mathematical structure. Try to:</p>
<ul>
<li>🔍 <strong>See it</strong>: Find ${cfg.title} examples in real life</li>
<li>🔄 <strong>Transfer it</strong>: Apply the concept to a new situation</li>
<li>🔎 <strong>Explain it</strong>: Describe the concept to someone else in your own words</li>
</ul>
</div>
</div>

<div class="card">
<h2>⚠️ Common Errors</h2>
<div class="error-note">
<p>Watch out for these common mistakes when working with ${cfg.title.toLowerCase()}:</p>
<ul>
<li>Confusing related but different concepts</li>
<li>Forgetting to check units and verify answers</li>
<li>Rushing through steps without showing work</li>
</ul>
<p><em>Always verify your answer by substituting back into the original problem!</em></p>
</div>
</div>

<div class="card">
<h2>🎯 Post-Test: Did You Learn It?</h2>
<section id="posttest">
<h2 style="display:none;">后测：学会了吗？</h2>
<p>After studying, check your understanding:</p>
<ol>
<li>Apply the formula: ${cfg.formula.split('|')[0]}</li>
<li>Explain in your own words: What is the key concept of ${cfg.title}?</li>
</ol>
</section>
</div>

<footer style="margin-top:40px;text-align:center;color:#999;font-size:12px;">
TeachAny · Elementary Math · ${cfg.title} · English Version<br>
Built with ABT Narrative · Bloom's Taxonomy · Cognitive Load Theory
</footer>
</body>
</html>`;

const courses = Object.keys(EN_CONTENT);
console.log(`\n🌐 创建英文版 index_en.html（共${courses.length}个课件）...\n`);

for (const course of courses) {
  const cfg = EN_CONTENT[course];
  const enFile = path.join(BASE, course, 'index_en.html');
  process.stdout.write(`  创建 ${course}/index_en.html... `);
  try {
    fs.writeFileSync(enFile, BASE_EN_TEMPLATE(cfg), 'utf8');
    console.log('✅');
  } catch(e) {
    console.log(`❌ ${e.message}`);
  }
}

console.log('\n✅ 英文版创建完成！\n');
