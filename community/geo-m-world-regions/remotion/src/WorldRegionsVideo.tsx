import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import React from "react";

// 调色板
const COLORS = {
  asia: "#6366f1",
  europe: "#10b981",
  africa: "#f59e0b",
  northAmerica: "#3b82f6",
  southAmerica: "#ec4899",
  oceania: "#14b8a6",
  antarctica: "#94a3b8",
  bg: "#0f172a",
  bg2: "#1e293b",
  text: "#f1f5f9",
  muted: "#94a3b8",
};

// 各大洲数据（面积，百万 km²）
const CONTINENTS = [
  { name: "亚洲", en: "Asia", area: 44.0, pop: 46, color: COLORS.asia, emoji: "🌏" },
  { name: "非洲", en: "Africa", area: 30.2, pop: 14, color: COLORS.africa, emoji: "🌍" },
  { name: "北美洲", en: "N.America", area: 24.2, pop: 5.7, color: COLORS.northAmerica, emoji: "🌎" },
  { name: "南美洲", en: "S.America", area: 17.97, pop: 4.3, color: COLORS.southAmerica, emoji: "🌎" },
  { name: "南极洲", en: "Antarctica", area: 13.9, pop: 0, color: COLORS.antarctica, emoji: "❄️" },
  { name: "欧洲", en: "Europe", area: 10.18, pop: 7.5, color: COLORS.europe, emoji: "🏰" },
  { name: "大洋洲", en: "Oceania", area: 8.97, pop: 0.04, color: COLORS.oceania, emoji: "🦘" },
];

