# TeachAny AI 学伴 v1.0

通用、稳定的 AI 学伴组件，所有 TeachAny 课件可一键复用。

## 特性

- ✅ **左下悬浮球** - 不打扰阅读，单击呼出
- ✅ **配置即用** - 首次使用引导设置 API Key + Base URL
- ✅ **OpenAI 兼容协议** - 支持 DeepSeek / Moonshot / OpenRouter / OpenAI / Paratera 等
- ✅ **流式输出** - 实时打字效果
- ✅ **自动保存** - 配置和对话历史保存到 localStorage
- ✅ **课程定制** - 内置课程相关的系统提示词和快捷问题
- ✅ **学段适配** - 提示词会自动适配孩子的语气与字数

## 快速使用

### 1. 在课件 HTML 中引入

```html
<head>
  <!-- ... 其他内容 ... -->
  <link rel="stylesheet" href="../../assets/ai-companion/ai-companion.css">
</head>

<body>
  <!-- ... 课件内容 ... -->

  <!-- 在 </body> 前引入 -->
  <script src="../../assets/ai-companion/ai-companion.js"></script>
  <script>
    TeachAnyAI.init({
      courseTitle: "课件标题",
      grade: "学段（如 小学一年级）",
      subject: "学科（如 语文）",
      topic: "主题（如 古诗平仄启蒙）",
      systemPrompt: `自定义系统提示词（可选，不填则用默认模板）`
    });
  </script>
</body>
```

### 2. 路径说明

不同课件目录深度，路径不同：

| 课件位置 | 路径 |
|---|---|
| `community/<course>/index.html` | `../../assets/ai-companion/` |
| `examples/<course>/index.html` | `../../assets/ai-companion/` |
| `examples/<course>/<sub>/index.html` | `../../../assets/ai-companion/` |

## 配置项详解

### courseTitle（必填）
课件标题，用于历史记录隔离（每门课独立的对话历史）。

### grade（必填）
学段，例如：`"小学一年级"`、`"初中"`、`"高中"`、`"大学"`。

### subject（必填）
学科，例如：`"语文"`、`"数学"`、`"物理"`。

### topic（必填）
课程主题，会传给 AI 作为上下文。

### systemPrompt（可选）
自定义系统提示词。**强烈建议自定义**，提供：
- 课程的核心知识点
- 期望 AI 的回答风格
- 常见问题示例
- 称呼孩子的方式

不传则使用默认模板（自动根据 grade/subject/topic 生成）。

## API

### `TeachAnyAI.init(context)`
初始化 AI 学伴，注入悬浮球和聊天面板。

### `TeachAnyAI.open()`
程序触发打开聊天面板。

### `TeachAnyAI.close()`
程序触发关闭聊天面板。

### `TeachAnyAI.config()`
程序触发打开设置弹窗。

## 用户体验流程

1. **首次访问** → 看到左下悬浮球
2. **点击悬浮球** → 弹出聊天面板，并提示设置 API
3. **点击 ⚙️** → 选择服务商（DeepSeek/Moonshot/...），填 API Key
4. **测试连接** → 点击"🔍 测试连接"按钮验证
5. **保存** → 配置保存到 localStorage
6. **聊天** → 流式回复，自带本课程上下文

## 支持的服务商预设

| 预设 | Base URL | 默认模型 | 特点 |
|---|---|---|---|
| **DeepSeek** | https://api.deepseek.com/v1 | deepseek-chat | 便宜、效果好（推荐） |
| **Moonshot Kimi** | https://api.moonshot.cn/v1 | moonshot-v1-8k | 中文好 |
| **OpenRouter** | https://openrouter.ai/api/v1 | deepseek/deepseek-chat | 多模型聚合 |
| **OpenAI** | https://api.openai.com/v1 | gpt-4o-mini | 国际通用 |
| **Paratera** | https://llmapi.paratera.com/v1 | DeepSeek-V3.2 | 国内集群 |
| **自定义** | - | - | 任何 OpenAI 兼容 API |

## 提示词最佳实践

### 小学（一-六年级）
```javascript
systemPrompt: `你是一位面向小学X年级孩子的XX老师...

【你的回答风格】
1. 用孩子能听懂的简单话回答
2. 多用比喻、故事、儿歌
3. 每次回答控制在 100 字以内
4. 多用 emoji 让孩子开心
5. 称呼孩子用"小朋友"
6. 鼓励思考，不直接给答案`
```

### 初中
```javascript
systemPrompt: `你是一位面向初中生的XX老师...

【风格】
1. 简洁清晰，每次回答 200 字以内
2. 多用例子和图示
3. 引导学生自己推导
4. 必要时给出参考答案，但要先讲思路`
```

### 高中
```javascript
systemPrompt: `你是一位面向高中生的XX老师...

【风格】
1. 严谨、有条理，可以用专业术语
2. 每次回答 300 字以内
3. 解题时分步骤给出
4. 提示常见易错点`
```

## 安全说明

- API Key **仅保存在用户浏览器的 localStorage**，不会上传到任何服务器
- 每个课件独立的对话历史（按 courseTitle 隔离）
- 用户可随时点击 🗑️ 清空对话

## 故障排查

### 悬浮球没出现
- 检查 CSS 路径是否正确
- 检查 JS 路径是否正确
- 看浏览器 Console 是否有 `[TeachAny AI] 已初始化` 输出

### 测试连接失败
- 检查 Base URL 是否以 `/v1` 结尾
- 检查 API Key 是否正确
- 检查模型名称是否服务商支持
- 部分浏览器需关闭 CORS 检查（一般不会有问题）

### 回复总是出错
- 打开浏览器 Console 看 `[AI] 出错:` 详情
- 重新点 ⚙️ 测试连接

## 版本历史

- **v1.0** (2026-04-26) - 首版发布
  - 左下悬浮球 + 聊天面板
  - 5 个预设服务商
  - 流式输出
  - 课程上下文定制
