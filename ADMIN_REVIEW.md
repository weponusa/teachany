# TeachAny 课件安全审查清单

> 本文档供管理员审核社区提交的课件（PR）时使用。  
> 每条课件必须通过以下所有检查项方可合并。

---

## 一、自动化扫描（必须通过）

在审核 PR 前，先运行自动安全扫描：

```bash
# 扫描特定课件目录
node security-scan.cjs --dir <课件ID>

# 扫描全部课件（可选）
node security-scan.cjs

# 严格模式（MEDIUM 级别也拦截）
node security-scan.cjs --strict
```

**准入标准**：
- ✅ 零 CRITICAL 问题
- ✅ 零 HIGH 问题
- 🟡 MEDIUM 问题需人工判断是否可接受

---

## 二、文件结构检查

- [ ] 必须包含 `index.html`（课件入口）
- [ ] 可选包含 `manifest.json`（课件元数据）
- [ ] 资源文件（图片、音频、视频）应放在同级或子目录
- [ ] 文件名不含特殊字符（空格、中文以外的非 ASCII 字符）
- [ ] 总文件大小不超过 50MB

---

## 三、安全检查（重点审查）

### 3.1 网络请求 🔴 CRITICAL

- [ ] **无 `fetch()` 调用**（除非是加载本地资源）
- [ ] **无 `XMLHttpRequest`** 
- [ ] **无 `WebSocket` 连接**
- [ ] **无 `navigator.sendBeacon()`**
- [ ] **无 `EventSource` (SSE)**

### 3.2 动态代码执行 🟠 HIGH

- [ ] **无 `eval()`**
- [ ] **无 `new Function()`**
- [ ] **无 `document.write()`**
- [ ] **无 `setTimeout/setInterval` 传入字符串参数**

### 3.3 外部资源加载 🟠 HIGH

- [ ] 所有 `<script src>` 来自白名单 CDN
- [ ] 所有 `<link href>` 来自白名单 CDN
- [ ] 无动态创建 `<script>` 或 `<iframe>` 标签

**白名单 CDN**：
- `cdn.jsdelivr.net`
- `cdnjs.cloudflare.com`
- `unpkg.com`
- `fonts.googleapis.com` / `fonts.gstatic.com`
- `cdn.bootcdn.net`
- `cdn.tailwindcss.com`
- `raw.githubusercontent.com/weponusa/teachany/`

### 3.4 页面跳转限制 🟠 HIGH

- [ ] **所有 `<a href>` 链接只指向 TeachAny 内部页面或同站课件**
- [ ] **无 `window.open()` 打开外部网站**
- [ ] **无 `location.href` / `location.replace` 跳转外部**

允许的链接目标：
- 相对路径（`./`, `../`）
- 锚点（`#`）
- `weponusa.github.io/teachany/*`
- `github.com/weponusa/teachany`

### 3.5 敏感数据访问 🟡 MEDIUM

- [ ] **无 `document.cookie` 访问**
- [ ] `localStorage` 操作仅限保存学习进度（需人工确认用途）

### 3.6 跟踪与挖矿 🔴 CRITICAL

- [ ] **无 Google Analytics / 百度统计等跟踪代码**
- [ ] **无加密货币挖矿脚本**
- [ ] **无 Facebook Pixel 等广告跟踪**

---

## 四、内容质量检查

- [ ] 课件标题与实际内容一致
- [ ] 学科、年级标注正确
- [ ] 知识点准确，无明显错误
- [ ] 交互功能正常（按钮、选项、动画）
- [ ] 移动端基本可用（响应式布局）
- [ ] 无不当内容（暴力、色情、歧视性语言）

---

## 五、Manifest 元数据检查

如果包含 `manifest.json`：

- [ ] `name` 字段非空，符合中文课件命名
- [ ] `subject` 为有效学科标识（math/physics/chemistry/biology/geography/history/chinese/english）
- [ ] `grade` 为 1-12 之间的数字
- [ ] `node_id` 与知识树节点 ID 对应
- [ ] `author` 字段填写合理

---

## 六、CSP 安全策略检查

- [ ] 课件不依赖外部网络请求（兼容 `connect-src 'none'` CSP）
- [ ] 课件不内嵌第三方 iframe（兼容 `frame-src 'none'` CSP）
- [ ] 课件不使用 Flash/Java 等插件（兼容 `object-src 'none'` CSP）

---

## 七、审核决策

| 结果 | 条件 |
|:---|:---|
| ✅ **通过** | 所有 CRITICAL 和 HIGH 检查项通过 |
| 🟡 **有条件通过** | MEDIUM 问题经人工确认为合理用途 |
| ❌ **拒绝** | 存在任何 CRITICAL 或 HIGH 未解决问题 |

### 审核记录模板

```
审核人：
审核日期：
课件 ID：
安全扫描结果：PASS / FAIL
人工审查结果：✅ 通过 / 🟡 有条件通过 / ❌ 拒绝
备注：
```

---

## 附录：常见安全问题修复指南

### Q1: 课件中使用了 fetch() 加载本地 JSON 数据
**修复方案**：将 JSON 数据内联到 HTML 中，使用 `<script>` 标签定义变量，或将数据嵌入 `data-*` 属性。

### Q2: 课件引用了非白名单 CDN 的第三方库
**修复方案**：
1. 改用白名单中的 CDN（如 `cdn.jsdelivr.net`）
2. 将第三方库代码内联到 HTML 文件中
3. 申请将该 CDN 加入白名单（需提交 Issue）

### Q3: 课件中包含了 localStorage 操作
**审核要点**：确认仅用于保存学习进度、答题记录等教学相关数据，不涉及用户隐私采集。

---

*最后更新：2026-04-15*
