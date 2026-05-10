import React from "react";
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const C = {
  bg: "#0a1628",
  bg2: "#0f2040",
  text: "#f0f9ff",
  muted: "#94a3b8",
  sunny: "#fbbf24",
  cloudy: "#93c5fd",
  overcast: "#94a3b8",
  rainy: "#38bdf8",
  snowy: "#e0f2fe",
  windy: "#a7f3d0",
  accent: "#38bdf8",
};

// ── 场景1：标题 ────────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 38], [0, 1], { extrapolateRight: "clamp" });
  const badgesOp = interpolate(frame, [38, 55], [0, 1], { extrapolateRight: "clamp" });
  const emojiScale = spring({ frame: frame - 5, fps, config: { stiffness: 100, damping: 14 } });

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 55% 35%, rgba(56,189,248,.25) 0%, rgba(251,191,36,.1) 50%, transparent 70%), ${C.bg}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* 天气图标动画 */}
      <div style={{
        fontSize: 110,
        transform: `scale(${Math.min(emojiScale, 1)})`,
        marginBottom: 30,
        filter: "drop-shadow(0 0 30px rgba(251,191,36,0.5))",
      }}>☀️</div>

      <div style={{
        fontSize: 92, fontWeight: 900,
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp,
        transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: "linear-gradient(135deg,#fff 30%,#38bdf8 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        letterSpacing: "0.05em",
      }}>天气的观察</div>

      <div style={{
        marginTop: 20, fontSize: 36, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
        letterSpacing: "0.08em",
      }}>小学科学 G1 · 地球与宇宙科学</div>

      <div style={{
        marginTop: 44, display: "flex", gap: 24, opacity: badgesOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        {["☀️ 晴雨风雪", "👁 观察天气", "📅 天气日历"].map((t, i) => (
          <div key={i} style={{
            padding: "12px 30px", borderRadius: 99,
            background: "rgba(56,189,248,.12)",
            border: "1px solid rgba(56,189,248,.35)",
            color: C.accent, fontSize: 28,
          }}>{t}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2：六种天气展示 ─────────────────────────────────
const WeatherTypesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const types = [
    { emoji: "☀️", name: "晴天", desc: "阳光明媚\n万里无云", color: C.sunny, glow: "rgba(251,191,36,0.4)" },
    { emoji: "🌤️", name: "多云", desc: "云朵遮日\n时晴时暗", color: C.cloudy, glow: "rgba(147,197,253,0.4)" },
    { emoji: "☁️", name: "阴天", desc: "厚云密布\n光线昏暗", color: C.overcast, glow: "rgba(148,163,184,0.4)" },
    { emoji: "🌧️", name: "雨天", desc: "水珠落下\n地面湿润", color: C.rainy, glow: "rgba(56,189,248,0.4)" },
    { emoji: "🌨️", name: "雪天", desc: "白色雪花\n覆盖大地", color: C.snowy, glow: "rgba(224,242,254,0.4)" },
    { emoji: "💨", name: "风天", desc: "树叶飘动\n旗子飞扬", color: C.windy, glow: "rgba(167,243,208,0.4)" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 48, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>六种常见天气</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>你今天遇到哪种天气了？</div>
      </div>

      {/* 2×3 网格 */}
      <div style={{
        position: "absolute", top: 148, left: 50, right: 50,
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows: "1fr 1fr", gap: 24,
      }}>
        {types.map((t, i) => {
          const delay = 12 + i * 16;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 100, damping: 16 } });
          const op = Math.min(prog, 1);
          const sc = 0.7 + 0.3 * Math.min(prog, 1);

          return (
            <div key={t.name} style={{
              background: `${t.color}10`,
              border: `2px solid ${t.color}50`,
              borderRadius: 18,
              padding: "24px 20px",
              display: "flex", flexDirection: "column", alignItems: "center",
              opacity: op, transform: `scale(${sc})`,
              boxShadow: `0 4px 20px ${t.glow}`,
            }}>
              <div style={{ fontSize: 72, marginBottom: 12, lineHeight: 1 }}>{t.emoji}</div>
              <div style={{
                fontSize: 34, fontWeight: 800, color: t.color,
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 8,
              }}>{t.name}</div>
              <div style={{
                fontSize: 22, color: "#cbd5e1", textAlign: "center",
                fontFamily: "'PingFang SC',sans-serif", lineHeight: 1.5,
                whiteSpace: "pre-line",
              }}>{t.desc}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：观察天气的方法 ────────────────────────────────
const ObserveScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const methods = [
    {
      icon: "👁",
      title: "看天空",
      color: "#38bdf8",
      glow: "rgba(56,189,248,0.35)",
      items: ["蓝天白云 → 晴天", "乌云密布 → 可能下雨", "云朵薄厚 → 判断阴晴"],
    },
    {
      icon: "🌡",
      title: "感受温度",
      color: "#fbbf24",
      glow: "rgba(251,191,36,0.35)",
      items: ["很热很热 → 夏日晴天", "冷冷的 → 冬天可能下雪", "凉爽舒服 → 秋天晴天"],
    },
    {
      icon: "🍃",
      title: "看树叶/旗子",
      color: "#34d399",
      glow: "rgba(52,211,153,0.35)",
      items: ["轻轻飘动 → 微风", "大幅摇摆 → 大风", "纹丝不动 → 无风"],
    },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 48, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>👀 怎么观察天气？</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>三种简单方法，人人都能用</div>
      </div>

      <div style={{
        position: "absolute", top: 158, left: 50, right: 50,
        display: "flex", gap: 40, alignItems: "stretch",
      }}>
        {methods.map((m, i) => {
          const delay = 18 + i * 25;
          const prog = spring({ frame: frame - delay, fps, config: { stiffness: 80, damping: 18 } });
          const op = Math.min(prog, 1);
          const y = interpolate(Math.min(prog, 1), [0, 1], [30, 0]);

          return (
            <div key={m.title} style={{
              flex: 1,
              background: `${m.color}0d`,
              border: `2px solid ${m.color}45`,
              borderRadius: 20,
              padding: "36px 28px",
              opacity: op, transform: `translateY(${y}px)`,
              boxShadow: `0 6px 30px ${m.glow}`,
            }}>
              <div style={{ fontSize: 72, textAlign: "center", marginBottom: 20 }}>{m.icon}</div>
              <div style={{
                fontSize: 38, fontWeight: 800, color: m.color, textAlign: "center",
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 24,
              }}>{m.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {m.items.map((item, j) => {
                  const itemDelay = delay + 15 + j * 10;
                  const itemOp = interpolate(frame, [itemDelay, itemDelay + 12], [0, 1], { extrapolateRight: "clamp" });
                  return (
                    <div key={j} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      opacity: itemOp,
                    }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: m.color, flexShrink: 0,
                      }} />
                      <div style={{
                        fontSize: 24, color: "#e2e8f0",
                        fontFamily: "'PingFang SC',sans-serif",
                      }}>{item}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：天气记录日历 ─────────────────────────────────
const CalendarScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const calOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const tipOp = interpolate(frame, [100, 120], [0, 1], { extrapolateRight: "clamp" });

  // 示例天气日历数据（7天）
  const days = [
    { day: "周一", date: 1, emoji: "☀️", name: "晴", color: C.sunny },
    { day: "周二", date: 2, emoji: "🌤️", name: "多云", color: C.cloudy },
    { day: "周三", date: 3, emoji: "🌧️", name: "雨", color: C.rainy },
    { day: "周四", date: 4, emoji: "🌧️", name: "雨", color: C.rainy },
    { day: "周五", date: 5, emoji: "☁️", name: "阴", color: C.overcast },
    { day: "周六", date: 6, emoji: "☀️", name: "晴", color: C.sunny },
    { day: "周日", date: 7, emoji: "💨", name: "风", color: C.windy },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", top: 48, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>📅 天气日历记录</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>每天记录一次，发现天气规律</div>
      </div>

      {/* 日历 */}
      <div style={{
        position: "absolute", top: 158, left: 60, right: 60,
        opacity: calOp,
      }}>
        <div style={{
          background: "rgba(15,32,64,.95)",
          border: "2px solid rgba(56,189,248,.3)",
          borderRadius: 24, padding: "32px 40px",
        }}>
          <div style={{
            display: "flex", justifyContent: "center", gap: 16,
            marginBottom: 16,
          }}>
            <div style={{
              fontSize: 30, fontWeight: 800, color: C.accent,
              fontFamily: "'PingFang SC',sans-serif",
            }}>📓 我的天气日记 · 第1周</div>
          </div>

          <div style={{ display: "flex", gap: 18, justifyContent: "center" }}>
            {days.map((d, i) => {
              const delay = 30 + i * 12;
              const prog = spring({ frame: frame - delay, fps, config: { stiffness: 120, damping: 15 } });
              const sc = Math.min(prog, 1);

              return (
                <div key={d.day} style={{
                  flex: 1, background: `${d.color}15`,
                  border: `2px solid ${d.color}55`,
                  borderRadius: 16, padding: "20px 12px",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  transform: `scale(${sc})`,
                }}>
                  <div style={{
                    fontSize: 20, color: C.muted, marginBottom: 6,
                    fontFamily: "'PingFang SC',sans-serif",
                  }}>{d.day}</div>
                  <div style={{
                    fontSize: 16, color: "#64748b", marginBottom: 12,
                    fontFamily: "'PingFang SC',sans-serif",
                  }}>{d.date}日</div>
                  <div style={{ fontSize: 50, marginBottom: 10 }}>{d.emoji}</div>
                  <div style={{
                    fontSize: 22, fontWeight: 700, color: d.color,
                    fontFamily: "'PingFang SC',sans-serif",
                  }}>{d.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 底部统计提示 */}
      <div style={{
        position: "absolute", bottom: 40, left: 0, right: 0,
        textAlign: "center", opacity: tipOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 28, color: "#a5f3fc" }}>
          💡 这周：晴天 <span style={{ color: C.sunny, fontWeight: 700 }}>2天</span> ·
          雨天 <span style={{ color: C.rainy, fontWeight: 700 }}>2天</span> ·
          阴天 <span style={{ color: C.overcast, fontWeight: 700 }}>1天</span> ·
          风天 <span style={{ color: C.windy, fontWeight: 700 }}>1天</span> ·
          多云 <span style={{ color: C.cloudy, fontWeight: 700 }}>1天</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：总结 ──────────────────────────────────────────
const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const points = [
    { icon: "🌈", color: C.sunny,   title: "六种天气", text: "晴☀️ 多云🌤️ 阴☁️\n雨🌧️ 雪🌨️ 风💨" },
    { icon: "👁", color: C.rainy,  title: "观察方法", text: "看天空 + 感温度\n看树叶/旗子" },
    { icon: "📅", color: "#34d399", title: "天气记录", text: "天气日历\n发现规律" },
    { icon: "👗", color: "#f472b6",  title: "影响生活", text: "决定穿衣出行\n安排每日计划" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(56,189,248,.08) 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#fff" }}>🎯 今天学会了什么？</div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>天气的观察 · 四大收获</div>
      </div>

      <div style={{
        position: "absolute", top: 155, left: 60, right: 60,
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr", gap: 28,
      }}>
        {points.map((p, i) => {
          const delay = 20 + i * 18;
          const op = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 20], [20, 0], { extrapolateRight: "clamp" });
          return (
            <div key={p.title} style={{
              background: "rgba(15,32,64,.9)", borderRadius: 22,
              padding: "32px 28px",
              border: `2px solid ${p.color}44`,
              display: "flex", gap: 22, alignItems: "flex-start",
              opacity: op, transform: `translateY(${y}px)`,
              boxShadow: `0 4px 24px ${p.color}22`,
            }}>
              <div style={{ fontSize: 68, flexShrink: 0, lineHeight: 1 }}>{p.icon}</div>
              <div>
                <div style={{
                  fontSize: 34, fontWeight: 800, color: p.color,
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 10,
                }}>{p.title}</div>
                <div style={{
                  fontSize: 28, color: "#e2e8f0",
                  fontFamily: "'PingFang SC',sans-serif",
                  lineHeight: 1.6, whiteSpace: "pre-line",
                }}>{p.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部鼓励 */}
      <div style={{
        position: "absolute", bottom: 32, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [85, 105], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 30, color: "#a5f3fc" }}>
          🌟 坚持记天气日记，你也能成为小气象员！
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ──────────────────────────────────────
export const WeatherVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0}   durationInFrames={100}><TitleScene /></Sequence>
      <Sequence from={100} durationInFrames={160}><WeatherTypesScene /></Sequence>
      <Sequence from={260} durationInFrames={150}><ObserveScene /></Sequence>
      <Sequence from={410} durationInFrames={150}><CalendarScene /></Sequence>
      <Sequence from={560} durationInFrames={100}><SummaryScene /></Sequence>
    </AbsoluteFill>
  );
};
