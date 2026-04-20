/**
 * TeachAny 交互动画模块 v1.0
 * 遗传与变异现象交互演示
 */
(function() {
  'use strict';

  const InteractiveAnimation = {
    // 遗传演示：父母特征传递
    initHeredityDemo(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      canvas.style.borderRadius = '12px';
      canvas.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
      container.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      let frame = 0;

      // 父母特征
      const parentTraits = {
        eyeShape: 'round',    // 圆眼
        hairColor: '#8B4513', // 棕色头发
        skinTone: '#FDBCB4'   // 肤色
      };

      // 孩子特征（从父母继承）
      const childTraits = {
        eyeShape: 'round',    // 遗传自父母
        hairColor: '#8B4513', // 遗传自父母
        skinTone: '#FDBCB4'   // 遗传自父母
      };

      function draw() {
        frame++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 背景
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#e0f7fa');
        gradient.addColorStop(1, '#b2ebf2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 标题
        ctx.fillStyle = '#333';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('遗传现象演示：孩子像父母', canvas.width / 2, 40);

        // 画父母
        drawPerson(ctx, 150, 100, '👨', '爸爸', parentTraits);
        drawPerson(ctx, 450, 100, '👩', '妈妈', parentTraits);

        // 画孩子
        drawPerson(ctx, 300, 280, '👦', '孩子', childTraits);

        // 遗传箭头动画
        const alpha = 0.5 + 0.5 * Math.sin(frame * 0.05);
        ctx.globalAlpha = alpha;

        // 爸爸 → 孩子
        drawArrow(ctx, 180, 200, 280, 260, '#ff6b6b');
        // 妈妈 → 孩子
        drawArrow(ctx, 420, 200, 320, 260, '#4ecdc4');

        ctx.globalAlpha = 1;

        // 标注
        ctx.fillStyle = '#666';
        ctx.font = '14px sans-serif';
        ctx.fillText('遗传：孩子的特征来自父母', canvas.width / 2, 370);

        requestAnimationFrame(draw);
      }

      function drawPerson(ctx, x, y, emoji, label, traits) {
        ctx.font = '60px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(emoji, x, y + 50);

        ctx.fillStyle = '#333';
        ctx.font = '16px sans-serif';
        ctx.fillText(label, x, y + 80);

        // 特征标注
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.fillText(`眼睛: ${traits.eyeShape === 'round' ? '圆眼' : '其他'}`, x, y + 100);
        ctx.fillText(`发色: 棕色`, x, y + 120);
      }

      function drawArrow(ctx, x1, y1, x2, y2, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 箭头头
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLen = 15;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }

      draw();
    },

    // 变异演示：兄弟姐妹差异
    initVariationDemo(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      canvas.style.borderRadius = '12px';
      canvas.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
      container.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      let frame = 0;

      // 三个兄弟姐妹（有相似也有差异）
      const siblings = [
        { emoji: '👦', label: '哥哥', hairColor: '#8B4513', height: 160, trait: '圆眼' },
        { emoji: '👧', label: '姐姐', hairColor: '#000000', height: 155, trait: '长脸' },
        { emoji: '👦', label: '弟弟', hairColor: '#8B4513', height: 150, trait: '圆眼' }
      ];

      function draw() {
        frame++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 背景
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#fff3e0');
        gradient.addColorStop(1, '#ffe0b2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 标题
        ctx.fillStyle = '#333';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('变异现象演示：兄弟姐妹不完全相同', canvas.width / 2, 40);

        // 画三个孩子
        siblings.forEach((sibling, i) => {
          const x = 150 + i * 150;
          const y = 150;

          ctx.font = '60px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(sibling.emoji, x, y + 50);

          ctx.fillStyle = '#333';
          ctx.font = '16px sans-serif';
          ctx.fillText(sibling.label, x, y + 80);

          // 差异标注（高亮）
          const isDifferent = i === 1; // 姐姐有差异
          ctx.fillStyle = isDifferent ? '#ff6b6b' : '#666';
          ctx.font = isDifferent ? 'bold 12px sans-serif' : '12px sans-serif';
          ctx.fillText(`发色: ${sibling.hairColor === '#8B4513' ? '棕色' : '黑色'}`, x, y + 100);
          ctx.fillText(`特征: ${sibling.trait}`, x, y + 120);

          // 差异标记
          if (isDifferent) {
            ctx.font = '20px sans-serif';
            ctx.fillText('⚡', x + 40, y + 30);
          }
        });

        // 标注
        ctx.fillStyle = '#666';
        ctx.font = '14px sans-serif';
        ctx.fillText('变异：即使是同一对父母的孩子，也会有不同的特征', canvas.width / 2, 370);

        requestAnimationFrame(draw);
      }

      draw();
    },

    // 初始化所有交互动画
    initAll() {
      // 等待DOM加载
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.initAll());
        return;
      }

      // 查找动画容器并初始化
      const heredityContainer = document.getElementById('heredity-demo');
      const variationContainer = document.getElementById('variation-demo');

      if (heredityContainer) {
        this.initHeredityDemo('heredity-demo');
      }
      if (variationContainer) {
        this.initVariationDemo('variation-demo');
      }
    }
  };

  // 导出到全局
  window.TeachAnyAnimation = InteractiveAnimation;

  // 自动初始化
  InteractiveAnimation.initAll();
})();
