import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  staticFile,
} from 'remotion';

const FPS = 30;

// ===== 通用工具 =====
function useSpring(frame: number, delay = 0, mass = 0.6) {
  return spring({ frame: frame - delay, fps: FPS, config: { mass, damping: 14 } });
}

// ===== 场景1：开场 标题动画 (0-5s = 0-150f) =====
const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const titleY = interpolate(useSpring(frame, 10), [0, 1], [60, 0]);
  const titleOp = interpolate(frame, [10, 40], [0, 1], { extrapolateRight: 'clamp' });
  const subtitleOp = interpolate(frame, [40, 70], [0, 1], { extrapolateRight: 'clamp' });
  const yearOp = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: 'clamp' });
  const starScale = interpolate(useSpring(frame, 20), [0, 1], [0.3, 1]);

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #0d1117 0%, #1a0a0a 50%, #0d1117 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* 五角星 */}
      <div style={{ fontSize: 80, opacity: titleOp, transform: `scale(${starScale})`, color: '#c0392b', marginBottom: 20, filter: 'drop-shadow(0 0 20px #c0392b88)' }}>★</div>
      {/* 主标题 */}
      <div style={{ fontSize: 80, fontWeight: 900, color: '#fff', opacity: titleOp, transform: `translateY(${titleY}px)`, textAlign: 'center', fontFamily: '"PingFang SC", "Microsoft YaHei", SimHei, sans-serif', letterSpacing: 8, textShadow: '0 4px 24px #c0392b44' }}>
        俄国十月革命
      </div>
      {/* 英文副标题 */}
      <div style={{ fontSize: 28, color: '#aaa', opacity: subtitleOp, marginTop: 16, letterSpacing: 4, fontFamily: 'Georgia, serif' }}>
        Russian October Revolution
      </div>
      {/* 年份徽章 */}
      <div style={{ marginTop: 32, opacity: yearOp, background: 'rgba(192,57,43,0.2)', border: '2px solid #e74c3c', borderRadius: 40, padding: '10px 36px', fontSize: 24, color: '#e74c3c', fontWeight: 700, letterSpacing: 6, fontFamily: 'Georgia, serif' }}>
        1917
      </div>
      {/* 底部说明 */}
      <div style={{ position: 'absolute', bottom: 48, opacity: interpolate(frame, [90, 120], [0, 1], { extrapolateRight: 'clamp' }), color: '#555', fontSize: 18, fontFamily: 'SimHei, sans-serif' }}>
        世界上第一次成功的社会主义革命
      </div>
    </AbsoluteFill>
  );
};

// ===== 场景2：背景危机 (5-15s = 150-450f) =====
const SceneBackground: React.FC = () => {
  const frame = useCurrentFrame();

  const items = [
    { icon: '⚔️', label: '一战危机', desc: '160万士兵阵亡', color: '#c0392b' },
    { icon: '🍞', label: '粮食短缺', desc: '首都彼得格勒饥荒', color: '#d35400' },
    { icon: '🏭', label: '工人苦难', desc: '每天工作14小时', color: '#e67e22' },
    { icon: '👑', label: '沙皇专制', desc: '尼古拉二世的腐朽统治', color: '#8e44ad' },
  ];

  return (
    <AbsoluteFill style={{ background: '#0d1117', padding: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', fontFamily: '"PingFang SC","Microsoft YaHei",SimHei,sans-serif' }}>
      {/* 标题 */}
      <div style={{ fontSize: 44, fontWeight: 800, color: '#fff', marginBottom: 48, opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }) }}>
        <span style={{ color: '#e74c3c' }}>01</span> &nbsp;革命前夜——沙俄的深重危机
      </div>
      {/* 危机卡片逐项浮现 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        {items.map((item, i) => {
          const delay = i * 25;
          const op = interpolate(frame, [delay, delay + 30], [0, 1], { extrapolateRight: 'clamp' });
          const y = interpolate(spring({ frame: frame - delay, fps: FPS, config: { mass: 0.6, damping: 14 } }), [0, 1], [40, 0]);
          return (
            <div key={i} style={{ opacity: op, transform: `translateY(${y}px)`, background: '#161b22', border: `2px solid ${item.color}44`, borderRadius: 16, padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ fontSize: 52, filter: `drop-shadow(0 0 12px ${item.color}88)` }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 18, color: '#8b949e' }}>{item.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
      {/* 结论文字 */}
      <div style={{ marginTop: 40, opacity: interpolate(frame, [120, 150], [0, 1], { extrapolateRight: 'clamp' }), fontSize: 20, color: '#aaa', background: 'rgba(192,57,43,0.08)', borderLeft: '4px solid #c0392b', padding: '14px 22px', borderRadius: 8 }}>
        三重矛盾叠加：封建专制 + 劳资对立 + 一战危机 &nbsp;→&nbsp; 革命一触即发
      </div>
    </AbsoluteFill>
  );
};

