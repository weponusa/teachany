import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#0a1628", bg2: "#0f2040", text: "#f0f9ff", muted: "#94a3b8",
  egg: "#fbbf24", larva: "#34d399", pupa: "#a78bfa", adult: "#38bdf8",
  frog: "#34d399", mammal: "#f472b6", pink: "#f472b6",
};

// ── 场景1：标题 ────────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleY = interpolate(frame, [0, 18], [50, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [18, 35], [0, 1], { extrapolateRight: "clamp" });
  const emojiScale = spring({ frame: frame - 30, fps, config: { stiffness: 120, damping: 14 } });

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 60% 30%, rgba(56,189,248,.2) 0%, transparent 60%), ${C.bg}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ fontSize: 100, transform: `scale(${Math.min(emojiScale, 1)})`, marginBottom: 30 }}>🦋</div>
      <div style={{
        fontSize: 88, fontWeight: 900, color: "#fff",
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: "linear-gradient(135deg,#fff 30%,#38bdf8 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>动物的生长与繁殖</div>
      <div style={{
        marginTop: 24, fontSize: 36, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>小学科学 G3 · 生命科学</div>
      <div style={{
        marginTop: 40, display: "flex", gap: 28, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {["🥚 卵生胎生", "🦋 变态发育", "🐸 青蛙一生"].map((t, i) => (
          <div key={i} style={{
            padding: "12px 28px", borderRadius: 99,
            background: "rgba(56,189,248,.15)", border: "1px solid rgba(56,189,248,.35)",
            color: C.adult, fontSize: 28,
          }}>{t}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2：卵生 vs 胎生 ───────────────────────────────
const BirthScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const leftOp = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const rightOp = interpolate(frame, [35, 55], [0, 1], { extrapolateRight: "clamp" });
  const statsOp = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });

  const oviExamples = ["🐔 鸡", "🐸 青蛙", "🐟 鱼", "🦋 蝴蝶", "🐢 乌龟"];
  const vivExamples = ["🐱 猫", "🐕 狗", "🐰 兔", "🐘 大象", "🐬 海豚"];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 55, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>繁殖方式：卵生 vs 胎生</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 10 }}>动物宝宝出生的两种方式</div>
      </div>

      <div style={{ position: "absolute", top: 160, left: 60, right: 60, display: "flex", gap: 40 }}>
        {/* 卵生 */}
        <div style={{
          flex: 1, background: "rgba(251,191,36,.08)",
          border: "2px solid rgba(251,191,36,.5)", borderRadius: 20,
          padding: "32px 28px", opacity: leftOp,
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🥚</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: C.egg, marginBottom: 16,
            fontFamily: "'PingFang SC',sans-serif" }}>卵生动物</div>
          <div style={{ fontSize: 26, color: "#fff", lineHeight: 1.7,
            fontFamily: "'PingFang SC',sans-serif" }}>
            妈妈产卵，宝宝从蛋里孵出<br/>
            卵外有壳保护<br/>
            需要保温孵化
          </div>
          <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 10 }}>
            {oviExamples.map((e, i) => (
              <div key={i} style={{
                padding: "6px 14px", borderRadius: 99,
                background: "rgba(251,191,36,.15)", border: "1px solid rgba(251,191,36,.3)",
                color: C.egg, fontSize: 22, fontFamily: "'PingFang SC',sans-serif",
              }}>{e}</div>
            ))}
          </div>
        </div>

        {/* 胎生 */}
        <div style={{
          flex: 1, background: "rgba(244,114,182,.08)",
          border: "2px solid rgba(244,114,182,.5)", borderRadius: 20,
          padding: "32px 28px", opacity: rightOp,
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🍼</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: C.pink, marginBottom: 16,
            fontFamily: "'PingFang SC',sans-serif" }}>胎生动物</div>
          <div style={{ fontSize: 26, color: "#fff", lineHeight: 1.7,
            fontFamily: "'PingFang SC',sans-serif" }}>
            妈妈直接生出宝宝<br/>
            宝宝在妈妈体内发育<br/>
            出生后喂乳汁（哺乳）
          </div>
          <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 10 }}>
            {vivExamples.map((e, i) => (
              <div key={i} style={{
                padding: "6px 14px", borderRadius: 99,
                background: "rgba(244,114,182,.15)", border: "1px solid rgba(244,114,182,.3)",
                color: C.pink, fontSize: 22, fontFamily: "'PingFang SC',sans-serif",
              }}>{e}</div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部统计 */}
      <div style={{
        position: "absolute", bottom: 40, left: 0, right: 0,
        textAlign: "center", opacity: statsOp,
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 28, color: C.muted,
      }}>
        💡 地球上约 <span style={{ color: C.egg, fontWeight: 700 }}>75%</span> 的动物是卵生 ·
        约 <span style={{ color: C.pink, fontWeight: 700 }}>25%</span> 是胎生（全为哺乳动物）
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：完全变态发育 ────────────────────────────────
const MetaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const stages = [
    { icon: "🥚", name: "① 卵", desc: "产在叶片上\n很小很小", color: C.egg },
    { icon: "🐛", name: "② 幼虫", desc: "毛毛虫\n不停吃叶子", color: C.larva },
    { icon: "🫧", name: "③ 蛹", desc: "裹入茧中\n大变身！", color: C.pupa },
    { icon: "🦋", name: "④ 成虫", desc: "美丽蝴蝶\n破蛹而出", color: C.adult },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 55, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>🦋 完全变态发育</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 10 }}>蝴蝶的四次变身 · 卵→幼虫→蛹→成虫</div>
      </div>

      {/* 四阶段 */}
      <div style={{
        position: "absolute", top: 160, left: 60, right: 60,
        display: "flex", alignItems: "center", justifyContent: "space-around",
      }}>
        {stages.map((s, i) => {
          const delay = 20 + i * 20;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 90, damping: 18 } });
          const op = Math.min(prog, 1);
          const sc = 0.5 + 0.5 * Math.min(prog, 1);

          return (
            <React.Fragment key={s.name}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                opacity: op, transform: `scale(${sc})`,
              }}>
                <div style={{
                  width: 160, height: 160, borderRadius: "50%",
                  background: s.color + "1a", border: `4px solid ${s.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 80, marginBottom: 20,
                  boxShadow: `0 0 30px ${s.color}44`,
                }}>{s.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: s.color,
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 10 }}>{s.name}</div>
                <div style={{ fontSize: 22, color: "#cbd5e1", textAlign: "center",
                  fontFamily: "'PingFang SC',sans-serif", lineHeight: 1.5, whiteSpace: "pre-line" }}>{s.desc}</div>
              </div>
              {i < stages.length - 1 && (
                <div style={{
                  fontSize: 50, color: C.muted,
                  opacity: interpolate(frame, [delay + 25, delay + 40], [0, 1], { extrapolateRight: "clamp" }),
                  marginBottom: 60,
                }}>→</div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 底部对比 */}
      <div style={{
        position: "absolute", bottom: 40, left: 60, right: 60,
        opacity: interpolate(frame, [100, 120], [0, 1], { extrapolateRight: "clamp" }),
        display: "flex", gap: 30, fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ flex: 1, background: "rgba(56,189,248,.08)", borderRadius: 12, padding: "16px 20px",
          border: "1px solid rgba(56,189,248,.3)" }}>
          <span style={{ color: C.adult, fontWeight: 700, fontSize: 26 }}>完全变态（4步）：</span>
          <span style={{ color: "#cbd5e1", fontSize: 24 }}>蝴蝶🦋 蜜蜂🐝 蚊子🦟 蚂蚁🐜</span>
        </div>
        <div style={{ flex: 1, background: "rgba(167,139,250,.08)", borderRadius: 12, padding: "16px 20px",
          border: "1px solid rgba(167,139,250,.3)" }}>
          <span style={{ color: C.pupa, fontWeight: 700, fontSize: 26 }}>不完全变态（3步）：</span>
          <span style={{ color: "#cbd5e1", fontSize: 24 }}>蟋蟀🦗 蟑螂🪳 蚱蜢 蜻蜓</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：青蛙一生 ────────────────────────────────────
const FrogScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const steps = [
    { icon: "🫧", name: "受精卵", desc: "水中产卵\n聚成一团" },
    { icon: "🐟", name: "蝌蚪", desc: "有尾巴\n鳃呼吸" },
    { icon: "🐸", name: "长后腿", desc: "后腿萌出\n尾巴缩短" },
    { icon: "🐸", name: "长前腿", desc: "四肢完整\n开始上岸" },
    { icon: "🐸", name: "小青蛙", desc: "肺+皮肤\n两栖生活" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 55, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>🐸 青蛙的一生</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 10 }}>两栖动物 · 从水到陆 · 不完全变态</div>
      </div>

      {/* 步骤 */}
      <div style={{
        position: "absolute", top: 165, left: 40, right: 40,
        display: "flex", alignItems: "center", justifyContent: "space-around",
      }}>
        {steps.map((s, i) => {
          const delay = 15 + i * 18;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 80, damping: 20 } });
          const op = Math.min(prog, 1);

          return (
            <React.Fragment key={s.name}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                opacity: op,
              }}>
                <div style={{
                  width: 130, height: 130, borderRadius: 20,
                  background: "rgba(52,211,153,.1)", border: "2px solid rgba(52,211,153,.5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 68, marginBottom: 16,
                }}>{s.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: C.frog,
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 6 }}>{s.name}</div>
                <div style={{ fontSize: 20, color: "#94a3b8", textAlign: "center",
                  fontFamily: "'PingFang SC',sans-serif", lineHeight: 1.5, whiteSpace: "pre-line" }}>{s.desc}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  fontSize: 40, color: C.muted, marginBottom: 60,
                  opacity: interpolate(frame, [delay + 20, delay + 30], [0, 1], { extrapolateRight: "clamp" }),
                }}>→</div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 底部说明 */}
      <div style={{
        position: "absolute", bottom: 44, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [95, 115], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 28, color: "#a5f3fc" }}>
          💡 青蛙 = 卵生 + 不完全变态 + 两栖动物 ← 三个重点一次记住！
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：总结 ─────────────────────────────────────────
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const points = [
    { icon: "🥚", color: C.egg,   title: "发现一", text: "卵生 vs 胎生\n两种繁殖方式" },
    { icon: "🦋", color: C.adult, title: "发现二", text: "完全变态（4步）\n不完全变态（3步）" },
    { icon: "🐸", color: C.frog,  title: "发现三", text: "青蛙：两栖动物\n卵→蝌蚪→青蛙" },
    { icon: "🐱", color: C.pink,  title: "发现四", text: "哺乳动物：胎生+哺乳\n亲代照顾最长" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(56,189,248,.08) 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute", top: 55, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>🎯 今天的四大发现</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 10 }}>动物的生长与繁殖 · 核心要点</div>
      </div>

      <div style={{
        position: "absolute", top: 165, left: 60, right: 60,
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr", gap: 24,
      }}>
        {points.map((p, i) => {
          const delay = 20 + i * 18;
          const op = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 20], [16, 0], { extrapolateRight: "clamp" });
          return (
            <div key={p.title} style={{
              background: "rgba(15,32,64,.9)", borderRadius: 20, padding: "28px 24px",
              border: `2px solid ${p.color}44`,
              display: "flex", gap: 20, alignItems: "flex-start",
              opacity: op, transform: `translateY(${y}px)`,
            }}>
              <div style={{ fontSize: 64, flexShrink: 0 }}>{p.icon}</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: p.color,
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 8 }}>{p.title}</div>
                <div style={{ fontSize: 26, color: "#e2e8f0",
                  fontFamily: "'PingFang SC',sans-serif", lineHeight: 1.6, whiteSpace: "pre-line" }}>{p.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ─────────────────────────────────────
export const AnimalLifeCycleVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0} durationInFrames={90}><TitleScene /></Sequence>
      <Sequence from={90} durationInFrames={150}><BirthScene /></Sequence>
      <Sequence from={240} durationInFrames={150}><MetaScene /></Sequence>
      <Sequence from={390} durationInFrames={150}><FrogScene /></Sequence>
      <Sequence from={540} durationInFrames={120}><SummaryScene /></Sequence>
    </AbsoluteFill>
  );
};
