import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const BASE_URL = "./public";

export const RemotionMayFourth: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 动画时间点（秒）
  const timeline = {
    intro: { start: 0, end: 3 },
    news: { start: 3, end: 6 },
    students: { start: 6, end: 10 },
    workers: { start: 10, end: 13 },
    victory: { start: 13, end: 15 },
  };

  // 背景
  const bgOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  // 新闻标题动画
  const newsScale = spring({
    frame: frame - timeline.news.start * fps,
    fps,
    config: { damping: 12, stiffness: 200 },
  });

  // 学生游行动画
  const studentsProgress = interpolate(
    frame,
    [timeline.students.start * fps, timeline.students.end * fps],
    [0, 1]
  );

  // 工人加入动画
  const workersProgress = interpolate(
    frame,
    [timeline.workers.start * fps, timeline.workers.end * fps],
    [0, 1]
  );

  // 胜利庆祝
  const victoryScale = spring({
    frame: frame - timeline.victory.start * fps,
    fps,
    config: { damping: 15, stiffness: 300 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a2e" }}>
      {/* 背景 */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
        }}
      />

      {/* 标题动画 */}
      <AbsoluteFill>
        <Sequence from={0} durationInFrames={timeline.intro.end * fps}>
          <div
            style={{
              width: 1200,
              height: 200,
              position: "absolute",
              top: "30%",
              left: "50%",
              transform: `translateX(-50%) translateY(${interpolate(frame, [0, 0.5 * fps, 1 * fps], [100, 0, -20])}%)`,
              opacity: interpolate(frame, [0, 0.5 * fps], [0, 1]),
              textAlign: "center",
            }}
          >
            <h1
              style={{
                color: "#ecf0f1",
                fontSize: 72,
                fontWeight: "bold",
                textShadow: "0 0 30px rgba(231, 76, 60, 0.8)",
              }}
            >
              五四运动
            </h1>
            <p
              style={{
                color: "#95a5a6",
                fontSize: 24,
                marginTop: 10,
              }}
            >
              1919年5月4日 · 北京
            </p>
          </div>
        </Sequence>
      </AbsoluteFill>

      {/* 新闻传播 */}
      <AbsoluteFill>
        <Sequence from={timeline.news.start * fps}>
          <div
            style={{
              width: 800,
              height: 300,
              position: "absolute",
              top: "20%",
              left: "50%",
              transform: `translateX(-50%) scale(${newsScale})`,
              opacity: interpolate(
                frame,
                [timeline.news.start * fps, timeline.news.start * fps + 0.5 * fps],
                [0, 1]
              ),
              textAlign: "center",
              padding: 40,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 16,
            }}
          >
            <h2
              style={{
                color: "#e74c3c",
                fontSize: 48,
                fontWeight: "bold",
                marginBottom: 20,
              }}
            >
              巴黎和会惊雷
            </h2>
            <p
              style={{
                color: "#ecf0f1",
                fontSize: 24,
                lineHeight: 1.8,
              }}
            >
              山东权益被转让给日本！<br />
              全国震惊，五四运动爆发
            </p>
          </div>

          {/* 新闻传播波纹 */}
          <AbsoluteFill
            style={{
              backgroundColor: "rgba(231, 76, 60, 0.2)",
              borderRadius: 100,
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) scale(${interpolate(frame, [timeline.news.start * fps, timeline.news.end * fps], [0, 2])})`,
              opacity: interpolate(
                frame,
                [timeline.news.start * fps, timeline.news.end * fps],
                [0.5, 0]
              ),
            }}
          />
        </Sequence>
      </AbsoluteFill>

      {/* 学生游行 */}
      <AbsoluteFill>
        <Sequence from={timeline.students.start * fps}>
          <div
            style={{
              width: 1000,
              height: 400,
              position: "absolute",
              bottom: "10%",
              left: "50%",
              transform: `translateX(${interpolate(studentsProgress, [0, 1], [-0.5, 0.5])}%)`,
              opacity: interpolate(
                frame,
                [
                  timeline.students.start * fps,
                  timeline.students.start * fps + 0.5 * fps,
                ],
                [0, 1]
              ),
              textAlign: "center",
              padding: 30,
              backgroundColor: "rgba(41, 128, 185, 0.3)",
              borderRadius: 16,
              border: "3px solid #2980b9",
            }}
          >
            <h2
              style={{
                color: "#ecf0f1",
                fontSize: 36,
                fontWeight: "bold",
                marginBottom: 15,
              }}
            >
              北京大学学生游行
            </h2>
            <p
              style={{
                color: "#ecf0f1",
                fontSize: 20,
                marginBottom: 20,
              }}
            >
              外争主权，内除国贼！<br />
              还我青岛！<br />
              拒绝和约签字！
            </p>
            <div
              style={{
                display: "flex",
                gap: 15,
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: "#e74c3c",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: "bold",
                }}
              >
                北大
              </div>
              <div
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: "#e74c3c",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: "bold",
                }}
              >
                清华
              </div>
              <div
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: "#e74c3c",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: "bold",
                }}
              >
                北师大
              </div>
            </div>
          </div>

          {/* 口号字幕 */}
          <AbsoluteFill
            style={{
              position: "absolute",
              bottom: "5%",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <div
              style={{
                color: "#fff",
                fontSize: 48,
                fontWeight: "bold",
                textShadow: "0 0 20px rgba(255, 100, 100, 0.8)",
                opacity: interpolate(
                  frame,
                  [
                    timeline.students.start * fps,
                    timeline.students.start * fps + 1 * fps,
                  ],
                  [0, 1]
                ),
              }}
            >
              外争主权，内除国贼
            </div>
          </AbsoluteFill>
        </Sequence>
      </AbsoluteFill>

      {/* 工人加入 */}
      <AbsoluteFill>
        <Sequence from={timeline.workers.start * fps}>
          <div
            style={{
              width: 1200,
              height: 500,
              position: "absolute",
              bottom: "5%",
              left: "50%",
              transform: `translateX(${interpolate(workersProgress, [0, 1], [-0.3, 0.3])}%)`,
              opacity: interpolate(
                frame,
                [
                  timeline.workers.start * fps,
                  timeline.workers.start * fps + 0.5 * fps,
                ],
                [0, 1]
              ),
              textAlign: "center",
              padding: 40,
              backgroundColor: "rgba(39, 174, 96, 0.3)",
              borderRadius: 16,
              border: "3px solid #27ae60",
            }}
          >
            <h2
              style={{
                color: "#ecf0f1",
                fontSize: 48,
                fontWeight: "bold",
                marginBottom: 20,
              }}
            >
              上海工人罢工
            </h2>
            <p
              style={{
                color: "#ecf0f1",
                fontSize: 24,
                marginBottom: 30,
              }}
            >
              工人阶级成为运动主力<br />
              运动进入新阶段
            </p>
            <div
              style={{
                display: "flex",
                gap: 20,
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 100,
                  height: 100,
                  backgroundColor: "#27ae60",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "bold",
                }}
              >
                <div style={{ fontSize: 40 }}>🏭</div>
                <div>工人</div>
              </div>
              <div
                style={{
                  width: 100,
                  height: 100,
                  backgroundColor: "#27ae60",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "bold",
                }}
              >
                <div style={{ fontSize: 40 }}>🏪</div>
                <div>商人</div>
              </div>
              <div
                style={{
                  width: 100,
                  height: 100,
                  backgroundColor: "#27ae60",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "bold",
                }}
              >
                <div style={{ fontSize: 40 }}>🎓</div>
                <div>学生</div>
              </div>
            </div>
          </div>

          {/* 力量汇聚特效 */}
          <AbsoluteFill
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.3) 0%, transparent 70%)`,
              position: "absolute",
              top: 0,
              left: 0,
              transform: `scale(${interpolate(workersProgress, [0, 1], [0.5, 1.2])})`,
              opacity: interpolate(
                workersProgress,
                [0, 0.5, 1],
                [0, 0.5, 0]
              ),
            }}
          />
        </Sequence>
      </AbsoluteFill>

      {/* 胜利庆祝 */}
      <AbsoluteFill>
        <Sequence from={timeline.victory.start * fps}>
          <div
            style={{
              width: 1400,
              height: 600,
              position: "absolute",
              top: "10%",
              left: "50%",
              transform: `translateX(-50%) scale(${victoryScale})`,
              opacity: interpolate(
                frame,
                [
                  timeline.victory.start * fps,
                  timeline.victory.start * fps + 0.5 * fps,
                ],
                [0, 1]
              ),
              textAlign: "center",
              padding: 50,
              backgroundColor: "rgba(39, 174, 96, 0.2)",
              borderRadius: 20,
              border: "3px solid #27ae60",
            }}
          >
            <h1
              style={{
                color: "#ecf0f1",
                fontSize: 72,
                fontWeight: "bold",
                marginBottom: 30,
              }}
            >
              五四运动胜利！
            </h1>
            <div
              style={{
                display: "flex",
                gap: 30,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  padding: 20,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 12,
                }}
              >
                <div style={{ fontSize: 48 }}>✅</div>
                <div style={{ color: "#2ecc71", fontSize: 20, fontWeight: "bold" }}>
                  学生获释
                </div>
              </div>
              <div
                style={{
                  textAlign: "center",
                  padding: 20,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 12,
                }}
              >
                <div style={{ fontSize: 48 }}>✅</div>
                <div style={{ color: "#2ecc71", fontSize: 20, fontWeight: "bold" }}>
                  曹陆章被罢免
                </div>
              </div>
              <div
                style={{
                  textAlign: "center",
                  padding: 20,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 12,
                }}
              >
                <div style={{ fontSize: 48 }}>✅</div>
                <div style={{ color: "#2ecc71", fontSize: 20, fontWeight: "bold" }}>
                  拒签和约
                </div>
              </div>
            </div>
          </div>

          {/* 五四大字 */}
          <AbsoluteFill
            style={{
              position: "absolute",
              top: "30%",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <div
              style={{
                color: "#ff6b6b",
                fontSize: 200,
                fontWeight: "bold",
                textShadow: "0 0 30px rgba(255, 107, 107, 0.8)",
                opacity: interpolate(
                  frame,
                  [
                    timeline.victory.start * fps,
                    timeline.victory.start * fps + 1 * fps,
                  ],
                  [0, 1]
                ),
              }}
            >
              五四精神
            </div>
          </AbsoluteFill>
        </Sequence>
      </AbsoluteFill>

      {/* 配音 */}
      <Audio src={`${BASE_URL}/audio/narration.mp3`} />
    </AbsoluteFill>
  );
};