// ===== 场景3：二月革命 (15-23s = 450-690f) =====
const SceneFebruary: React.FC = () => {
  const frame = useCurrentFrame();

  const steps = [
    { date: '1917.3', event: '彼得格勒工人大罢工', color: '#e67e22' },
    { date: '1917.3', event: '士兵拒绝镇压，倒戈支持', color: '#f1c40f' },
    { date: '1917.3', event: '尼古拉二世退位', color: '#c0392b' },
    { date: '1917.3', event: '临时政府成立（资产阶级掌权）', color: '#2980b9' },
    { date: '1917.3', event: '工人苏维埃同时成立（两权并立）', color: '#27ae60' },
  ];

  return (
    <AbsoluteFill style={{ background: '#0d1117', padding: '60px 80px', fontFamily: '"PingFang SC","Microsoft YaHei",SimHei,sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontSize: 44, fontWeight: 800, color: '#fff', marginBottom: 40, opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }) }}>
        <span style={{ color: '#e74c3c' }}>02</span> &nbsp;二月革命——推翻沙皇的前奏
      </div>
      {/* 步骤逐项生长 */}
      {steps.map((step, i) => {
        const delay = i * 30;
        const op = interpolate(frame, [delay, delay + 25], [0, 1], { extrapolateRight: 'clamp' });
        const x = interpolate(spring({ frame: frame - delay, fps: FPS, config: { mass: 0.5, damping: 12 } }), [0, 1], [-60, 0]);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 22, opacity: op, transform: `translateX(${x}px)` }}>
            {/* 时间线竖线 */}
            <div style={{ width: 3, height: i < steps.length - 1 ? 68 : 0, background: `linear-gradient(${step.color}, transparent)`, position: 'absolute', left: 97, top: 120 + i * 68, borderRadius: 2 }} />
            {/* 圆圈 */}
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: step.color, flexShrink: 0, boxShadow: `0 0 12px ${step.color}88` }} />
            {/* 日期 */}
            <div style={{ fontSize: 16, color: '#555', width: 80, flexShrink: 0 }}>{step.date}</div>
            {/* 事件 */}
            <div style={{ fontSize: 24, color: '#fff', fontWeight: 600 }}>{step.event}</div>
          </div>
        );
      })}
      {/* 关键结论 */}
      <div style={{ marginTop: 24, opacity: interpolate(frame, [160, 190], [0, 1], { extrapolateRight: 'clamp' }), background: 'rgba(41,128,185,0.1)', border: '1px solid #2980b944', borderRadius: 12, padding: '16px 24px', fontSize: 20, color: '#aaa' }}>
        ⚠️ 临时政府继续战争，拒绝解决土地问题 → 为十月革命埋下伏笔
      </div>
    </AbsoluteFill>
  );
};