// ── 场景1：标题页 ──────────────────────────────────────────
const TitleScene: React.FC<{ from: number; dur: number }> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  const { fps } = useVideoConfig();

  const titleY = interpolate(local, [0, 15], [40, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(local, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(local, [15, 30], [0, 1], { extrapolateRight: "clamp" });
  const badgeOp = interpolate(local, [30, 45], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${COLORS.bg} 0%, #1a0533 100%)` }}>
      {/* 背景装饰圆 */}
      <div style={{
        position: "absolute", top: -100, right: -100,
        width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${COLORS.asia}22 0%, transparent 70%)`,
      }} />
      <div style={{
        position: "absolute", bottom: -80, left: -80,
        width: 400, height: 400, borderRadius: "50%",
        background: `radial-gradient(circle, ${COLORS.europe}18 0%, transparent 70%)`,
      }} />

      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        {/* 地球图标 */}
        <div style={{
          fontSize: 96, marginBottom: 30,
          opacity: titleOp, transform: `translateY(${titleY}px)`,
        }}>🌍</div>

        {/* 主标题 */}
        <div style={{
          fontSize: 80, fontWeight: 800, color: "#fff",
          fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
          opacity: titleOp, transform: `translateY(${titleY}px)`,
          textAlign: "center", letterSpacing: "0.02em",
          textShadow: `0 0 40px ${COLORS.asia}66`,
        }}>
          世界地理分区
        </div>

        {/* 副标题 */}
        <div style={{
          marginTop: 20, fontSize: 32, color: COLORS.muted,
          fontFamily: "'PingFang SC', sans-serif",
          opacity: subOp, letterSpacing: "0.08em",
        }}>
          初中地理 G7 · World Geographic Regions
        </div>

        {/* 徽章 */}
        <div style={{
          marginTop: 40, opacity: badgeOp,
          display: "flex", gap: 20,
        }}>
          {["7大洲", "多维比较", "互动探究"].map((b, i) => (
            <div key={i} style={{
              padding: "10px 24px",
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.4)",
              borderRadius: 99,
              color: COLORS.asia,
              fontSize: 24,
              fontFamily: "'PingFang SC', sans-serif",
            }}>{b}</div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景2：七大洲面积柱状图（逐一浮现）──────────────────────
const AreaChartScene: React.FC<{ from: number; dur: number }> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  const { fps } = useVideoConfig();

  const maxArea = 44;
  const barMaxH = 340;

  const titleOp = interpolate(local, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {/* 标题 */}
      <div style={{
        position: "absolute", top: 60, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC', sans-serif",
      }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: "#fff" }}>各大洲面积比较</div>
        <div style={{ fontSize: 24, color: COLORS.muted, marginTop: 10 }}>单位：百万 km²（亚洲最大 = 100%）</div>
      </div>

      {/* 柱状图 */}
      <div style={{
        position: "absolute",
        bottom: 100,
        left: 80,
        right: 80,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-around",
        height: barMaxH + 60,
      }}>
        {CONTINENTS.map((c, i) => {
          const delay = 20 + i * 12;
          const progress = spring({ frame: local - delay, fps, config: { stiffness: 80, damping: 20 } });
          const barH = (c.area / maxArea) * barMaxH * Math.min(progress, 1);
          const labelOp = interpolate(local, [delay + 20, delay + 35], [0, 1], { extrapolateRight: "clamp" });

          return (
            <div key={c.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 120 }}>
              {/* 数值标签 */}
              <div style={{
                fontSize: 22, fontWeight: 700, color: c.color,
                opacity: labelOp, marginBottom: 8,
                fontFamily: "'PingFang SC', sans-serif",
              }}>{c.area}</div>

              {/* 柱体 */}
              <div style={{
                width: 72, height: barH, background: c.color,
                borderRadius: "6px 6px 0 0",
                boxShadow: `0 0 20px ${c.color}44`,
                transition: "none",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* 高光 */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0,
                  height: "40%",
                  background: "linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)",
                }} />
              </div>

              {/* 洲名 */}
              <div style={{
                marginTop: 12, fontSize: 22, color: "#e2e8f0", opacity: labelOp,
                fontFamily: "'PingFang SC', sans-serif",
                textAlign: "center",
              }}>{c.emoji} {c.name}</div>
            </div>
          );
        })}
      </div>

      {/* 横轴基线 */}
      <div style={{
        position: "absolute", bottom: 148, left: 80, right: 80,
        height: 2, background: "rgba(255,255,255,0.15)", borderRadius: 1,
      }} />

      {/* 说明文字 */}
      <div style={{
        position: "absolute", bottom: 32, left: 0, right: 0,
        textAlign: "center", fontSize: 22, color: COLORS.muted,
        opacity: interpolate(local, [80, 100], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC', sans-serif",
      }}>
        💡 亚洲面积约 4,400 万 km²，是欧洲的 4.3 倍，是大洋洲的 4.9 倍
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：世界分区示意图（六色块）────────────────────────────
const RegionMapScene: React.FC<{ from: number; dur: number }> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const local = frame - from;

  const regions = [
    { name: "亚洲", note: "面积最大\n人口最多", color: COLORS.asia, x: 62, y: 18, w: 28, h: 30 },
    { name: "欧洲", note: "经济最发达\n海岸线曲折", color: COLORS.europe, x: 46, y: 12, w: 14, h: 20 },
    { name: "非洲", note: "热带大陆\n资源丰富", color: COLORS.africa, x: 46, y: 32, w: 16, h: 28 },
    { name: "北美洲", note: "美加发达\n落基山脉", color: COLORS.northAmerica, x: 8, y: 12, w: 26, h: 28 },
    { name: "南美洲", note: "亚马孙雨林\n安第斯山脉", color: COLORS.southAmerica, x: 14, y: 44, w: 18, h: 32 },
    { name: "大洋洲", note: "面积最小洲\n澳新发达", color: COLORS.oceania, x: 70, y: 55, w: 18, h: 22 },
    { name: "南极洲", note: "最寒冷大陆\n无常住居民", color: COLORS.antarctica, x: 20, y: 82, w: 60, h: 10 },
  ];

  const titleOp = interpolate(local, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: `#0b1628` }}>
      {/* 标题 */}
      <div style={{
        position: "absolute", top: 40, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC', sans-serif",
      }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: "#fff" }}>🗺️ 世界地理分区示意</div>
        <div style={{ fontSize: 24, color: COLORS.muted, marginTop: 8 }}>七大板块 · 各有特色</div>
      </div>

      {/* 地球矩形示意 */}
      <div style={{
        position: "absolute",
        top: 130, left: 60, right: 60, bottom: 80,
        background: "#0d2145",
        borderRadius: 16,
        border: "1px solid rgba(99,102,241,0.2)",
        overflow: "hidden",
      }}>
        {regions.map((r, i) => {
          const delay = 10 + i * 15;
          const op = interpolate(local, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp" });
          const scale = interpolate(local, [delay, delay + 15], [0.85, 1], { extrapolateRight: "clamp" });

          return (
            <div key={r.name} style={{
              position: "absolute",
              left: `${r.x}%`, top: `${r.y}%`,
              width: `${r.w}%`, height: `${r.h}%`,
              background: r.color,
              opacity: op * 0.82,
              transform: `scale(${scale})`,
              borderRadius: 8,
              border: "2px solid rgba(0,0,0,0.3)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}>
              {/* 高光 */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)",
              }} />
              <div style={{
                fontSize: Math.max(14, r.w * 2.2),
                fontWeight: 700, color: "#fff",
                fontFamily: "'PingFang SC', sans-serif",
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                position: "relative", zIndex: 1, textAlign: "center",
                lineHeight: 1.3,
              }}>{r.name}</div>
              {r.w > 15 && (
                <div style={{
                  fontSize: Math.max(11, r.w * 1.6),
                  color: "rgba(255,255,255,0.8)",
                  fontFamily: "'PingFang SC', sans-serif",
                  position: "relative", zIndex: 1, textAlign: "center",
                  lineHeight: 1.4, whiteSpace: "pre-line",
                  marginTop: 4,
                }}>{r.note}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部标注 */}
      <div style={{
        position: "absolute", bottom: 22, left: 0, right: 0,
        textAlign: "center", fontSize: 22, color: COLORS.muted,
        opacity: interpolate(local, [100, 115], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC', sans-serif",
      }}>
        以赤道和本初子午线为坐标轴划分 · 每块区域气候与人文特征各异
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：发达 vs 发展中 ─────────────────────────────────────
const DevelopmentScene: React.FC<{ from: number; dur: number }> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  const { fps } = useVideoConfig();

  const developed = [
    { name: "美国", gdp: 63, color: "#3b82f6" },
    { name: "德国", gdp: 51, color: "#10b981" },
    { name: "日本", gdp: 42, color: "#6366f1" },
    { name: "澳大利亚", gdp: 54, color: "#14b8a6" },
  ];
  const developing = [
    { name: "中国", gdp: 12, color: "#f59e0b" },
    { name: "印度", gdp: 2.3, color: "#f97316" },
    { name: "巴西", gdp: 8.7, color: "#ec4899" },
    { name: "非洲平均", gdp: 1.8, color: "#94a3b8" },
  ];

  const titleOp = interpolate(local, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const dividerOp = interpolate(local, [20, 35], [0, 1], { extrapolateRight: "clamp" });

  const maxGDP = 65;

  const BarGroup: React.FC<{ items: typeof developed; side: "left" | "right"; startDelay: number }> = ({
    items, side, startDelay,
  }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {items.map((item, i) => {
        const delay = startDelay + i * 15;
        const progress = spring({ frame: local - delay, fps, config: { stiffness: 70, damping: 18 } });
        const barW = (item.gdp / maxGDP) * 280 * Math.min(progress, 1);
        const labelOp = interpolate(local, [delay + 5, delay + 20], [0, 1], { extrapolateRight: "clamp" });
        return (
          <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 80, textAlign: side === "right" ? "left" : "right",
              fontSize: 22, color: "#e2e8f0", opacity: labelOp,
              fontFamily: "'PingFang SC', sans-serif", flexShrink: 0,
            }}>{item.name}</div>
            <div style={{
              width: barW, height: 36, background: item.color,
              borderRadius: "0 6px 6px 0",
              boxShadow: `0 0 12px ${item.color}44`,
              display: "flex", alignItems: "center", paddingLeft: 10,
              overflow: "hidden",
            }}>
              <span style={{ fontSize: 18, color: "#fff", fontFamily: "'PingFang SC', sans-serif", whiteSpace: "nowrap" }}>
                ${item.gdp}k
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {/* 标题 */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC', sans-serif",
      }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: "#fff" }}>📊 发达地区 vs 发展中地区</div>
        <div style={{ fontSize: 24, color: COLORS.muted, marginTop: 10 }}>人均 GDP 对比（美元/千，2023 年约值）</div>
      </div>

      {/* 左右两组 */}
      <div style={{
        position: "absolute",
        top: 160, left: 80, right: 80,
        display: "flex", gap: 60, alignItems: "flex-start",
      }}>
        {/* 发达 */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 28, fontWeight: 700, color: COLORS.europe,
            marginBottom: 24, fontFamily: "'PingFang SC', sans-serif",
            opacity: dividerOp,
          }}>🏙️ 发达地区（北方）</div>
          <BarGroup items={developed} side="left" startDelay={30} />
        </div>

        {/* 分隔线 */}
        <div style={{
          width: 2, height: 280,
          background: "rgba(255,255,255,0.1)",
          opacity: dividerOp,
          borderRadius: 1, flexShrink: 0,
        }} />

        {/* 发展中 */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 28, fontWeight: 700, color: COLORS.africa,
            marginBottom: 24, fontFamily: "'PingFang SC', sans-serif",
            opacity: dividerOp,
          }}>🌱 发展中地区（南方）</div>
          <BarGroup items={developing} side="right" startDelay={50} />
        </div>
      </div>

      {/* 底部洞察 */}
      <div style={{
        position: "absolute", bottom: 50, left: 80, right: 80,
        background: "rgba(99,102,241,0.1)",
        border: "1px solid rgba(99,102,241,0.3)",
        borderRadius: 12, padding: "18px 28px",
        opacity: interpolate(local, [90, 110], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "'PingFang SC', sans-serif",
        textAlign: "center",
      }}>
        <span style={{ fontSize: 26, color: "#a5b4fc" }}>
          🌏 中国是最大的发展中国家，人均 GDP 从 1978 年不足 200 美元增长到 2023 年约 12,000 美元 —— 增长了 60 倍！
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：总结 ──────────────────────────────────────────────
const SummaryScene: React.FC<{ from: number; dur: number }> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const local = frame - from;

  const points = [
    { icon: "🗺️", title: "划分依据", desc: "地理位置·地形·气候·人文" },
    { icon: "🌏", title: "亚洲最大", desc: "面积第一·人口第一" },
    { icon: "🌍", title: "非洲热带", desc: "赤道对称·资源丰富" },
    { icon: "🏙️", title: "欧洲最发达", desc: "工业革命·海洋气候" },
    { icon: "🌎", title: "美洲跨南北", desc: "巴拿马运河为界" },
    { icon: "📈", title: "南北差距", desc: "北发达·南发展中" },
  ];

  const titleOp = interpolate(local, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {/* 背景光晕 */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        width: 600, height: 600, borderRadius: "50%",
        transform: "translate(-50%,-50%)",
        background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
      }} />

      <div style={{
        position: "absolute", top: 55, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC', sans-serif",
      }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: "#fff" }}>🎯 课程核心要点</div>
        <div style={{ fontSize: 24, color: COLORS.muted, marginTop: 10 }}>世界地理分区 · 初中地理 G7</div>
      </div>

      <div style={{
        position: "absolute",
        top: 160, left: 80, right: 80, bottom: 80,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: 20,
      }}>
        {points.map((p, i) => {
          const delay = 20 + i * 15;
          const op = interpolate(local, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(local, [delay, delay + 20], [20, 0], { extrapolateRight: "clamp" });
          return (
            <div key={p.title} style={{
              background: "rgba(30,41,59,0.85)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 16, padding: "28px 24px",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              opacity: op, transform: `translateY(${y}px)`,
              backdropFilter: "blur(10px)",
            }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>{p.icon}</div>
              <div style={{
                fontSize: 28, fontWeight: 700, color: "#fff",
                fontFamily: "'PingFang SC', sans-serif",
                marginBottom: 8, textAlign: "center",
              }}>{p.title}</div>
              <div style={{
                fontSize: 20, color: COLORS.muted,
                fontFamily: "'PingFang SC', sans-serif",
                textAlign: "center",
              }}>{p.desc}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ─────────────────────────────────────────────
export const WorldRegionsVideo: React.FC = () => {
  const { fps } = useVideoConfig();
  // 场景安排：[from, dur] in frames @30fps
  const S = [
    { from: 0,   dur: 90  },  // 标题 3s
    { from: 90,  dur: 150 },  // 面积柱状图 5s
    { from: 240, dur: 150 },  // 地图色块 5s
    { from: 390, dur: 150 },  // 发达vs发展中 5s
    { from: 540, dur: 120 },  // 总结 4s
  ];

  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={S[0].from} durationInFrames={S[0].dur}>
        <TitleScene from={S[0].from} dur={S[0].dur} />
      </Sequence>
      <Sequence from={S[1].from} durationInFrames={S[1].dur}>
        <AreaChartScene from={S[1].from} dur={S[1].dur} />
      </Sequence>
      <Sequence from={S[2].from} durationInFrames={S[2].dur}>
        <RegionMapScene from={S[2].from} dur={S[2].dur} />
      </Sequence>
      <Sequence from={S[3].from} durationInFrames={S[3].dur}>
        <DevelopmentScene from={S[3].from} dur={S[3].dur} />
      </Sequence>
      <Sequence from={S[4].from} durationInFrames={S[4].dur}>
        <SummaryScene from={S[4].from} dur={S[4].dur} />
      </Sequence>
    </AbsoluteFill>
  );
};
