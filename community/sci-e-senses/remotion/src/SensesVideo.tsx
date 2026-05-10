import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#0a1628", bg2: "#0f2040", text: "#f0f9ff", muted: "#94a3b8",
  sight: "#fbbf24",    // 视觉 - 金黄
  hearing: "#38bdf8",  // 听觉 - 天蓝
  smell: "#34d399",    // 嗅觉 - 翠绿
  taste: "#f472b6",    // 味觉 - 粉红
  touch: "#a78bfa",    // 触觉 - 紫色
};

// ── 场景1：标题 ──────────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const emojiScale = spring({ frame: frame - 35, fps, config: { stiffness: 110, damping: 14 } });
  const badgeOp = interpolate(frame, [45, 65], [0, 1], { extrapolateRight: "clamp" });

  const senses = [
    { emoji: "👁️", label: "视觉", color: C.sight },
    { emoji: "👂", label: "听觉", color: C.hearing },
    { emoji: "👃", label: "嗅觉", color: C.smell },
    { emoji: "👅", label: "味觉", color: C.taste },
    { emoji: "🖐️", label: "触觉", color: C.touch },
  ];

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 60% 30%, rgba(251,191,36,.15) 0%, transparent 55%),
                   radial-gradient(ellipse at 20% 70%, rgba(56,189,248,.1) 0%, transparent 50%), ${C.bg}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* 五感 emoji 排列 */}
      <div style={{
        display: "flex", gap: 36, marginBottom: 40,
        transform: `scale(${Math.min(emojiScale, 1)})`,
      }}>
        {senses.map((s) => (
          <div key={s.label} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              background: s.color + "22", border: `3px solid ${s.color}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 54, boxShadow: `0 0 24px ${s.color}44`,
            }}>{s.emoji}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color,
              fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 主标题 */}
      <div style={{
        fontSize: 92, fontWeight: 900,
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: "linear-gradient(135deg,#fff 30%,#fbbf24 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>人的感官</div>

      <div style={{
        marginTop: 20, fontSize: 36, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>小学科学 G2 · 生命科学</div>

      {/* 徽章行 */}
      <div style={{
        marginTop: 40, display: "flex", gap: 24, opacity: badgeOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {["🔍 感官功能", "⚠️ 感官局限", "🛡️ 保护感官", "🧠 综合观察"].map((t, i) => (
          <div key={i} style={{
            padding: "12px 26px", borderRadius: 99,
            background: "rgba(251,191,36,.12)", border: "1px solid rgba(251,191,36,.35)",
            color: C.sight, fontSize: 26,
          }}>{t}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2：五种感官器官逐一出现 ─────────────────────────
const SensesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const senses = [
    { emoji: "👁️", organ: "眼睛", sense: "视觉", desc: "看颜色、形状、远近\n约80%信息来自视觉", color: C.sight, delay: 15 },
    { emoji: "👂", organ: "耳朵", sense: "听觉", desc: "听各种声音\n辨别方向和距离", color: C.hearing, delay: 35 },
    { emoji: "👃", organ: "鼻子", sense: "嗅觉", desc: "闻数千种气味\n与味觉紧密相连", color: C.smell, delay: 55 },
    { emoji: "👅", organ: "舌头", sense: "味觉", desc: "尝甜酸苦咸鲜\n五种基本味道", color: C.taste, delay: 75 },
    { emoji: "🖐️", organ: "皮肤", sense: "触觉", desc: "感受冷热轻重\n手指尖最灵敏", color: C.touch, delay: 95 },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>👁️ 五种感官 · 认识我们的身体</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 10 }}>每个感官都有专属器官和独特功能</div>
      </div>

      <div style={{
        position: "absolute", top: 155, left: 50, right: 50,
        display: "flex", gap: 30, justifyContent: "center",
      }}>
        {senses.map((s) => {
          const prog = spring({ frame: frame - s.delay, fps, config: { stiffness: 90, damping: 18 } });
          const op = Math.min(prog, 1);
          const sc = 0.4 + 0.6 * Math.min(prog, 1);
          return (
            <div key={s.sense} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              opacity: op, transform: `scale(${sc})`,
              background: s.color + "0d",
              border: `2px solid ${s.color}55`,
              borderRadius: 20, padding: "28px 16px",
            }}>
              <div style={{
                width: 120, height: 120, borderRadius: "50%",
                background: s.color + "22", border: `4px solid ${s.color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 66, marginBottom: 20,
                boxShadow: `0 0 28px ${s.color}55`,
              }}>{s.emoji}</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: s.color,
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 6 }}>{s.organ}</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: "#e2e8f0",
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 10,
                background: s.color + "22", padding: "4px 12px", borderRadius: 99,
              }}>{s.sense}</div>
              <div style={{ fontSize: 20, color: "#94a3b8", textAlign: "center",
                fontFamily: "'PingFang SC',sans-serif", lineHeight: 1.6, whiteSpace: "pre-line" }}>{s.desc}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：感官功能展示（视觉+听觉详细） ────────────────
const FunctionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const factOp = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });

  const items = [
    { emoji: "👁️", color: C.sight, title: "视觉 — 眼睛", facts: ["识别颜色：可分辨约1000万种颜色", "测量距离：双眼立体视觉", "错觉现象：眼睛会被骗！"], delay: 15 },
    { emoji: "👃", color: C.smell, title: "嗅觉 & 味觉", facts: ["鼻子能闻约1万种气味", "舌头有10,000个味蕾", "感冒时嗅觉失灵 → 食物没味道"], delay: 50 },
    { emoji: "🖐️", color: C.touch, title: "触觉 — 皮肤", facts: ["皮肤面积约1.5~2平方米", "手指尖触觉最灵敏", "感受：冷热、压力、疼痛、质感"], delay: 85 },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>🔬 感官的神奇功能</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 10 }}>数字解读 · 感官能力大揭秘</div>
      </div>

      <div style={{
        position: "absolute", top: 160, left: 60, right: 60,
        display: "flex", gap: 36, alignItems: "flex-start",
      }}>
        {items.map((item) => {
          const prog = spring({ frame: frame - item.delay, fps, config: { stiffness: 80, damping: 20 } });
          const op = Math.min(prog, 1);
          const y = interpolate(prog, [0, 1], [30, 0]);
          return (
            <div key={item.title} style={{
              flex: 1, opacity: op, transform: `translateY(${y}px)`,
              background: item.color + "0d", border: `2px solid ${item.color}44`,
              borderRadius: 20, padding: "28px 24px",
            }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>{item.emoji}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: item.color,
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 20 }}>{item.title}</div>
              {item.facts.map((fact, fi) => {
                const fo = interpolate(frame, [item.delay + 20 + fi * 18, item.delay + 38 + fi * 18], [0, 1], { extrapolateRight: "clamp" });
                return (
                  <div key={fi} style={{
                    display: "flex", gap: 14, alignItems: "flex-start",
                    marginBottom: 16, opacity: fo,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: item.color + "33", border: `2px solid ${item.color}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 800, color: item.color,
                      flexShrink: 0, marginTop: 3, fontFamily: "sans-serif",
                    }}>{fi + 1}</div>
                    <div style={{ fontSize: 24, color: "#cbd5e1",
                      fontFamily: "'PingFang SC',sans-serif", lineHeight: 1.5 }}>{fact}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* 底部提示 */}
      <div style={{
        position: "absolute", bottom: 40, left: 0, right: 0,
        textAlign: "center", opacity: factOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 28, color: "#fcd34d" }}>
          💡 嗅觉 + 味觉 = 好朋友！感冒鼻塞时食物会变得没味道，这是真的！
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：保护感官 ──────────────────────────────────────
const ProtectScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const tips = [
    {
      icon: "👁️", organ: "保护眼睛", color: C.sight, delay: 15,
      items: ["❌ 不在暗处看书", "📏 保持读书距离30cm+", "🌙 睡前减少电子屏幕", "🌿 多看远方放松眼睛"],
    },
    {
      icon: "👂", organ: "保护耳朵", color: C.hearing, delay: 45,
      items: ["🔇 避免长时间噪音", "❌ 不把东西插入耳道", "🎧 耳机音量不超60%", "💊 感冒时注意保护"],
    },
    {
      icon: "👃🖐️", organ: "保护鼻子和皮肤", color: C.smell, delay: 75,
      items: ["❌ 不挖鼻孔避免受伤", "😷 空气污染时戴口罩", "🧴 保持皮肤清洁湿润", "⚠️ 皮肤受伤及时处理"],
    },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>🛡️ 保护我们的感官</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 10 }}>感官受损很难恢复，日常好习惯很重要！</div>
      </div>

      <div style={{ position: "absolute", top: 160, left: 50, right: 50, display: "flex", gap: 30 }}>
        {tips.map((tip) => {
          const prog = spring({ frame: frame - tip.delay, fps, config: { stiffness: 80, damping: 20 } });
          const op = Math.min(prog, 1);
          const y = interpolate(prog, [0, 1], [24, 0]);
          return (
            <div key={tip.organ} style={{
              flex: 1, opacity: op, transform: `translateY(${y}px)`,
              background: tip.color + "0d", border: `2px solid ${tip.color}44`,
              borderRadius: 20, padding: "28px 22px",
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{tip.icon}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: tip.color,
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 20 }}>{tip.organ}</div>
              {tip.items.map((item, ii) => {
                const io = interpolate(frame, [tip.delay + 20 + ii * 15, tip.delay + 35 + ii * 15], [0, 1], { extrapolateRight: "clamp" });
                return (
                  <div key={ii} style={{
                    fontSize: 22, color: "#e2e8f0", lineHeight: 1.7,
                    fontFamily: "'PingFang SC',sans-serif",
                    opacity: io, marginBottom: 8,
                    paddingLeft: 8, borderLeft: `3px solid ${tip.color}66`,
                  }}>{item}</div>
                );
              })}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：总结 ──────────────────────────────────────────
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const senses = [
    { emoji: "👁️", color: C.sight,   organ: "眼睛", sense: "视觉", desc: "看颜色形状远近\n约80%信息来自视觉" },
    { emoji: "👂", color: C.hearing, organ: "耳朵", sense: "听觉", desc: "听各种声音\n辨别方向距离" },
    { emoji: "👃", color: C.smell,   organ: "鼻子", sense: "嗅觉", desc: "闻数千种气味\n与味觉紧密相连" },
    { emoji: "👅", color: C.taste,   organ: "舌头", sense: "味觉", desc: "甜酸苦咸鲜\n10,000个味蕾" },
    { emoji: "🖐️", color: C.touch,  organ: "皮肤", sense: "触觉", desc: "冷热轻重疼痛\n手指尖最灵敏" },
  ];

  const tipOp = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute",
        background: "radial-gradient(ellipse at 50% 40%, rgba(251,191,36,.07) 0%, transparent 70%)",
        inset: 0,
      }} />
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>🎯 五感总结卡</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 10 }}>用多种感官观察 → 获得更全面的信息！</div>
      </div>

      <div style={{
        position: "absolute", top: 160, left: 50, right: 50,
        display: "flex", gap: 24, justifyContent: "center",
      }}>
        {senses.map((s, i) => {
          const delay = 20 + i * 16;
          const op = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 20], [20, 0], { extrapolateRight: "clamp" });
          return (
            <div key={s.sense} style={{
              flex: 1, opacity: op, transform: `translateY(${y}px)`,
              background: s.color + "0f", border: `2px solid ${s.color}55`,
              borderRadius: 20, padding: "24px 16px", textAlign: "center",
            }}>
              <div style={{ fontSize: 58, marginBottom: 14 }}>{s.emoji}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color,
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 4 }}>{s.organ}</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: "#e2e8f0",
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 10,
                background: s.color + "22", padding: "3px 10px", borderRadius: 99,
                display: "inline-block",
              }}>{s.sense}</div>
              <div style={{ fontSize: 18, color: "#94a3b8", textAlign: "center",
                fontFamily: "'PingFang SC',sans-serif", lineHeight: 1.6, whiteSpace: "pre-line",
                marginTop: 8 }}>{s.desc}</div>
            </div>
          );
        })}
      </div>

      {/* 底部核心提示 */}
      <div style={{
        position: "absolute", bottom: 38, left: 60, right: 60,
        opacity: tipOp, textAlign: "center",
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{
          background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.3)",
          borderRadius: 16, padding: "18px 32px", display: "inline-block",
        }}>
          <span style={{ fontSize: 32, color: "#fcd34d", fontWeight: 700 }}>
            🌟 感官是我们了解世界的窗口，好好保护它们！
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ───────────────────────────────────────
export const SensesVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      {/* 场景1：标题 0-90帧 */}
      <Sequence from={0} durationInFrames={90}><TitleScene /></Sequence>
      {/* 场景2：五感器官逐一出现 90-240帧 */}
      <Sequence from={90} durationInFrames={150}><SensesScene /></Sequence>
      {/* 场景3：感官功能展示 240-390帧 */}
      <Sequence from={240} durationInFrames={150}><FunctionScene /></Sequence>
      {/* 场景4：保护感官 390-540帧 */}
      <Sequence from={390} durationInFrames={150}><ProtectScene /></Sequence>
      {/* 场景5：总结 540-660帧 */}
      <Sequence from={540} durationInFrames={120}><SummaryScene /></Sequence>
    </AbsoluteFill>
  );
};