// ===== 场景4：十月革命爆发 (23-33s = 690-990f) =====
const SceneOctober: React.FC = () => {
  const frame = useCurrentFrame();

  const events = [
    { time: '11月6日 夜', event: '革命军委下令起义', icon: '📋' },
    { time: '11月7日 凌晨', event: '占领电话局、车站、银行', icon: '🏛️' },
    { time: '11月7日 21:45', event: '阿芙乐尔号炮声响起', icon: '💥' },
    { time: '11月8日 凌晨2时', event: '攻占冬宫，临时政府覆灭', icon: '⭐' },
    { time: '11月8日 清晨', event: '苏维埃政权正式宣告成立', icon: '🚩' },
  ];

  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, #1a0808 0%, #0d1117 70%)', padding: '60px 80px', fontFamily: '"PingFang SC","Microsoft YaHei",SimHei,sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontSize: 44, fontWeight: 800, color: '#fff', marginBottom: 44, opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }) }}>
        <span style={{ color: '#e74c3c' }}>03</span> &nbsp;十月起义——历史的转折点
        <div style={{ fontSize: 20, fontWeight: 400, color: '#888', marginTop: 6 }}>1917年11月7日（俄历10月25日）· 彼得格勒</div>
      </div>

      {/* 事件卡片 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {events.map((ev, i) => {
          const delay = i * 28;
          const op = interpolate(frame, [delay, delay + 28], [0, 1], { extrapolateRight: 'clamp' });
          const s = spring({ frame: frame - delay, fps: FPS, config: { mass: 0.5, damping: 11 } });
          const y = interpolate(s, [0, 1], [30, 0]);
          const isClimax = i === 2; // 阿芙乐尔炮声

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, opacity: op, transform: `translateY(${y}px)`, background: isClimax ? 'rgba(192,57,43,0.18)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isClimax ? '#c0392b' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, padding: '16px 24px' }}>
              <div style={{ fontSize: 36 }}>{ev.icon}</div>
              <div style={{ fontSize: 14, color: '#666', width: 160, flexShrink: 0 }}>{ev.time}</div>
              <div style={{ fontSize: 22, color: isClimax ? '#e74c3c' : '#e6edf3', fontWeight: isClimax ? 800 : 600 }}>{ev.event}</div>
              {isClimax && <div style={{ marginLeft: 'auto', fontSize: 28, animation: 'none', opacity: interpolate(frame, [delay + 20, delay + 50], [0, 1], { extrapolateRight: 'clamp' }) }}>💥</div>}
            </div>
          );
        })}
      </div>

      {/* 胜利结语 */}
      <div style={{ marginTop: 32, opacity: interpolate(frame, [170, 200], [0, 1], { extrapolateRight: 'clamp' }), textAlign: 'center', fontSize: 28, fontWeight: 800, color: '#e74c3c', textShadow: '0 0 20px #c0392b88', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.3)', borderRadius: 12, padding: '18px 32px' }}>
        🚩 人类历史上第一个社会主义国家诞生！
      </div>
    </AbsoluteFill>
  );
};

