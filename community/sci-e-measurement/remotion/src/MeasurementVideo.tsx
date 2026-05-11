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
  primary: "#38bdf8",
  accent: "#fbbf24",
  green: "#34d399",
  purple: "#a78bfa",
  pink: "#f472b6",
  danger: "#f87171",
};

// ── 场景1：标题 ────────────────────────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [20, 38], [0, 1], { extrapolateRight: "clamp" });
  const badgeScale = spring({ frame: frame - 35, fps, config: { stiffness: 120, damping: 14 } });
  const toolsOp = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });

  const tools = ["📏 直尺", "⚖️ 秤", "🌡️ 温度计", "🧪 量杯"];

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 60% 30%, rgba(56,189,248,.2) 0%, transparent 60%),
                   radial-gradient(ellipse at 20% 80%, rgba(251,191,36,.1) 0%, transparent 50%),
                   ${C.bg}`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      {/* 标题 */}
      <div style={{
        fontSize: 100, fontWeight: 900, color: "#fff",
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center",
        background: "linear-gradient(135deg, #fff 30%, #38bdf8 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        marginBottom: 24,
      }}>测量与数据记录</div>

      {/* 副标题 */}
      <div style={{
        fontSize: 40, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif", marginBottom: 48,
      }}>小学科学 G2 · 技术与工程</div>

      {/* 工具徽章 */}
      <div style={{
        display: "flex", gap: 24, opacity: toolsOp,
        transform: `scale(${Math.min(badgeScale, 1)})`,
      }}>
        {tools.map((t, i) => (
          <div key={i} style={{
            padding: "14px 32px", borderRadius: 99,
            background: "rgba(56,189,248,.15)",
            border: "1px solid rgba(56,189,248,.4)",
            color: C.primary, fontSize: 32,
            fontFamily: "'PingFang SC',sans-serif",
          }}>{t}</div>
        ))}
      </div>

      {/* 底部说明 */}
      <div style={{
        position: "absolute", bottom: 50,
        fontSize: 30, color: C.muted, opacity: subOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>科学测量 → 精确数字 → 发现规律 🔬</div>
    </AbsoluteFill>
  );
};

// ── 场景2：为什么要测量（对比动画） ─────────────────────
const WhyMeasureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const vagueOp = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const vsOp = interpolate(frame, [40, 52], [0, 1], { extrapolateRight: "clamp" });
  const preciseOp = interpolate(frame, [52, 72], [0, 1], { extrapolateRight: "clamp" });
  const conclusionOp = interpolate(frame, [90, 110], [0, 1], { extrapolateRight: "clamp" });

  const vagueX = interpolate(frame, [15, 35], [-60, 0], { extrapolateRight: "clamp" });
  const preciseX = interpolate(frame, [52, 72], [60, 0], { extrapolateRight: "clamp" });

  const vagueItems = [
    { emoji: "🎒", vague: "挺重", problem: "重多少？不知道！" },
    { emoji: "📏", vague: "很长", problem: "多少厘米？说不清！" },
    { emoji: "🌡️", vague: "有点热", problem: "几度？没法比较！" },
  ];

  const preciseItems = [
    { emoji: "🎒", precise: "3.5 千克", good: "精确！可以比较" },
    { emoji: "📏", precise: "47 厘米", good: "明确！能画出来" },
    { emoji: "🌡️", precise: "38.5 °C", good: "准确！医生能判断" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* 标题 */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>
          为什么要测量？
        </div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>
          模糊描述 vs 精确数字 — 哪个更有用？
        </div>
      </div>

      {/* 两侧对比 */}
      <div style={{
        position: "absolute", top: 170, left: 50, right: 50,
        display: "flex", gap: 40, alignItems: "stretch",
      }}>
        {/* 左：模糊 */}
        <div style={{
          flex: 1, background: "rgba(248,113,113,.08)",
          border: "2px solid rgba(248,113,113,.4)", borderRadius: 20,
          padding: "28px 24px",
          opacity: vagueOp, transform: `translateX(${vagueX}px)`,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, textAlign: "center" }}>😕</div>
          <div style={{
            fontSize: 40, fontWeight: 800, color: C.danger, marginBottom: 20,
            fontFamily: "'PingFang SC',sans-serif", textAlign: "center",
          }}>模糊描述</div>
          {vagueItems.map((item, i) => (
            <div key={i} style={{
              marginBottom: 16, padding: "14px 18px",
              background: "rgba(248,113,113,.08)", borderRadius: 12,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <span style={{ fontSize: 38 }}>{item.emoji}</span>
              <div style={{ fontFamily: "'PingFang SC',sans-serif" }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: C.danger }}>{item.vague}</div>
                <div style={{ fontSize: 22, color: C.muted }}>{item.problem}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 中：VS */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 56, fontWeight: 900, color: C.accent,
          opacity: vsOp, flexShrink: 0, width: 80,
          fontFamily: "'PingFang SC',sans-serif",
        }}>VS</div>

        {/* 右：精确 */}
        <div style={{
          flex: 1, background: "rgba(52,211,153,.08)",
          border: "2px solid rgba(52,211,153,.4)", borderRadius: 20,
          padding: "28px 24px",
          opacity: preciseOp, transform: `translateX(${preciseX}px)`,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, textAlign: "center" }}>✅</div>
          <div style={{
            fontSize: 40, fontWeight: 800, color: C.green, marginBottom: 20,
            fontFamily: "'PingFang SC',sans-serif", textAlign: "center",
          }}>精确测量</div>
          {preciseItems.map((item, i) => (
            <div key={i} style={{
              marginBottom: 16, padding: "14px 18px",
              background: "rgba(52,211,153,.08)", borderRadius: 12,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <span style={{ fontSize: 38 }}>{item.emoji}</span>
              <div style={{ fontFamily: "'PingFang SC',sans-serif" }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: C.green }}>{item.precise}</div>
                <div style={{ fontSize: 22, color: C.muted }}>{item.good}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部结论 */}
      <div style={{
        position: "absolute", bottom: 36, left: 0, right: 0,
        textAlign: "center", opacity: conclusionOp,
        fontFamily: "'PingFang SC',sans-serif",
        fontSize: 30, color: C.primary,
      }}>
        💡 测量 = 用数字说话，让科学更精确！
      </div>
    </AbsoluteFill>
  );
};

// ── 场景3：四种测量工具展示 ────────────────────────────
const ToolsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const tools = [
    {
      emoji: "📏", name: "直尺 / 卷尺", quantity: "长度",
      unit: "厘米（cm）/ 米（m）", color: C.primary,
      tip: "量铅笔、书本、教室长度",
    },
    {
      emoji: "⚖️", name: "秤（体重秤/天平）", quantity: "重量",
      unit: "克（g）/ 千克（kg）", color: C.accent,
      tip: "量书包、苹果、体重",
    },
    {
      emoji: "🌡️", name: "温度计", quantity: "温度",
      unit: "摄氏度（°C）", color: C.pink,
      tip: "量室温、体温、水温",
    },
    {
      emoji: "🧪", name: "量杯 / 量筒", quantity: "体积（液体）",
      unit: "毫升（mL）", color: C.green,
      tip: "量水、果汁、牛奶",
    },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* 标题 */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>四种常用测量工具</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>
          不同的量 → 用不同的工具 → 写上单位
        </div>
      </div>

      {/* 工具卡片 2×2 */}
      <div style={{
        position: "absolute", top: 160, left: 50, right: 50,
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr", gap: 24,
      }}>
        {tools.map((tool, i) => {
          const delay = 15 + i * 22;
          const op = interpolate(frame, [delay, delay + 22], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [delay, delay + 22], [20, 0], { extrapolateRight: "clamp" });

          return (
            <div key={i} style={{
              background: "rgba(15,32,64,.9)",
              border: `2px solid ${tool.color}44`,
              borderRadius: 20, padding: "24px 28px",
              display: "flex", gap: 20, alignItems: "flex-start",
              opacity: op, transform: `translateY(${y}px)`,
            }}>
              <div style={{ fontSize: 70, flexShrink: 0, marginTop: 4 }}>{tool.emoji}</div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: tool.color,
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 8 }}>
                  {tool.name}
                </div>
                <div style={{ fontSize: 24, color: "#e2e8f0",
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 6 }}>
                  📐 测量：<span style={{ color: "#fff", fontWeight: 600 }}>{tool.quantity}</span>
                </div>
                <div style={{ fontSize: 24, color: "#e2e8f0",
                  fontFamily: "'PingFang SC',sans-serif", marginBottom: 6 }}>
                  🏷️ 单位：<span style={{ color: tool.color, fontWeight: 700 }}>{tool.unit}</span>
                </div>
                <div style={{ fontSize: 22, color: C.muted,
                  fontFamily: "'PingFang SC',sans-serif" }}>
                  💡 {tool.tip}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景4：直尺使用方法动画 ────────────────────────────
const RulerScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // 铅笔滑动到对齐0刻度
  const pencilX = interpolate(frame, [15, 50], [200, 0], { extrapolateRight: "clamp" });
  const pencilOp = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" });
  const rulerOp = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" });

  const step1Op = interpolate(frame, [55, 70], [0, 1], { extrapolateRight: "clamp" });
  const step2Op = interpolate(frame, [75, 90], [0, 1], { extrapolateRight: "clamp" });
  const step3Op = interpolate(frame, [95, 110], [0, 1], { extrapolateRight: "clamp" });

  // 错误指示器闪烁
  const wrongBlink = Math.sin(frame * 0.2) > 0 ? 1 : 0.3;
  const wrongOp = interpolate(frame, [80, 95], [0, 1], { extrapolateRight: "clamp" }) * wrongBlink;

  // 测量值出现
  const valueOp = interpolate(frame, [55, 75], [0, 1], { extrapolateRight: "clamp" });
  const valueScale = spring({ frame: frame - 55, fps, config: { stiffness: 150, damping: 12 } });

  // 刻度位置 (px, in 1920 viewport)
  const RULER_LEFT = 200;
  const RULER_TOP = 370;
  const CM_WIDTH = 80; // pixels per cm at this scale
  const PENCIL_LEN = 7 * CM_WIDTH; // 7cm pencil

  const steps = [
    { num: "① ", text: "一端对准0刻度", sub: "起点要从0开始！" },
    { num: "② ", text: "另一端读数字", sub: "7cm就是7厘米" },
    { num: "③ ", text: "视线垂直刻度", sub: "斜着看会读错！" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* 标题 */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>正确使用直尺</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>
          三步骤：对准0 → 读数字 → 垂直看
        </div>
      </div>

      {/* 直尺 */}
      <div style={{
        position: "absolute",
        top: RULER_TOP,
        left: RULER_LEFT,
        opacity: rulerOp,
      }}>
        {/* 尺身 */}
        <div style={{
          width: 800, height: 60,
          background: "linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)",
          borderRadius: 6, position: "relative",
          boxShadow: "0 4px 15px rgba(251,191,36,.4)",
        }}>
          {/* 刻度线 */}
          {Array.from({ length: 11 }, (_, i) => (
            <React.Fragment key={i}>
              <div style={{
                position: "absolute", left: i * CM_WIDTH, top: 0,
                width: 3, height: i % 5 === 0 ? 32 : 20,
                background: "#1e293b", borderRadius: 1,
              }} />
              {i > 0 && (
                <div style={{
                  position: "absolute",
                  left: i * CM_WIDTH - 10, top: 36,
                  fontSize: 20, fontWeight: 700, color: "#1e293b",
                  fontFamily: "monospace", width: 22, textAlign: "center",
                }}>{i}</div>
              )}
              <div style={{
                position: "absolute",
                left: 4, top: 36,
                fontSize: 16, fontWeight: 700, color: "#1e293b",
                fontFamily: "monospace",
              }}>0</div>
            </React.Fragment>
          ))}
          {/* cm 标签 */}
          <div style={{
            position: "absolute", right: 12, top: 8,
            fontSize: 22, fontWeight: 700, color: "#1e293b",
            fontFamily: "monospace",
          }}>cm</div>
        </div>

        {/* 铅笔（动画滑入对齐） */}
        <div style={{
          position: "absolute",
          top: -50,
          left: pencilX,
          opacity: pencilOp,
        }}>
          <div style={{
            width: PENCIL_LEN, height: 30,
            background: "linear-gradient(180deg, #86efac 0%, #22c55e 100%)",
            borderRadius: "4px 20px 20px 4px",
            position: "relative",
            boxShadow: "0 2px 8px rgba(34,197,94,.4)",
            display: "flex", alignItems: "center",
          }}>
            <div style={{
              fontSize: 20, fontWeight: 700, color: "#fff",
              paddingLeft: 12, fontFamily: "'PingFang SC',sans-serif",
            }}>✏️ 铅笔</div>
            {/* 笔尖 */}
            <div style={{
              position: "absolute", right: -14, top: 3,
              width: 0, height: 0,
              borderTop: "12px solid transparent",
              borderBottom: "12px solid transparent",
              borderLeft: "14px solid #22c55e",
            }} />
          </div>
          {/* 对准0的标记 */}
          <div style={{
            position: "absolute", left: 0, top: -28,
            fontSize: 22, color: C.green, fontFamily: "'PingFang SC',sans-serif",
            fontWeight: 700,
          }}>↓ 对准0！</div>

          {/* 测量值标注 */}
          <div style={{
            position: "absolute", right: 0, top: -36,
            opacity: valueOp,
            transform: `scale(${Math.min(valueScale, 1)})`,
            transformOrigin: "bottom right",
          }}>
            <div style={{
              background: C.primary, borderRadius: 12,
              padding: "6px 16px",
              fontSize: 28, fontWeight: 900, color: "#fff",
              fontFamily: "'PingFang SC',sans-serif",
              boxShadow: "0 4px 14px rgba(56,189,248,.5)",
            }}>= 7 厘米</div>
          </div>
        </div>
      </div>

      {/* 错误示例：斜着看 */}
      <div style={{
        position: "absolute", top: RULER_TOP - 10, right: 80,
        opacity: wrongOp, width: 280,
      }}>
        <div style={{
          background: "rgba(248,113,113,.12)", border: "2px solid rgba(248,113,113,.5)",
          borderRadius: 16, padding: "16px 20px",
          fontFamily: "'PingFang SC',sans-serif",
        }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>❌</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.danger, marginBottom: 6 }}>错误：斜着看</div>
          <div style={{ fontSize: 22, color: C.muted }}>视线不垂直<br/>读数会偏大或偏小！</div>
        </div>
      </div>

      {/* 三步骤卡片 */}
      <div style={{
        position: "absolute", bottom: 30, left: 50, right: 50,
        display: "flex", gap: 24,
      }}>
        {steps.map((s, i) => {
          const ops = [step1Op, step2Op, step3Op];
          return (
            <div key={i} style={{
              flex: 1, background: "rgba(56,189,248,.08)",
              border: "1px solid rgba(56,189,248,.3)", borderRadius: 16,
              padding: "18px 20px", opacity: ops[i],
            }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: C.primary,
                fontFamily: "'PingFang SC',sans-serif", marginBottom: 6 }}>{s.num}{s.text}</div>
              <div style={{ fontSize: 22, color: C.muted,
                fontFamily: "'PingFang SC',sans-serif" }}>{s.sub}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 场景5：数据记录表格 ────────────────────────────────
const DataRecordScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // 表格行逐行出现
  const tableData = [
    { item: "铅笔", tool: "直尺", value: "17", unit: "厘米(cm)" },
    { item: "课本厚度", tool: "直尺", value: "1.2", unit: "厘米(cm)" },
    { item: "书包", tool: "秤", value: "3.5", unit: "千克(kg)" },
    { item: "教室温度", tool: "温度计", value: "22", unit: "摄氏度(°C)" },
    { item: "水的体积", tool: "量杯", value: "250", unit: "毫升(mL)" },
  ];

  const conclusionOp = interpolate(frame, [90, 108], [0, 1], { extrapolateRight: "clamp" });
  const ruleOp = interpolate(frame, [110, 128], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* 标题 */}
      <div style={{
        position: "absolute", top: 50, left: 0, right: 0,
        textAlign: "center", opacity: titleOp,
        fontFamily: "'PingFang SC',sans-serif",
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#fff" }}>📊 数据记录表格</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 10 }}>
          数字 + 单位 = 完整记录！两者缺一不可
        </div>
      </div>

      {/* 表格 */}
      <div style={{
        position: "absolute", top: 155, left: 100, right: 100,
      }}>
        {/* 表头 */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.3fr",
          gap: 3, marginBottom: 3,
        }}>
          {["测量对象", "使用工具", "测量数值", "单位"].map((h, i) => (
            <div key={i} style={{
              background: C.primary, padding: "14px 16px",
              borderRadius: i === 0 ? "10px 0 0 0" : i === 3 ? "0 10px 0 0" : "0",
              fontSize: 28, fontWeight: 800, color: "#fff",
              fontFamily: "'PingFang SC',sans-serif", textAlign: "center",
            }}>{h}</div>
          ))}
        </div>

        {/* 数据行 */}
        {tableData.map((row, i) => {
          const delay = 15 + i * 16;
          const op = interpolate(frame, [delay, delay + 16], [0, 1], { extrapolateRight: "clamp" });
          const x = interpolate(frame, [delay, delay + 16], [-30, 0], { extrapolateRight: "clamp" });
          const isLast = i === tableData.length - 1;

          return (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.3fr",
              gap: 3, marginBottom: 3,
              opacity: op, transform: `translateX(${x}px)`,
            }}>
              {[row.item, row.tool, row.value, row.unit].map((cell, j) => (
                <div key={j} style={{
                  background: i % 2 === 0 ? "rgba(15,32,64,.9)" : "rgba(56,189,248,.06)",
                  padding: "13px 16px",
                  borderRadius: (isLast && j === 0) ? "0 0 0 10px" :
                                (isLast && j === 3) ? "0 0 10px 0" : "0",
                  border: "1px solid rgba(56,189,248,.15)",
                  fontSize: j === 2 ? 32 : 26,
                  fontWeight: j === 2 ? 800 : 400,
                  color: j === 2 ? C.accent : j === 3 ? C.green : "#e2e8f0",
                  fontFamily: "'PingFang SC',sans-serif",
                  textAlign: j === 2 ? "center" : "left",
                }}>{cell}</div>
              ))}
            </div>
          );
        })}
      </div>

      {/* 结论 + 规则 */}
      <div style={{
        position: "absolute", bottom: 36, left: 100, right: 100,
        display: "flex", gap: 28,
      }}>
        <div style={{
          flex: 1, background: "rgba(251,191,36,.1)",
          border: "2px solid rgba(251,191,36,.4)", borderRadius: 16,
          padding: "18px 22px", opacity: conclusionOp,
        }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.accent,
            fontFamily: "'PingFang SC',sans-serif", marginBottom: 6 }}>
            ⚠️ 写数字必须带单位！
          </div>
          <div style={{ fontSize: 24, color: "#e2e8f0",
            fontFamily: "'PingFang SC',sans-serif" }}>
            5 ≠ 5厘米 ≠ 5米！单位不同，意义完全不同
          </div>
        </div>
        <div style={{
          flex: 1, background: "rgba(52,211,153,.1)",
          border: "2px solid rgba(52,211,153,.4)", borderRadius: 16,
          padding: "18px 22px", opacity: ruleOp,
        }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.green,
            fontFamily: "'PingFang SC',sans-serif", marginBottom: 6 }}>
            📋 表格的好处
          </div>
          <div style={{ fontSize: 24, color: "#e2e8f0",
            fontFamily: "'PingFang SC',sans-serif" }}>
            方便比较、发现规律、与他人分享结果
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 主 Composition ─────────────────────────────────────
export const MeasurementVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.mp3")} />
      <Sequence from={0}   durationInFrames={90}><TitleScene /></Sequence>
      <Sequence from={90}  durationInFrames={150}><WhyMeasureScene /></Sequence>
      <Sequence from={240} durationInFrames={150}><ToolsScene /></Sequence>
      <Sequence from={390} durationInFrames={150}><RulerScene /></Sequence>
      <Sequence from={540} durationInFrames={120}><DataRecordScene /></Sequence>
    </AbsoluteFill>
  );
};