// ===== 场景5：历史意义 (33-42s = 990-1260f) =====
const SceneSignificance: React.FC = () => {
  const frame = useCurrentFrame();

  const impacts = [
    { icon: '🌍', title: '打破资本主义格局', desc: '第一个社会主义国家建立', color: '#c0392b' },
    { icon: '⭐', title: '推动社会主义运动', desc: '共产国际1919年成立', color: '#f1c40f' },
    { icon: '🏳️', title: '民族解放运动', desc: '推动亚非拉独立运动', color: '#27ae60' },
    { icon: '🇨🇳', title: '影响中国革命', desc: '传播马克思列宁主义', color: '#2980b9' },
  ];

  return (
    <AbsoluteFill style={{ background: '#0d1117', padding: '60px 80px', fontFamily: '"PingFang SC","Microsoft YaHei",SimHei,sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontSize: 44, fontWeight: 800, color: '#fff', marginBottom: 48, opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }) }}>
        <span style={{ color: '#e74c3c' }}>04</span> &nbsp;历史意义——改变世界的革命
      </div>
      {/* 影响卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {impacts.map((item, i) => {
          const delay = i * 30;
          const op = interpolate(frame, [delay, delay + 30], [0, 1], { extrapolateRight: 'clamp' });
          const s = spring({ frame: frame - delay, fps: FPS, config: { mass: 0.7, damping: 14 } });
          const scale = interpolate(s, [0, 1], [0.7, 1]);
          return (
            <div key={i} style={{ opacity: op, transform: `scale(${scale})`, background: 'rgba(255,255,255,0.03)', border: `2px solid ${item.color}55`, borderRadius: 16, padding: '28px', textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>{item.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>{item.title}</div>
              <div style={{ fontSize: 18, color: '#8b949e' }}>{item.desc}</div>
            </div>
          );
        })}
      </div>
      {/* 核心定论 */}
      <div style={{ marginTop: 40, opacity: interpolate(frame, [140, 170], [0, 1], { extrapolateRight: 'clamp' }), textAlign: 'center', fontSize: 22, color: '#aaa', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 28 }}>
        "十月革命一声炮响，给中国送来了马克思列宁主义。"
        <div style={{ fontSize: 16, color: '#555', marginTop: 8 }}>——毛泽东《论人民民主专政》</div>
      </div>
    </AbsoluteFill>
  );
};

// ===== 场景6：总结 (42-48s = 1260-1440f) =====
const SceneSummary: React.FC = () => {
  const frame = useCurrentFrame();

  const chain = ['一战危机', '社会矛盾激化', '二月革命', '十月起义', '苏维埃政权', '世界历史转折'];

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #0d1117 0%, #1a0a0a 100%)', padding: '60px 80px', fontFamily: '"PingFang SC","Microsoft YaHei",SimHei,sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', marginBottom: 52, opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }), textAlign: 'center' }}>
        本节小结 · 革命因果链
      </div>

      {/* 链式节点 */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 0 }}>
        {chain.map((node, i) => {
          const delay = i * 22;
          const op = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateRight: 'clamp' });
          const s = spring({ frame: frame - delay, fps: FPS, config: { mass: 0.5, damping: 12 } });
          const y = interpolate(s, [0, 1], [20, 0]);
          return (
            <React.Fragment key={i}>
              <div style={{ opacity: op, transform: `translateY(${y}px)`, background: `rgba(192,57,43,${0.3 + i * 0.1})`, border: '2px solid #e74c3c', borderRadius: 32, padding: '12px 24px', fontSize: 20, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
                {node}
              </div>
              {i < chain.length - 1 && (
                <div style={{ opacity: interpolate(frame, [delay + 15, delay + 30], [0, 1], { extrapolateRight: 'clamp' }), fontSize: 28, color: '#e74c3c', padding: '0 8px' }}>→</div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 结语 */}
      <div style={{ marginTop: 52, opacity: interpolate(frame, [150, 180], [0, 1], { extrapolateRight: 'clamp' }), textAlign: 'center', maxWidth: 900 }}>
        <div style={{ fontSize: 22, color: '#e6edf3', lineHeight: 1.8 }}>
          俄国十月革命——人类历史上第一次成功的社会主义革命
        </div>
        <div style={{ fontSize: 18, color: '#8b949e', marginTop: 14, lineHeight: 1.8 }}>
          建立了世界上第一个社会主义国家，深刻改变了20世纪世界历史格局
        </div>
      </div>

      {/* TeachAny 署名 */}
      <div style={{ position: 'absolute', bottom: 36, opacity: interpolate(frame, [170, 200], [0, 1], { extrapolateRight: 'clamp' }), fontSize: 16, color: '#333', fontFamily: 'Georgia, serif' }}>
        TeachAny · 初中历史 · 9年级 · hist-m-russian-revolution
      </div>
    </AbsoluteFill>
  );
};

// ===== 主 Composition =====
// 总时长：48秒 = 1440帧 @30fps
// Scene1: 0-150f (5s) 开场标题
// Scene2: 150-450f (10s) 背景危机
// Scene3: 450-690f (8s) 二月革命
// Scene4: 690-990f (10s) 十月起义
// Scene5: 990-1260f (9s) 历史意义
// Scene6: 1260-1440f (6s) 总结

export const RussianRevolutionVideo: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  // 全局背景音效（轻微背景音）
  const bgOp = interpolate(frame, [0, 30, durationInFrames - 30, durationInFrames], [0, 0.3, 0.3, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={150}>
        <SceneIntro />
      </Sequence>
      <Sequence from={150} durationInFrames={300}>
        <SceneBackground />
      </Sequence>
      <Sequence from={450} durationInFrames={240}>
        <SceneFebruary />
      </Sequence>
      <Sequence from={690} durationInFrames={300}>
        <SceneOctober />
      </Sequence>
      <Sequence from={990} durationInFrames={270}>
        <SceneSignificance />
      </Sequence>
      <Sequence from={1260} durationInFrames={180}>
        <SceneSummary />
      </Sequence>

      {/* TTS 旁白音频 */}
      <Sequence from={0} durationInFrames={150}>
        <Audio src={staticFile('audio/seg01_intro.mp3')} volume={1} />
      </Sequence>
      <Sequence from={150} durationInFrames={300}>
        <Audio src={staticFile('audio/seg02_background.mp3')} volume={1} />
      </Sequence>
      <Sequence from={450} durationInFrames={240}>
        <Audio src={staticFile('audio/seg03_february.mp3')} volume={1} />
      </Sequence>
      <Sequence from={690} durationInFrames={300}>
        <Audio src={staticFile('audio/seg05_october.mp3')} volume={1} />
      </Sequence>
      <Sequence from={990} durationInFrames={270}>
        <Audio src={staticFile('audio/seg07_significance.mp3')} volume={1} />
      </Sequence>
      <Sequence from={1260} durationInFrames={180}>
        <Audio src={staticFile('audio/seg08_summary.mp3')} volume={1} />
      </Sequence>
    </AbsoluteFill>
  );
};
