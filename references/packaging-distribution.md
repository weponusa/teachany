# 十七、课件打包与分发

> 本文件是 SKILL_CN.md 的「十七、课件打包与分发」章节的详细内容，按需加载以节省上下文。
> 触发条件：需要**打包课件、发布到 registry、推送 git**或处理 PR 时。

---


TeachAny 课件可以打包为 `.teachany` 文件（标准 ZIP 格式），方便导入、分享和管理。

### 17.1 课件包结构

```text
my-course.teachany          ← ZIP 压缩，扩展名 .teachany
├── manifest.json           ← 必须：课件元信息
├── index.html              ← 必须：主课件文件
├── index_en.html           ← 可选：英文版课件
├── README.md               ← 可选：课件说明
├── thumbnail.png           ← 可选：缩略图（推荐 600×400）
└── assets/                 ← 可选：音视频等资源
```

### 17.2 manifest.json 必填字段

```jsonc
{
  "name": "一次函数与正比例函数",     // ⛔ 必选：课件中文名
  "subject": "math",                   // ⛔ 必选：学科 ID（必须与 data/<subject>/ 目录对应）
  "grade": 8,                          // ⛔ 必选：适用年级（1-12）
  "author": "weponusa",                // ⛔ 必选：作者
  "version": "1.0.0",                  // ⛔ 必选：版本号
  "node_id": "linear-function",        // ⛔ v5.19/v5.20 必选 + 必须校验：必须是 data/trees/<subject>-<level>.json 中真实存在的节点 ID（tree.html 只读此文件）
  "domain": "function",                // 可选：所属领域
  "prerequisites": ["proportional-function"],  // 可选：前置知识
  "emoji": "📏",                        // ⛔ 必选：展示 emoji；只在 manifest.json 定义，不要同步写成 HTML <meta name="teachany-emoji">
  "difficulty": 3,                      // ⛔ 必选：难度 1-5
  "teachany_spec": "1.0"               // ⛔ 必选：规范版本
}
```

> **字段边界**：`emoji` 是 `manifest.json` 字段，用于 Gallery/知识地图展示；`index.html` 只保留 `teachany-node/subject/domain/grade/prerequisites/difficulty/version/author` 等标准 meta，禁止新增 `teachany-emoji` 以免与 manifest/registry 产生双源不一致。
>
> **⛔ v5.19 核心变更 + v5.20 重大纠正**：`node_id` 从 "可选但推荐" 升级为 **"必选 + 必须校验"**，且校验目标是 `data/trees/*.json` 旧 schema（不是 `data/<subject>/<branch>/_graph.json` 新 schema）。
> 
> **校验命令**（发布前强制执行，v5.20 修订版）：
> ```bash
> # 以 subject=history, grade=高中, node_id=hist-h-classical-civ 为例
> # ⭐ 查 data/trees/*.json 旧 schema，这才是知识地图 tree.html 实际加载的数据源
> grep -rn "\"id\":\s*\"hist-h-classical-civ\"" data/trees/history-*.json
> # 必须有命中，否则不允许发布
>
> # 列出某学科所有真实节点 ID（发布前可用来选节点）
> jq '.. | objects | select(.id?) | .id' data/trees/history-high.json | sort -u
> ```
> 
> ⛔ **不要查 `data/<subject>/<branch>/_graph.json`**——新 schema 节点 ID 形如 `classical-greece-rome`（语义名），而 `tree.html` 硬编码只读 `data/trees/*.json`（节点 ID 形如 `hist-h-classical-civ`，带学科前缀），两套 schema 节点 ID 体系完全不同，混用必翻车。
>
> **为什么必选？** `node_id` 不存在或查错 schema 会导致：
> - rebuild-index.py 报 `⚠️ 文件存在但知识树未引用`（这是**真发布失败**，不是假报警）
> - 课件可能进入 `registry.json` 和 Gallery，但**知识地图节点打不开该课件**
> - 用户以为"推成功了"，实际 Gallery 看得到、知识地图看不到 → 发布失效
> 
> **真实踩坑案例**（hist-classical-civilization，v5.20 当场发现）：
> - v5.19 按"查 `data/history/world-history/_graph.json` 新 schema"的错误流程，manifest 写了 `"node_id": "classical-greece-rome"`
> - 新 schema 节点挂成功了，但 `data/trees/history-high.json` 旧 schema 根本没有这个节点
> - 结果 Gallery 能看到 ✅，知识地图 ❌ 看不到，被用户当场戳穿
> - **修复方案**：改 manifest `node_id` 为旧 schema 真实节点 `hist-h-classical-civ`，用 Python 把课件 ID 注入 `data/trees/history-high.json` 的 `hist-h-classical-civ` 节点 `courses[]` 数组

完整 Schema 详见 `docs/courseware-package.md`。

### 17.3 打包命令

课件生成完成后，执行以下命令打包：

```bash
# 自动从 index.html meta 标签生成 manifest.json 并打包
node scripts/pack-courseware.cjs ./examples/math-linear-function

# 指定输出目录
node scripts/pack-courseware.cjs ./examples/math-linear-function ./dist
```

如果目录中已有 `manifest.json`，脚本会直接使用；否则会从 `index.html` 的 `<meta name="teachany-*">` 标签自动生成。

### 17.4 AI 生成课件后的标准流程（默认执行）

在 Phase 3（制作内容）完成后，**自动执行** Phase 3.5 — 质检与打包：

```text
Phase 3.5：质检与打包（自动执行）

Step 1️⃣ 内置质检（Inline Validation）
  无需外部脚本，AI 直接检查以下核心项：
  
  ✅ meta 标签完整性（node、subject、grade、author）
  ✅ ABT 叙事引入（检测关键词）
  ✅ 互动练习数量（至少 3 组）
  ✅ 前测/后测存在性
  ✅ 音频/视频资源路径有效性
  ✅ 响应式布局标记
  
  输出：通过率 + 未通过项简要说明

Step 2️⃣ 打包（Packaging）
  生成 manifest.json 和 .teachany 压缩包
  
  方式 A（优先）：调用打包脚本
  ```bash
  node scripts/pack-courseware.cjs <课件目录>
  ```
  
  方式 B（降级）：手动生成
  1. 读取 index.html 的 meta 标签
  2. 创建 manifest.json
  3. 使用 zip 命令打包目录：
     ```bash
     cd <课件目录> && zip -r ../<course-id>.teachany . -x "*.DS_Store"
     ```

Step 3️⃣ 课件落地 + 用户身份上传
  课件做完、打包、质检通过后，AI 默认按用户身份发布，不需要额外的本地权限标记文件。

  **3.1 本地预览（可选）**
  1. 可先将课件写入 `community/drafts/<course-id>/` 做本地预览。
  2. 确认无误后移动到 `community/<course-id>/`。

  **3.2 社区目录发布（默认执行）**
  ```bash
  mkdir -p community/<course-id>
  cp -R <生成目录>/* community/<course-id>/
  python3 scripts/rebuild-index.py
  git add -A
  git commit -m "feat: 新增课件 <course-id>"
  git push origin main
  git push gitee main
  ```

  **3.3 注册规则**
  - `rebuild-index.py` 直接扫描 `community/` 和 `examples/`，以实际课件文件为唯一信源。
  - 新增用户课件统一进入 `community/<course-id>/`。
  - 不再区分多种上传身份或审批路径。
  - `examples/` 仅保留存量官方示例，不作为课件制作默认写入目录。

Step 4️⃣ 提交成功后告知用户后续流程
  - 输出本地文件路径：`community/<course-id>/index.html`
  - 输出在线地址：`https://weponusa.github.io/teachany/community/<course-id>/`
  - 说明 GitHub Pages 可能有 5-10 分钟缓存延迟
```

#### ⭐ Phase 3.6 发布成功率保障四件套（v5.19 新增）

> **背景**：课件推送后，Gallery 和知识地图可能因为索引未重建、node_id 错误或部署延迟而看不到新课件。本节把发布路径拆成 4 个强制步骤，任何一步失败都**不算发布成功**。

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭐ 发布四件套（用户身份上传强制执行，任何一步失败必须暴露给用户）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

① 校验 manifest.json 关键字段
   必查字段：name / subject / grade / author / node_id / emoji / difficulty
   
   ⛔ 硬校验 node_id 真实存在（v5.20 修正：必须查 data/trees/*.json 旧 schema，不是 _graph.json）：
   ```bash
   # 以 manifest.json 中 subject=history, grade=高中, node_id=hist-h-classical-civ 为例
   NODE_ID=$(jq -r .node_id community/<course-id>/manifest.json)
   SUBJECT=$(jq -r .subject community/<course-id>/manifest.json)
   # 注意：tree.html 只加载 data/trees/*.json，必须在这里能 grep 到
   if ! grep -rql "\"id\":\s*\"${NODE_ID}\"" data/trees/${SUBJECT}-*.json; then
     echo "⛔ node_id '${NODE_ID}' 在 data/trees/${SUBJECT}-*.json 中不存在，发布中断"
     echo "   提示：用 jq '.. | objects | select(.id?) | .id' data/trees/${SUBJECT}-*.json 列出所有真实节点 ID"
     exit 1
   fi
   ```
   
   ⛔ 如果 node_id 错误，必须当场修正 manifest.json，禁止"先发再说"。
   ⛔ 不要去 grep `data/<subject>/<branch>/_graph.json`——知识地图 `tree.html` 根本不读该文件（v5.20 实测确认）。

② 运行 rebuild-index.py 三件套
   ```bash
   python3 scripts/rebuild-index.py
   ```
   
   产出文件（全部必须被 commit）：
   - registry.json                                （全局课件索引，Gallery 读取）
   - courseware-registry.json                     （Gallery 展示索引）
   - data/trees/<subject>-<level>.json            （知识地图读取，⭐ 最关键！）
   - data/<subject>/<branch>/_graph.json          （次要数据源，tree.html 不读）
   
   ⛔ 强制检查输出（v5.20 修正）：
   - 输出中出现 `⚠️ 文件存在但知识树未引用: <course-id>` → **就是发布失败**
     → 立刻返回 ① 修正 node_id、用 Python 注入 `data/trees/*.json` 对应节点的 `courses[]`、重跑本步骤
     → 不得以"假报警""只是新 schema 没引用"等理由放行（v5.19 的错误结论已在 v5.20 推翻）
   - 输出中 "完整课件" 计数必须 +1（相对本次发布前）
   - 产出文件必须被 git 识别为 modified（特别是 `data/trees/<subject>-*.json`）

③ git add -A + commit + 双远程推送
   ```bash
   git add -A
   git commit -m "feat: 新增课件 <course-id>（<课件中文名>）"
   
   # 主远程（必须成功，失败重试 3 次）
   for i in 1 2 3; do
     git push origin main && break
     echo "origin push 第 $i 次失败，等 5s 重试..." && sleep 5
   done
   
   # 镜像远程（失败不阻断，但必须明确告知用户）
   git push gitee main || echo "⚠️ gitee 镜像推送失败，课件仅在 GitHub 可见，请稍后手动重推"
   ```
   
   ⛔ 禁止仅推其中一个远程就声称"已发布"。
   ⛔ 如果 `git push origin main` 3 次重试全失败，必须把错误日志原文贴给用户，不得静默吞异常。

④ 部署滞后提示 + 可访问性验证
   AI 必须主动告知用户：
   
   ```
   ✅ 已完成 commit 和推送，但 GitHub Pages 部署需要 5–10 分钟才会生效。
   
   稍后可用以下命令验证课件是否已上线：
   curl -I "https://weponusa.github.io/teachany/community/<course-id>/"
   # 返回 HTTP/2 200 = 已生效
   # 返回 HTTP/2 404 = 仍在部署，再等 2 分钟
   
   Gallery 页面入口：
   https://weponusa.github.io/teachany/
   
   知识地图节点入口：
   https://weponusa.github.io/teachany/knowledge-tree.html?subject=<subject>&node=<node_id>
   ```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> **⚠️ v5.19 / v5.20 强制原则**：
> - 不跑 rebuild-index.py 就 git push = **发布失败**（硬规则 #37）
> - manifest.json `node_id` 不在 `data/trees/*.json` 中 = **发布失败**（硬规则 #38，v5.20 修订）
> - rebuild-index 输出 "⚠️ 未被知识树引用" 还强推 = **发布失败**（v5.20：这不是假报警，是真信号）
> - 仅推 origin 没推 gitee 就声称"已发布" = **发布不完整**（见 Phase 3.6 Step ③ 双推规则）
> 
> 这四条任何一条中招，AI 必须在输出给用户的汇报里把具体失败项标红，而非糊弄过去。

#### ⚠️ v5.20 重大纠正：知识地图只读 `data/trees/*.json`，不读 `data/<subject>/<branch>/_graph.json`

> **v5.19 原结论已推翻**。v5.20 实测确认：`rebuild-index.py` 的 `⚠️ 文件存在但知识树未引用` 警告 **不是假报警**，它是**真的发布失败信号**，必须认真处理。

**真相（v5.20 实测验证）**：

1. **知识地图前端 `tree.html` 硬编码只从 `data/trees/<subject>-<level>.json` 加载数据**（`tree.html:414-435` 的 `TREE_FILES` 数组）：
   ```js
   { file: 'data/trees/history-high.json', emoji: '🏛️', label: '高中历史' },
   { file: 'data/trees/geography-high.json', emoji: '🌍', label: '高中地理' },
   ...  // 共 18 个旧 schema 文件
   ```
   它**完全不扫** `data/<subject>/<branch>/_graph.json` 新 schema。

2. **节点 ID 在两套 schema 里不一样**，这是最大坑：
   - 旧 schema `data/trees/history-high.json` → 节点 ID 形如 `hist-h-classical-civ`（加 `hist-h-` 前缀）
   - 新 schema `data/history/world-history/_graph.json` → 节点 ID 形如 `classical-greece-rome`（语义名）
   - **manifest.json 的 `node_id` 必须填旧 schema 的前缀版 ID，否则知识地图点不亮**

3. **`rebuild-index.py` 扫描目标正确**（只扫 `data/trees/*.json`），它的警告就是对的：
   - 只要输出 `⚠️ 文件存在但知识树未引用: <course-id>`
   - 就说明 `data/trees/*.json` 里**没有任何节点**的 `courses[]` 数组包含该课件
   - → 知识地图一定看不到这张课件 → 发布失败

**真实翻车案例**（v5.20 当场发现）：

v5.19 给 `hist-classical-civilization` 挂在 `data/history/world-history/_graph.json` 的 `classical-greece-rome` 节点，manifest 写 `node_id: "classical-greece-rome"`，结果：
- Gallery ✅ 能看到（因为 Gallery 读 `registry.json`）
- 知识地图 ❌ 看不到（`tree.html` 根本不读 `_graph.json`）
- `rebuild-index.py` 警告了，v5.19 错误解读为"假报警"，推上线才被用户当场戳穿

**正确 node_id 查询流程**（发布前强制执行）：

```bash
# 1. 按学科-学段定位真正的树文件
SUBJECT_FILE="data/trees/history-high.json"   # 学科+学段

# 2. 列出该树所有可用节点 ID + 名字
python3 -c "
import json
t = json.load(open('$SUBJECT_FILE'))
def walk(o):
    if isinstance(o, dict):
        if 'id' in o and 'courses' in o:
            print(f\"  {o['id']:35s} | {o.get('name','')}\")
        for v in o.values(): walk(v)
    elif isinstance(o, list):
        for v in o: walk(v)
walk(t)
"

# 3. 选一个最匹配的节点 ID（如 hist-h-classical-civ）写入 manifest.json
# 4. 用 Python 原子注入到 courses[]：
python3 -c "
import json
FILE = '$SUBJECT_FILE'
NODE = 'hist-h-classical-civ'
COURSE = 'hist-classical-civilization'
t = json.load(open(FILE))
def fix(o):
    if isinstance(o, dict):
        if o.get('id') == NODE:
            cs = set(o.get('courses', []))
            cs.add(COURSE)
            o['courses'] = sorted(cs)
            o['status'] = 'active'
            print('✅ 注入:', NODE, '→', sorted(cs))
        for v in o.values(): fix(v)
    elif isinstance(o, list):
        for v in o: fix(v)
fix(t)
json.dump(t, open(FILE,'w'), ensure_ascii=False, indent=2)
"

# 5. 重跑 rebuild-index 确认警告数减少
python3 scripts/rebuild-index.py 2>&1 | tail -10
# 必须看到 "树引用" 数字 +1，且该课件不再出现在 "⚠️ 未被知识树引用" 列表
```

**⛔ AI 执行硬规则（v5.20 修订）**：

1. `rebuild-index.py` 的 `⚠️ 文件存在但知识树未引用` **就是发布失败信号**，不得以任何理由声称"假报警"
2. 遇到警告必须：查旧 schema 树 → 选对应节点 → 改 manifest `node_id` → Python 注入 `courses[]` → 重跑 rebuild-index 直至警告消失
3. 只要警告没消，**禁止 git push**
4. `data/<subject>/<branch>/_graph.json` 是次要数据源（实验性新 schema），**只维护它没用**，必须同时维护 `data/trees/*.json`

**长期修复计划**：
- 方案 A：升级 `tree.html`，让它同时加载 `data/<subject>/<branch>/_graph.json` 新 schema
- 方案 B：升级 `rebuild-index.py`，让它双向同步——从 `_graph.json` 自动往 `data/trees/*.json` 生成对应节点
- 在上述修复落地前，**`data/trees/*.json` 是发布目标的唯一真相来源**

#### ⚠️ 另一条 v5.20 澄清：`tree.html`（知识地图页）本身不带地理底图

> 用户反馈"地图没有底图"。v5.20 查证 `tree.html` 全文 1067 行，**0 处** `leaflet` / `hillshade` / `imageOverlay` / `L.tileLayer` / `echarts geo` 关键字——`tree.html` 是纯 **D3/SVG 节点图**，不是地理地图，天生就没有地形/行政区划底图。

**正确心智模型**：

| 页面 | 定位 | 是否该有底图 |
|---|---|---|
| `tree.html`（知识地图） | 学科知识点拓扑图（节点 = 知识点，边 = 前置关系） | ❌ 不需要，也没有 |
| `examples/<course-id>/index.html`（课件内部地图） | 教学用地理/历史地图（hillshade + GeoJSON + 行政区划） | ✅ 必须有，见 Section 18.5.1 Leaflet 四件套 |

**所以**：hillshade 地形底图、GeoJSON 疆域叠加、fitBounds 聚焦核心区域（硬规则 #35 #36）这一整套方案**只应用于课件自身 `index.html`**，不应期望 `tree.html` 自带地图底图。若未来要给 `tree.html` 也加地理底图（例如地理/历史学科的拓扑图铺一张轻量世界地图底纹），属于独立增量需求，需另立 issue，不在本 SKILL 当前强制范围内。

#### ⚠️ v5.21 重大纠正：GitHub Pages **不部署** `data/geography/` 下的大型二进制文件

> **v5.20 澄清了"tree.html 不带底图"——但又跑出新坑**：用户反馈 `hist-classical-civilization` 课件**自己内部那张 Leaflet 地图也没有底图、也没有行政边界**。明明 Section 18.5.1 Leaflet 四件套代码齐全（`L.imageOverlay` + `L.geoJSON`），为什么还是空？

**实测验证（v5.21）**：

```bash
# 仓库里 tracked & push ✅
$ git ls-tree -l origin/main data/geography/hillshade/global-color-hillshade-4k.jpg
100644 blob 1576117...  856055  data/geography/hillshade/global-color-hillshade-4k.jpg

# raw.githubusercontent.com 能访问 ✅
$ curl -sI https://raw.githubusercontent.com/<user>/<repo>/main/data/geography/hillshade/global-color-hillshade-4k.jpg
HTTP/2 200

# GitHub Pages 返回 404 ❌
$ curl -sI https://<user>.github.io/<repo>/data/geography/hillshade/global-color-hillshade-4k.jpg
HTTP/2 404

# 同目录下的 README.md 却能访问 ✅
$ curl -sI https://<user>.github.io/<repo>/data/geography/README.md
HTTP/2 200
```

**结论**：即使设置了 `.nojekyll`，GitHub Pages 依然会对 `data/geography/` 下的 `.jpg` / 大型 `.geojson` 存在**跳过部署**现象。同目录下的 `README.md` 能访问、`*.jpg` 却全部 404，现象稳定复现。

**真实翻车案例**（hist-classical-civilization，v5.21 当场发现）：

- 课件 HTML 的 Leaflet 代码写了 `L.imageOverlay('../../data/geography/hillshade/global-color-hillshade-4k.jpg', ...)`
- 本地预览 ✅ 能看到底图
- 推到 Pages ❌ 底图全空白，只剩下城市 marker 和贸易航线

#### Section 18.5.2 · v5.21 修复方案：Leaflet 资源必须用"本地路径 + jsDelivr CDN 回退"双路径

**任何课件 `index.html` 中凡涉及 `data/geography/**/*.jpg` 或 `data/geography/**/*.geojson` 的资源加载，必须使用以下辅助函数**（直接复制到课件 `<script>` 顶部）：

```javascript
// === v5.21 地图资源智能加载器（防 GitHub Pages 跳过部署大文件）===
const GEO_CDN_BASE = 'https://cdn.jsdelivr.net/gh/<USER>/<REPO>@main';  // ⛔ 替换为实际仓库
const GEO_LOCAL_BASE = '../..';
function geoAssetUrl(relPath) {  // relPath 如 "data/geography/hillshade/global-color-hillshade-4k.jpg"
  return `${GEO_LOCAL_BASE}/${relPath}`;
}
function geoAssetCdn(relPath) {
  return `${GEO_CDN_BASE}/${relPath}`;
}
// 底图：本地优先，失败回退 CDN
function addSmartImageOverlay(map, relPath, bounds, opts) {
  const img = new Image();
  img.onload  = () => L.imageOverlay(geoAssetUrl(relPath), bounds, opts).addTo(map);
  img.onerror = () => L.imageOverlay(geoAssetCdn(relPath), bounds, opts).addTo(map);
  img.src = geoAssetUrl(relPath);
}
// GeoJSON：本地优先，失败回退 CDN
async function geoFetchJson(relPath) {
  try {
    const r = await fetch(geoAssetUrl(relPath));
    if (!r.ok) throw new Error('local ' + r.status);
    return await r.json();
  } catch (e) {
    const r = await fetch(geoAssetCdn(relPath));
    return await r.json();
  }
}
```

**使用方式**（替代原硬编码）：

```javascript
// ❌ 旧（硬编码单路径，Pages 线上必 404）
L.imageOverlay('../../data/geography/hillshade/global-color-hillshade-4k.jpg', [[-90,-180],[90,180]]).addTo(map);
fetch('../../data/geography/world/countries.geojson').then(r => r.json()).then(...);

// ✅ 新（智能加载）
addSmartImageOverlay(map, 'data/geography/hillshade/global-color-hillshade-4k.jpg', [[-90,-180],[90,180]], { opacity: 0.65 });
geoFetchJson('data/geography/world/countries.geojson').then(geoJson => { ... });
```

**发布前验证命令（强制）**：

```bash
# 用实际仓库信息替换
USER=weponusa
REPO=teachany
for f in \
  "data/geography/hillshade/global-color-hillshade-4k.jpg" \
  "data/geography/world/countries.geojson"
do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://${USER}.github.io/${REPO}/${f}")
  cdn=$(curl -s -o /dev/null -w "%{http_code}" "https://cdn.jsdelivr.net/gh/${USER}/${REPO}@main/${f}")
  printf "%-60s Pages=%s  CDN=%s\n" "$f" "$code" "$cdn"
done
```

**硬性要求**：**Pages 返回 200 或 CDN 返回 200 至少一边为真**才能声称"地图底图已上线"；如果 Pages=404 且课件未用双路径回退，**发布失败**（硬规则 #39 Gate 不通过）。

**为什么选 jsDelivr 而不是 raw.githubusercontent.com？**

| CDN | 稳定性 | CORS | HTTPS | 缓存 | 推荐度 |
|---|---|---|---|---|---|
| `cdn.jsdelivr.net/gh/*` | 高（全球节点） | ✅ 允许 | ✅ | 积极 | ⭐⭐⭐⭐⭐ |
| `raw.githubusercontent.com` | 中 | ⚠️ 部分场景被限 | ✅ | 短 | ⭐⭐⭐（兜底） |

jsDelivr 自动代理 GitHub 公开仓库、全球 CDN 节点、带宽免费、CORS 友好，是 GitHub Pages 大文件缺失的标准兜底。

#### ⚠️ v5.22 再次纠正：**弃用 `L.imageOverlay` 全球底图方案，改用 XYZ 瓦片**

> **v5.21 解决了底图加载问题（CDN 兜底）——但又跑出新坑**：用户反馈"还是对不齐底图"。排查后定位到**本质根因**：`L.imageOverlay('../../data/geography/hillshade/global-color-hillshade-4k.jpg', [[-90,-180],[90,180]])` 用的是**等距圆柱（equirectangular）投影**的静态大图，而 **Leaflet 默认地图是 Web Mercator (EPSG:3857) 投影**——两种投影在高纬度地区差异极大（纬度 60° 处 Mercator 拉伸约 2 倍），底图和 WGS84 GeoJSON 必然错位。

**投影不匹配示意**：

| 投影 | 纬度保形 | Web Mercator 实际显示 |
|---|---|---|
| Equirectangular（源图） | 等距线性 | 高纬度被垂直拉伸 → 地中海以北错位 |
| Web Mercator（Leaflet 默认） | 保角 | GeoJSON 精确对齐 |

**结论**：只要 Leaflet 地图用的是默认 Mercator CRS，就**不能**把一张 `[-90,90]×[-180,180]` 的 equirectangular 全球图当底图用 `L.imageOverlay` 直铺。

#### Section 18.5.3 · v5.22 方案：标准 XYZ 瓦片底图（Web Mercator，原生对齐）

**正确做法**：用 `L.tileLayer` 加载 XYZ 瓦片服务（TileMapService），所有主流瓦片源都是 Web Mercator，与 `L.geoJSON` 原生对齐。

**推荐底图组合**（全部免费、无需 API key、无需注册）：

| 角色 | URL 模板 | 用途 | opacity 建议 |
|---|---|---|---|
| 底层：深色地图 | `https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png`（`subdomains: 'abcd'`） | 海陆分界、国界、省/州界、地名 | 0.85-0.9 |
| 叠加层：地形浮雕 | `https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}`（注意 y/x 顺序与 CartoDB 不同） | 山脉、河谷、起伏纹理 | 0.35-0.45 |
| 备选：纯地形 | `https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}` | 彩色地形图（含海底地貌） | 0.5-0.7 |
| 备选：街道 | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | 地名、道路（色调偏亮，不适合深色主题） | — |

**双层叠加模板**（直接复制到课件 `<script>`）：

```javascript
// v5.22 XYZ 瓦片底图：Web Mercator 投影，原生对齐 GeoJSON
function addBaseTiles(map, opts = {}) {
  const terrainOpacity = opts.terrainOpacity ?? 0.4;
  const darkOpacity    = opts.darkOpacity    ?? 0.88;

  // 底层：CartoDB Dark —— 海陆+国界+地名
  L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
    opacity: darkOpacity,
    attribution: '© CartoDB · © OpenStreetMap'
  }).addTo(map);

  // 叠加层：Esri Shaded Relief —— 山脉纹理
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 13,
    opacity: terrainOpacity,
    attribution: 'Esri · Shaded Relief'
  }).addTo(map);
}

// 初始化地图（示例：希腊）
const map = L.map('greece-map', {
  center: [37.5, 23.5],
  zoom: 6,
  minZoom: 4,
  maxZoom: 10
});
addBaseTiles(map, { terrainOpacity: 0.45, darkOpacity: 0.9 });

// GeoJSON 叠加：与底图天然对齐，无需任何投影转换
geoFetchJson('data/geography/world/countries.geojson').then(geoJson => {
  L.geoJSON(geoJson, { /* 样式 */ }).addTo(map);
});
```

**验证瓦片可用性**（发布前可选）：

```bash
# CartoDB Dark
curl -sI -m 5 "https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/6/35/25.png" | head -1
# Esri Shaded Relief（注意 /z/y/x 顺序）
curl -sI -m 5 "https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/6/25/35" | head -1
```

**为什么 v5.22 弃用本地 hillshade `.jpg`？**

| 维度 | `L.imageOverlay(全球 equirectangular jpg)` | `L.tileLayer(XYZ 瓦片)` |
|---|---|---|
| 投影对齐 | ❌ 源图 equirectangular vs Leaflet Mercator，高纬度错位 | ✅ 瓦片源 = Web Mercator，与 Leaflet 默认 CRS 一致 |
| GitHub Pages 部署 | ❌ 数 MB `.jpg` 常被跳过（v5.21 已记录） | ✅ 无需部署，走 CDN |
| 缩放清晰度 | ❌ 4k 图全局铺开，实际每片模糊 | ✅ 按 zoom 自适应分辨率，任意缩放都清晰 |
| 加载速度 | ❌ 一次下载完整 4k（约 850 KB） | ✅ 按视口懒加载，首屏只需 9-12 张小瓦片（约 200 KB） |
| 运维负担 | ❌ 需维护 data/geography/hillshade/ 整个目录 | ✅ 零维护，瓦片服务商负责 |

**⛔ 注意事项**：

1. **某些瓦片服务对 `{s}` subdomain 和 `/{z}/{y}/{x}` 顺序有差异**：CartoDB 是 `/{z}/{x}/{y}`，Esri ArcGIS REST 是 `/{z}/{y}/{x}`——写错会全 404，参考以上模板原样复制
2. **`maxZoom` 必须匹配瓦片源支持的最大级别**：Esri Shaded Relief 最大 z=13，CartoDB 可到 z=19
3. **中国大陆场景**：如果最终用户主要在境内且访问瓦片服务存在不稳定，可以改用国内替代：天地图（需免费 key）、高德 `wprd0{s}.is.autonavi.com`（教学场景容忍风险使用）、腾讯地图、Mapbox（需 token）。本 SKILL 默认推荐 CartoDB+Esri（无 key 最省事），如课件实测在目标网络下瓦片加载超 3 秒再换国内源

**v5.22 的 hillshade 数据文件怎么办？**

`data/geography/hillshade/*.jpg` 目前保留在仓库（可能用于未来的打印/PDF 导出等静态场景），但**教学课件 HTML 不再引用**。如果课件确实要用全球静态 hillshade（例如离线演示场景、或有一张自定义地理投影图），必须：
- 要么保持 Leaflet map 用等距 CRS（`crs: L.CRS.Simple` 或 `crs: L.CRS.EPSG4326`），但 GeoJSON 要自己投影变换，工作量大
- 要么用 GDAL 先把 `.jpg` 切成 Web Mercator 瓦片（`gdal2tiles.py --profile=mercator`），再当标准瓦片用——就又回到 v5.22 主路径

**所以默认结论**：教学课件一律用 XYZ 瓦片（硬规则 #35 v5.22 修订版）。



#### 自动化执行策略

**默认行为**：课件制作完成后，AI **必须主动依次执行**以下全部步骤：

1. **运行内置质检**（无需外部脚本）：
   - 直接读取 `index.html` 源码
   - 检查必需的 meta 标签、ABT 关键词、互动元素等
   - 统计通过项数量

2. **自动打包**（无论质检结果）：
   ```bash
   # 方式 A：使用打包脚本（如果可用）
   node scripts/pack-courseware.cjs <课件目录>
   
   # 方式 B：手动打包（降级方案）
   cd <课件目录> && zip -r ../<course-id>.teachany . -x "*.DS_Store"
   ```

3. **课件落地 + 用户身份上传**：

   ```bash
   # 可选：先保存草稿并本地预览
   mkdir -p community/drafts/<course-id>
   cp -r <生成目录>/* community/drafts/<course-id>/

   # 默认发布：进入 community 并自动注册
   mkdir -p community/<course-id>
   cp -r <生成目录>/* community/<course-id>/
   python3 scripts/rebuild-index.py
   git add -A
   git commit -m "feat: 新增课件 <course-id>"
   git push origin main
   git push gitee main
   ```

   规则：
   - 不需要额外的本地权限标记文件。
   - 不走额外审核流程。
   - 新增用户课件统一写入 `community/<course-id>/`。
   - `examples/` 仅保留存量官方示例，不作为课件制作默认写入目录。

4. **输出结果**：
   - 质检通过率 + 未通过项列表
   - .teachany 文件路径（如已打包）
   - 本地路径：`community/<course-id>/index.html`
   - 在线地址：`https://weponusa.github.io/teachany/community/<course-id>/`

#### 质检项清单（内置，无需外部脚本）

| 类别 | 检查项 | 检测方式 |
|:---|:---|:---|
| **Meta 标签** | teachany-node, subject, grade, author | 正则匹配 `<meta name="teachany-*">` |
| **ABT 叙事** | 为什么学、已经知道、问题、因此 | 搜索关键词：`为什么.*学\|已经知道\|但.*问题\|所以` |
| **互动练习** | 选择题、拖拽、滑块等 | 搜索：`quiz-option\|draggable\|slider\|checkAnswer` |
| **前测/后测** | pretest/posttest 模块 | 搜索：`pretest\|posttest\|前测\|后测` |
| **音频资源** | .mp3 文件存在性 | 检查 `<audio>` 标签或 `tts/` 目录 |
| **响应式布局** | viewport meta 标签 | 检查 `<meta name="viewport">` |

#### 输出反馈模板

质检完成后，AI 输出：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 课件质检报告

课件：<课件名称> (<course-id>)
内置质检通过率：5/6 (83%)

✅ 通过项（5 项）：
  Meta 标签完整、ABT 叙事、互动练习、前测/后测、音频资源

❌ 未通过项（1 项）：
  • 响应式布局 → 缺少 viewport meta 标签

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 课件已打包

文件位置：<课件目录>/../<course-id>.teachany
文件大小：2.3 MB

🎯 使用方式：
1. 拖入 TeachAny Gallery "➕ 添加我的课件"
2. 在知识地图节点点击"上传"
3. 分享 .teachany 文件给其他用户

注意：
- 课件可先本地预览，也可发布到 `community/<course-id>/`。
- 发布后需运行 `rebuild-index.py` 并以当前 Git 用户身份推送。
```

> ⚠️ **重要**：Phase 3.5 是**强制流程**，不需要用户主动要求。课件制作完成后 AI 必须自动执行质检、打包、注册和用户身份上传。

### 17.5 HTML meta 标签（已有规范，此处汇总）

每个课件的 `index.html` 必须包含以下 meta 标签：

```html
<meta name="teachany-node" content="linear-function">
<meta name="teachany-subject" content="math">
<meta name="teachany-domain" content="function">
<meta name="teachany-grade" content="8">
<meta name="teachany-prerequisites" content="proportional-function">
<meta name="teachany-difficulty" content="3">
<meta name="teachany-version" content="2.0">
<meta name="teachany-author" content="weponusa">
```

这些标签既用于知识地图关联，也用于自动生成 `manifest.json`。注意：不要在 HTML 中添加 `<meta name="teachany-emoji">`；展示 emoji 只在 `manifest.json` 的 `emoji` 字段维护，发布流程再同步到 registry。

### 17.6 导入方式

用户可在两个入口导入课件包：

1. **Gallery 页面**：点击「➕ 添加我的课件」按钮，拖入或选择 `.teachany` 文件
2. **知识地图页面**：点击"待创建"节点，弹出上传入口，课件自动关联到该知识节点

导入后课件存储在浏览器 localStorage 中（纯前端，无需后端），在 Gallery 中以「我的课件」标识展示。

---

### 17.7 各学科课标速查（⭐ v5.34.6 新增）

> **AI 生成课件时的权威数据源**。当接到"给 XX 学科 XX 学段 XX 主题做课件"的任务时，先查本表定位对应课标标准、学段要求、核心概念；`manifest.curriculum_standards[]` 字段必须引用下表里的真实条款，严禁编造"课标第 N 章要求"。
>
> 中国国家课标共 21 棵树（小学 4 + 初中 8 + 高中 9），对应 21 份权威课程标准。所有小初课标为 **《义务教育 XX 课程标准（2022 年版）》**，高中课标为 **《普通高中 XX 课程标准（2017 年版 2020 年修订）》**，颁布机构均为 **中华人民共和国教育部**。

#### 17.7.1 总览表（21 棵国内课标树）

| 学段 | 学科 | 树文件 | 课标全名 | 核心素养（一级） | 年级 |
|:---|:---|:---|:---|:---|:---|
| 🎒 小学 | 语文 | `chinese-elementary.json` | 义务教育语文课标（2022） | 文化自信 / 语言运用 / 思维能力 / 审美创造 | 1-6 |
| 🎒 小学 | 数学 | `math-elementary.json` | 义务教育数学课标（2022） | 数感 / 量感 / 符号意识 / 运算能力 / 几何直观 / 空间观念 / 推理意识 / 数据意识 / 模型意识 / 应用意识 / 创新意识 | 1-6 |
| 🎒 小学 | 英语 | `english-elementary.json` | 义务教育英语课标（2022） | 语言能力 / 文化意识 / 思维品质 / 学习能力 | 3-6 |
| 🎒 **小学** | **科学** ⭐ | `science-elementary.json` | **义务教育科学课标（2022）** | **科学观念 / 科学思维 / 探究实践 / 态度责任** | **1-6** |
| 🧪 初中 | 语文 | `chinese-middle.json` | 义务教育语文课标（2022）· 初中学段 | 文化自信 / 语言运用 / 思维能力 / 审美创造 | 7-9 |
| 🧪 初中 | 数学 | `math-middle.json` | 义务教育数学课标（2022）· 初中学段 | 抽象能力 / 运算能力 / 几何直观 / 空间观念 / 推理能力 / 模型观念 / 数据观念 / 应用意识 / 创新意识 | 7-9 |
| 🧪 初中 | 英语 | `english-middle.json` | 义务教育英语课标（2022）· 初中学段 | 语言能力 / 文化意识 / 思维品质 / 学习能力 | 7-9 |
| 🧪 初中 | 物理 | `physics-middle.json` | 义务教育物理课标（2022） | 物质观念 / 运动与相互作用观念 / 能量观念 / 科学思维 / 科学探究 / 科学态度与责任 | 8-9 |
| 🧪 初中 | 化学 | `chemistry-middle.json` | 义务教育化学课标（2022） | 化学观念 / 科学思维 / 科学探究与实践 / 科学态度与责任 | 9 |
| 🧪 初中 | 生物学 | `biology-middle.json` | 义务教育生物学课标（2022） | 生命观念 / 科学思维 / 探究实践 / 态度责任 | 7-9 |
| 🧪 初中 | 地理 | `geography-middle.json` | 义务教育地理课标（2022） | 人地协调观 / 综合思维 / 区域认知 / 地理实践力 | 7-8 |
| 🧪 初中 | 历史 | `history-middle.json` | 义务教育历史课标（2022） | 唯物史观 / 时空观念 / 史料实证 / 历史解释 / 家国情怀 | 7-9 |
| 🎓 高中 | 语文 | `chinese-high.json` | 普通高中语文课标（2017 版 2020 修订） | 语言建构与运用 / 思维发展与提升 / 审美鉴赏与创造 / 文化传承与理解 | 10-12 |
| 🎓 高中 | 数学 | `math-high.json` | 普通高中数学课标（2017 版 2020 修订） | 数学抽象 / 逻辑推理 / 数学建模 / 直观想象 / 数学运算 / 数据分析 | 10-12 |
| 🎓 高中 | 英语 | `english-high.json` | 普通高中英语课标（2017 版 2020 修订） | 语言能力 / 文化意识 / 思维品质 / 学习能力 | 10-12 |
| 🎓 高中 | 物理 | `physics-high.json` | 普通高中物理课标（2017 版 2020 修订） | 物理观念 / 科学思维 / 科学探究 / 科学态度与责任 | 10-12 |
| 🎓 高中 | 化学 | `chemistry-high.json` | 普通高中化学课标（2017 版 2020 修订） | 宏观辨识与微观探析 / 变化观念与平衡思想 / 证据推理与模型认知 / 科学探究与创新意识 / 科学态度与社会责任 | 10-12 |
| 🎓 高中 | 生物学 | `biology-high.json` | 普通高中生物学课标（2017 版 2020 修订） | 生命观念 / 科学思维 / 科学探究 / 社会责任 | 10-12 |
| 🎓 高中 | 地理 | `geography-high.json` | 普通高中地理课标（2017 版 2020 修订） | 人地协调观 / 综合思维 / 区域认知 / 地理实践力 | 10-12 |
| 🎓 高中 | 历史 | `history-high.json` | 普通高中历史课标（2017 版 2020 修订） | 唯物史观 / 时空观念 / 史料实证 / 历史解释 / 家国情怀 | 10-12 |
| 🎓 高中 | 信息技术 | `info-tech-high.json` | 普通高中信息技术课标（2017 版 2020 修订） | 信息意识 / 计算思维 / 数字化学习与创新 / 信息社会责任 | 10-12 |

#### 17.7.2 小学科学课标详细要求（⭐ 新学科重点说明）

> 2022 年版《义务教育科学课程标准》是**首次将小学科学课覆盖到 1-2 年级**的重大修订（原 2017 版仅覆盖 3-6 年级）。AI 生成小学科学课件时必须严格遵循以下结构。

**学段划分与目标**：

| 学段 | 年级 | 核心任务 | 典型活动 |
|:---|:---|:---|:---|
| 第一学段 | 1-2 年级 | 好奇心启蒙：观察身边物体特征、认识常见动植物、感知昼夜与天气、学用简单工具 | 画观察日记、做简单分类、搭积木桥 |
| 第二学段 | 3-4 年级 | 现象描述与探究初步：了解物质三态变化、认识生命周期、观察月相、经历简单设计制作 | 种子发芽实验、天气记录、月相观察、做简易电路 |
| 第三学段 | 5-6 年级 | 机制解释与系统思维：理解力与运动/能量转化、生态系统与人体健康、太阳系、完整工程项目 | 杠杆实验、生态瓶、太阳系模型、搭建桥梁/小车 |

**4 大学习领域 × 13 个核心概念**（课程标准第 4 章）：

| 领域 | 域 ID | 色值 | 核心概念（跨学段进阶） |
|:---|:---|:---|:---|
| 🔵 **物质科学** | `matter-science` | `#3b82f6` | 物质的结构与性质 / 物质的变化与化学反应（萌芽） / 运动与相互作用 / 能量的形式与转化 |
| 🟢 **生命科学** | `life-science` | `#10b981` | 生命系统的构成层次 / 生物体的稳态与调节（萌芽） / 生物与环境的相互关系 / 生命的延续与进化（萌芽） |
| 🟡 **地球与宇宙科学** | `earth-space-science` | `#f59e0b` | 宇宙中的地球 / 地球系统 / 人类活动与地球 |
| 🟣 **技术与工程** | `tech-engineering` | `#8b5cf6` | 技术、工程与社会 / 工程设计与物化 |

**学科前缀约定（硬规则 #42 · v5.34.6 追加）**：

- 节点 ID 形如 `sci-e-<topic>`（`sci` = 科学学科前缀，`e` = 小学学段）
- `manifest.subject` 必须写 `"science"`
- `manifest.grade` 必须 ∈ [1, 6]
- `manifest.curriculum` 默认 `"cn-national"`

**探究实践 6 步**（与硬规则 #26 一致）：

1. **情境提问**：从学生熟悉的生活现象或课本故事切入
2. **提出假设**：用"我猜是因为……"句式鼓励表达
3. **设计验证**：列出变量、工具、步骤（1-2 年级可简化为"看一看/比一比"）
4. **收集证据**：观察记录单 / 画图记录 / 拍照
5. **分析结论**：回到假设，支持或推翻
6. **反思拓展**：与生活联系、下一步想探索什么

**探究深度分层**（与硬规则 #26 一致）：

| 学段 | 默认深度 | 允许上限 |
|:---|:---|:---|
| 1-2 年级 | L1 结构化探究 | L1 |
| 3-4 年级 | L1 结构化探究 | L2 引导式探究 |
| 5-6 年级 | L2 引导式探究 | L3 半开放探究 |

**跨学科融合建议**（课程标准鼓励）：

- 科学 + 数学：测量、统计、图表（如"测量影子长度并记录"）
- 科学 + 语文：观察日记、科学小论文、科普阅读
- 科学 + 美术：生物写生、科学插画、模型制作
- 科学 + 信息技术：数据记录与可视化（5-6 年级）

**小学科学 45 节点完整覆盖**（见 `data/trees/science-elementary.json`）：

- 物质科学 17 节点：物体外部特征 → 常见材料 → 三态变化 → 水循环 → 溶解 → 推拉力 → 运动与速度 → 重力 → 摩擦力 → 简单机械 → 光/声/热传递 → 简单电路 → 导体绝缘体 → 磁铁 → 能量形式
- 生命科学 14 节点：生物与非生物 → 植物/动物部分 → 生命周期 → 分类 → 光合作用入门 → 生态系统 → 环境保护 → 遗传变异入门 → 人体系统 → 感官 → 营养健康 → 疾病预防
- 地球与宇宙 10 节点：天气 → 四季 → 水资源 → 岩石土壤 → 地表变化 → 气候 → 昼夜 → 月相 → 太阳系 → 航天探索
- 技术与工程 7 节点：工具使用 → 设计过程 → 测量 → 结构稳定性 → 简易机器人 → 信息技术 → 可持续工程

#### 17.7.3 manifest.curriculum_standards 字段引用范式

生成课件的 `manifest.json` 中，`curriculum_standards[]` 数组每一条必须形如：

```json
"curriculum_standards": [
  {
    "category": "core_competency",
    "content": "科学观念：通过观察物态变化现象，初步形成'物质可以发生变化'的物质观念",
    "source": "义务教育科学课程标准（2022年版）· 第 4 章 · 物质科学 · 核心概念 2"
  },
  {
    "category": "required_experiment",
    "content": "探究水的沸腾与凝固条件（3-4 年级建议活动）",
    "source": "义务教育科学课程标准（2022年版）· 第 4 章 · 学业要求 3.2"
  }
]
```

**7 种 `category` 分类**（与 Section 10.1 定义一致）：

| category | 中文 | 典型引用 |
|:---|:---|:---|
| `core_competency` | 核心素养 | 引用课标 2.2 节核心素养描述 |
| `required_experiment` | 必做实验 | 引用课标"学业要求"和"活动建议"中明确的实验 |
| `learning_task_group` | 学习任务群 | 语文等学科特有（课标 4 章任务群） |
| `content_thread` | 内容主线 | 引用课标"课程内容"章的大概念或主题 |
| `cross_disciplinary` | 跨学科实践 | 2022 版强调的"综合与实践"/"跨学科主题学习" |
| `curriculum_change` | 课标调整 | 如"小学科学 2022 版首次覆盖 1-2 年级" |
| `teaching_requirement` | 教学要求 | 引用课标"教学建议""实施建议"章节 |

#### 17.7.4 与知识树的字段对应（v5.34.6）

每棵 `data/trees/*.json` 的 `metadata` 字段建议包含：

```json
"metadata": {
  "curriculum": {
    "standard": "义务教育科学课程标准（2022年版）",
    "standard_en": "...",
    "stage_key": "elementary",
    "stage_zh": "小学",
    "source": "中华人民共和国教育部",
    "issued": "2022-04",
    "grade_range": [1, 6],
    "core_concepts": [ "... 13 条核心概念 ..." ],
    "stage_goals": [ "... 3 条学段目标 ..." ],
    "assessment": "...",
    "references": [ "课程目标 (3)", "内容要求 (4)", "学业质量 (6)" ]
  },
  "node_count": 45,
  "updated_at": "2026-04-19"
}
```

每个 `domain` 建议包含 `curriculum_goal`（该领域在课标里的学业质量要求 / 核心概念描述，≤150 字）；
每个 `node` 建议包含 `curriculum_points`（2-4 条学段目标 / 活动建议 / 学业要求）。

**注入工具**：`python3 scripts/inject-curriculum.py` 一键批量注入全部 21 棵国内树（见脚本内部 `STANDARDS` / `DOMAIN_GOALS` / `NODE_POINTS` 三级词典）。

---

**技能版本**：v6.0（持续演进中，最新改动见 changelog v5.34）  
**更新日期**：2026-04-19  
**变更摘要**：
- v1.0：数理课件版
- v2.0：拆成通用底座+学科适配层
- v3.0：补 Bloom 完整表、课型分类、脚手架策略、Mayer 原则、五镜头选择指引、3 学科完整示例、视觉设计细则、Phase 4 审查清单
- v4.0：TTS 引擎切换为 Edge TTS
- v5.0：知识图谱集成、社区课件机制
- **v6.0**：**简化发布流程**
  * **移除外部发布依赖**：不再需要额外权限或外部脚本
  * **内置质检功能**：AI 直接检查 meta 标签、ABT 叙事、互动元素等核心项
  * **本地打包优先**：生成 .teachany 文件保存到本地，用户拖入 Gallery 即可使用
  * **去中心化分享**：支持 GitHub PR、邮件提交、网盘分享等多种社区贡献方式
  * **零权限要求**：普通用户无需 GITHUB_TOKEN 即可制作和使用课件
- v4.0：新增视频与音频制作流水线（Remotion 自动安装、Edge TTS 集成、双语字幕系统、语言配置）、Token 与成本估算
- v5.3：新增例题配图硬性规范（Section 13）——涉及空间/几何/图形推理的例题和练习必须配图；详见英文版 SKILL.md Section 18.8 完整实现指南。
- v5.4：新增课件打包与分发（Section 17）——定义 .teachany 课件包格式、打包脚本、Gallery/知识地图导入功能。
- v5.5：融入项目驱动教学方法论——新增四种驱动模式（问题/项目/活动/问题链）与决策树、情境角色设计（四种情境模式）、学习记录单支架、过程性评价量规、三段式作业设计、跨学科融合设计、AI 多模态互动区规范；扩充项目制/任务驱动设计框架；Generation Gate 和 Completeness Gate 升级为 14 项审查；硬规则从 13 条扩充至 15 条。
- v5.6：**L3 语音讲解从"显式触发"升级为"默认必选"**——L1 课件完成后自动安装 edge-tts 并生成语音文件，仅用户明确拒绝时跳过；新增三级降级策略（自动安装→保留脚本→保留 JSON）；Generation Gate L3 字段改为"默认执行"；Phase 3/4 流程重构强制 L3 执行；硬规则从 15 条扩充至 16 条。
- v5.7：**全面升级"按需调用"为"默认执行"，保证课件基本质量**——(1) 知识图谱查阅新增🥉Web搜索降级层（脚本→JSON→Web搜索→模型知识四级降级链），禁止跳过搜索直接用模型知识；(2) AI多模态互动区从"可选增强"改为"适用场景默认插入"；(3) 课件打包（Phase 3.5）改为默认必选；(4) 双语课件（中英文）改为默认生成；(5) Completeness Gate 从14项扩充至17项（+双语+打包+知识溯源）；(6) 硬规则从16条扩充至19条（+Web搜索必经+打包默认+双语默认）；(7) 架构分层新增L4打包层。
- v5.8：**WorkBuddy 多 Agent 协作 + 版式一致性 + AI 主动生图/生视频**——(1) 新增 Section 10.2.1 HTML 骨架模板（强制使用，含完整 HTML 代码模板、必选/可选 section 标注、导航/进度条/翻页按钮）；(2) 新增 Section 10.2.2 统一导航规范（强制 Sticky 顶部导航+前后翻页，禁止 Tab 切换/多页 HTML/侧边栏导航）；(3) 新增 Section 10.4.1 AI 主动生图规范（AI 在生成课件时主动调用 image_gen 生成文科配图，含 6 类触发条件、prompt 策略、降级方案）；(4) 新增 Section 10.4.2 AI 主动生视频规范（理科实验过程/地理变化/生物过程等场景的视频生成策略）；(5) 新增 Section 10.5 WorkBuddy 多 Agent 协作流水线（定义 5 个 Agent 角色分工、并行执行架构图、task 调用 prompt 模板、三级降级策略）；(6) Generation Gate 新增 4 个字段（模块数量/HTML骨架/AI主动生图/Agent协作模式）；(7) Completeness Gate 从 17 项扩充至 20 项（+版式一致性+AI主动生图+Agent协作记录）；(8) 硬规则从 20 条扩充至 23 条（+HTML骨架模板+文科配图+多Agent并行）；(9) Phase 3 L1 制作指令新增 HTML 骨架模板、多 Agent 协作、AI 主动生图的引用。
- v5.9：**知识图谱可视化 + 视频/音频播放器强制规范 + Remotion 中文字体修复**——(1) 新增 Section 10.2.3 知识图谱可视化规范（HTML 骨架新增必选 `#knowledge-graph` section，SVG 交互式图谱，节点从 `_graph.json` 提取，当前节点高亮、有课件节点可点击跳转、无课件节点虚线框）；(2) 新增 Section 10.2.4 视频播放器规范（强制使用 `<video controls preload="metadata" playsinline>` + `.video-player` 容器，禁止仅用 JS 动态创建视频）；(3) 新增 Section 10.2.5 音频播放器规范（HTML 骨架内置完整音频播放引擎——FAB 按钮+弹出式播放面板+段落列表+控制条+字幕显示，禁止只添加隐藏 `<audio>` 标签）；(4) L2 环境自动搭建新增步骤 2.5「安装中文字体」（Linux 下安装 fonts-noto-cjk）；(5) SubtitleTrack.tsx fontFamily 新增 `'Noto Sans SC'`、`'Noto Sans CJK SC'` 降级字体；(6) Generation Gate 新增 3 个字段（知识图谱数据/视频嵌入/音频播放器）；(7) Completeness Gate 从 20 项扩充至 24 项（+知识图谱可视化+视频标签+音频播放器UI+Remotion中文字体）；(8) 硬规则从 23 条扩充至 27 条（+知识图谱必选+视频必须用video标签+音频必须有播放器UI+Remotion必须安装中文字体）。
- v5.10：**音频滚动自动播放 + 视频优先交互演示 + 默认仅中文**——(1) 音频播放器从 FAB+弹出面板+手动选段 改为 IntersectionObserver 滚动自动播放+底部悬浮控制条（播放/暂停+进度条+5档调速+字幕），`audioPlaylist` 每个条目新增 `sectionId` 字段关联对应 HTML section；(2) 视频嵌入新增"优先交互演示"原则（CSS/JS/Canvas/SVG 交互动画 > Remotion > 静态视频），视频必须嵌入到对应知识模块的 section 内部而非集中放置；(3) 双语课件从"默认生成"改为"默认仅中文"，用户明确要求时才生成英文版；Agent B 从"默认执行"改为"用户要求时执行"；(4) 同步更新 Generation Gate、Completeness Gate、硬规则 #19/#25/#26、Agent 协作架构图、Phase 3/4 流程。
- v5.11：**历史/地理课件DEM地形+态势动画强制规范**——(1) 新增 Section 18.4《历史/地理课件高级可视化规范》，强制要求三层架构（DEM地形底图 + 历史疆域GeoJSON + 态势动画）；(2) 新增三种动画设计模式（时间轴播放/交互式探索/对比模式）；(3) 新增历史疆域GeoJSON与战役数据标准字段；(4) 新增库选择决策树（Cesium真3D / Maplibre地形 / ECharts GL伪3D）；(5) Phase 4 审查新增 8 项检查（DEM地形/疆域准确性/动画流畅度/时间轴完整性/地标准确性/音频同步/交互响应/移动端适配），历史/地理课件验收标准≥85分。
- v5.12：**基线能力强制化**——(1) 新增 Section 0《强制基线能力清单》置于章节顶部，明确 Edge-TTS、Remotion、Canvas 互动、AI 生图/生视频**四项为出厂标配、非可选增强、非用户触发**；(2) 新增各学科启用触发矩阵（Section 0.1），古诗词/文言文课件也必须启用 Remotion（意境动画、诵读节奏可视化）；(3) Phase 0 末尾增加"基线能力开启清单"输出要求；(4) 硬规则从 30 条扩充至 34 条，新增 #31 TTS 基线、#32 Remotion 基线、#33 Canvas 基线、#34 生图基线；(5) 违反任一基线 = Completeness Gate 直接不通过；(6) 明确"古典诗词课程"等近期案例因缺失基线能力属于不合格示范。
- v5.12：**⭐ 强制使用开源数据源，禁止手工标注**——(1) 新增 Section 18.4.3《数据规范》，强制使用权威开源数据集（CHGIS V6、Natural Earth）替代低精度手工标注；(2) 新增 7 类标准数据源清单（河流水系/历史行政区划/现代行政边界/湖泊/历史城市/DEM地形/海岸线）；(3) 新增数据处理流程（ogr2ogr 格式转换 + mapshaper 几何简化）；(4) 新增 GeoJSON metadata 标准字段（dataSource/sourceUrl/chgisId），强制数据溯源；(5) 新增 Section 18.4.7《数据预处理工具链》，包含 CHGIS/Natural Earth 数据下载指南、在线工具（Mapshaper Web、GeoJSON.io）；(6) 验收标准新增"数据源准确性"检查项（15%权重），要求河流/城市/边界必须来自开源数据集；(7) 18.4.4 强制必选元素新增"河流水系"与"数据溯源"两项；(8) 所有示例代码更新为从预处理 GeoJSON 文件加载，禁止嵌入手工标注坐标。
- v5.13：**⭐ 时空资产完整目录纳入 Skill 知识库**——(1) Section 18.1 从简略文件列表升级为《时空资产完整目录》，包含 6 个子章节（完整目录结构/Hillshade 地形底图/历史疆域数据/历史数据/外部数据源清单/调用规范）；(2) 新增 Section 18.1.2 地形底图资产表（3 种风格 × 3 种尺寸，含数据来源/许可证/投影说明）；(3) 新增 Section 18.1.3 历史疆域数据资产表（8 朝代完整文件清单+时间范围+大小）；(4) 新增 Section 18.1.4 历史数据资产（dynasties-detailed.json/chinese-dynasties.json/persons.json 字段说明）；(5) 新增 Section 18.1.5 外部开源数据源清单（8 类标准数据源统一表格，含下载地址/格式/许可证）；(6) 新增 Section 18.1.6 调用规范（地理/历史课件强制使用规则+10 类常见场景快速索引表）；(7) Section 18.5 从外部文件引用升级为内联《地图资源标准调用模式》（4 种标准代码模板：ECharts 省级地图/Leaflet 交互地图/朝代疆域联动/Timeline 切换）；(8) 新增 Section 18.6《3D 地形集成规范》内联（强制使用场景表/夸张倍数/视角参数/交互增强/移动端降级）；(9) 新增 Section 18.7《参考文档与扩展资源》（项目内文档+示范课件+外部参考链接汇总）。
- v5.14：**⭐ Skill 运行时强制检测 Git 最新版本并按需更新**——(1) 新增 `scripts/check-skill-update.sh` 版本检测与自动更新脚本（支持 Git 仓库检测/远程 fetch/commit hash 比对/自动 pull --rebase/本地修改 stash 暂存与恢复/离线静默降级）；(2) Phase 0.5 新增步骤 0《Skill 版本检测与自动更新》，定义为强制执行步骤（⛔ MANDATORY），位于步骤 1 之前；(3) 步骤 0 含完整降级规则表（非 Git 仓库/离线环境/fetch 失败/更新成功 4 种场景均不阻断课件生成）；(4) 硬规则新增 #29：必须执行版本检测，检测失败静默降级但不可跳过；(5) 更新成功后强制重新读取 SKILL_CN.md 和数据文件。
- v5.15：**⭐ K12 教材版本注册表 + 中国教材内容自动注入**——(1) 新增 `data/editions/registry.json` 教材版本注册表，包含小学（10学科）/初中（18学科）/高中（18学科）三个学段所有学科的出版社版本列表，数据来源于 ChinaTextbook 开源仓库（⭐ 69.6k）；(2) 注册表区分统编学科（`unified: true`，语文/历史/道德与法治/思想政治，自动使用人教版）和多版本学科（`unified: false`，数学/物理/化学等，需询问用户）；(3) 注册表包含 `subject_mapping`（内部学科ID↔中文学科名映射）、`default_editions`（各学科默认版本）、`url_pattern`（GitHub URL 拼接规则）；(4) Phase 0 新增第 7 步《教材版本确认》，运行时读取注册表、判断统编/多版本、列出可选版本询问用户、记录 `textbook_edition` 变量；(5) Phase 0.5 新增步骤 3.6《中国教材内容注入》，根据确认的版本拼接 ChinaTextbook 仓库 URL，用 `web_fetch` 获取目录，用 MinerU API 或 `web_fetch` 解析 PDF，提取章节引入情境/例题/练习题/探究活动注入课件；(6) 数据优先级升级为五级降级链（🏆中国教材原文 > 🥇教材补充数据 > 🥈知识图谱 > 🥉Web搜索 > 🥊模型知识）；(7) 硬规则新增 #30：多版本学科必须询问教材版本，注册表不存在或用户拒绝时静默降级；(8) 新增 `data/editions/README.md` 说明文档。
- v5.16：**⭐ Remotion 基线从"可降级"升级为"真强制"**——(1) Section 0 表格②行降级底线由"Canvas/SVG 等效替代"改为 **⛔ 无降级**：Canvas/SVG/CSS 时间线动画**不得替代** Remotion 基线，真实 mp4 渲染才是唯一合规交付；(2) 硬规则 #32 同步改为必须含真实 Remotion 渲染的 mp4，Canvas/SVG 只能作为附加增强；(3) 0.3 违反示例新增"用 SVG+CSS 动画等效替代 Remotion"为明确禁用；(4) L2 层级从"🔶 显式触发"升级为"✅ 默认必选"，与 L3 同级，Phase 0.5 阶段自动安装 Node/ffmpeg 不等待确认；(5) Phase 3 强制分发 Agent R（Remotion 渲染），与 Agent C/D 并行；(6) Completeness Gate 新增"检查 `assets/*.mp4` 真实存在且被 HTML `<video>` 嵌入"；(7) 唯一豁免路径：Node 环境彻底不可用 + 自动安装失败 + 用户书面豁免，三条件缺一不可。
- v5.17：**⭐ Remotion mp4 必须三轨合一（画面 + 音效/配乐 + 语音）+ 视频必须配专属 poster 封面**——(1) Section 0 表格②行强制要求 Remotion 渲染的 mp4 **必须含音频轨**（氛围音效/背景配乐 + TTS 语音朗读），画面无声的哑片 mp4 视为不合规；(2) 实现路径规范化：音频放 `remotion/public/audio/`，通过 `<Audio src={staticFile('audio/xxx.mp3')} volume={...}/>` 叠加，配乐用 ffmpeg 合成（`sine`+`anoisesrc`+`aecho` 滤镜组合），语音用 edge-tts 生成，可按 `<Sequence>` 时间点叠加对应幕次；(3) 0.3 违反示例新增"哑片 mp4" + "视频 poster 用错图（张冠李戴）"两条；(4) Completeness Gate 校验项升级：`ffprobe -show_entries stream=codec_type` 必须同时看到 `video` + `audio` 两流，且 `<video poster="...">` 必须指向与该视频主题匹配的专属封面图（不得复用其他主题的 hero 图）；(5) 同步示例落地：古典诗词课件春晓 mp4 重新渲染，集成四幕配乐（起·古琴低音 / 承·竖笛鸟鸣 / 转·雨雷 / 合·余韵风声）+ 四句 TTS 朗读，poster 换为 `image_gen` 专属生成的 `chunxiao-cover.png`（工笔淡彩春晓意境图）。
- v5.18：**⭐ 地图底图必须与缩放同步 + 初始视图必须聚焦教学核心区域**——(1) 技术选型翻盘：Section 18.2 从"方案 A ECharts（推荐）"改为"方案 A Leaflet ⭐（默认首选）"，ECharts 降级为"仅限纯行政区划填色图，不得叠加 hillshade"；(2) 诊断根因：ECharts `graphic: [{type:'image'}]` 是 DOM 绝对定位覆盖层，**不参与 `geo` 组件的缩放/平移变换**，用户交互时底图必定与国界/城市点错位（真实案例：hist-classical-civilization 课件踩坑）；(3) Section 18.4.1 第四级降级规则修正："ECharts 课件用 `graphic` 铺底" 改为 **⛔ 严禁 ECharts `graphic` 铺底**，强制推荐 Leaflet `L.imageOverlay`；(4) Section 18.5.1 升级为 "⭐ Leaflet + Hillshade + GeoJSON 叠加（历史/地理课件默认模板）"，含完整四件套代码（CRS.EPSG4326 容器 + imageOverlay 底图 + geoJSON 国界 + fitBounds 聚焦核心）；(5) Section 18.5.4 "朝代疆域展示 + 数据联动" 从 ECharts 版本重写为 Leaflet 版本（秦朝疆域示例 + 核心区 fitBounds）；(6) 0.3 违反示例新增两条：① 用 ECharts graphic 铺底图（必错位）；② 初始视图未聚焦核心区域（停在 `[0,0]` 默认中心 / 大片无关海洋）；(7) 硬规则从 34 条扩充至 36 条：#35 地图底图必须与缩放同步（Leaflet imageOverlay 强制）+ #36 初始视图必须 fitBounds/setView 聚焦教学核心区域；(8) Section 十三标题同步改为 "36 条硬规则"。
- v5.19：**⭐ 发布成功率保障（rebuild-index 三件套必跑 + node_id 必须真实校验 + 双推降级策略）**——(1) 诊断根因：用户反映"推了但 Gallery/知识地图看不到课件"的高频痛点，定位到四个失败路径——① 只 `git push` 没跑 `rebuild-index.py`；② manifest.json 的 `node_id` 拼写错或不存在；③ 只推 origin 没推 gitee；④ 对新 schema `_graph.json` 误判为"假报警"（⚠️ **v5.20 已推翻**：根本不是假报警，是真的发布失败信号）；(2) Section 17.2 升级 `node_id` 字段从"可选但推荐"为 **⛔ 必选 + 必须校验**（⚠️ **v5.20 修订**：校验目标从 `_graph.json` 改为 `data/trees/*.json`）；(3) Phase 3.5 Step 4 之后新增 **Phase 3.6 发布成功率保障四件套**；(4) 硬规则从 36 条扩充至 38 条：**#37 发布基线 · 必须跑 rebuild-index.py 三件套** + **#38 发布基线 · manifest.json 的 node_id 必须真实存在**；(5) Section 十三标题同步改为 "38 条硬规则"。⚠️ v5.19 原文中提到的"假报警识别""Python 检查新 schema 代替"等章节**已在 v5.20 全部推翻**，请以 v5.20 为准。
- v5.20：**⭐ 纠正 v5.19 错误结论——`tree.html` 只读 `data/trees/*.json`，不读 `_graph.json`**——(1) 用户实测反馈"Gallery 里有，但地图里没有"，v5.19 "假报警"结论当场翻车；(2) 真相实测验证：`tree.html:414-435` 硬编码 `TREE_FILES` 数组只加载 18 个 `data/trees/*.json` 旧 schema 文件，完全不扫 `data/<subject>/<branch>/_graph.json` 新 schema，两套 schema 节点 ID 体系完全不同（旧 schema 如 `hist-h-classical-civ` 带学科前缀，新 schema 如 `classical-greece-rome` 语义名）；(3) 翻车案例：hist-classical-civilization 按 v5.19 流程挂在 `_graph.json` 的 `classical-greece-rome` 节点上，rebuild-index.py 报警告、v5.19 错误解读为"假报警"，推上线后 Gallery ✅ 但知识地图 ❌，被用户戳穿；(4) Section 17.2 的 `node_id` 校验命令从 `grep data/<subject>/*/_graph.json` 改为 `grep data/trees/<subject>-*.json`，附 `jq '.. | objects | select(.id?) | .id'` 列出真实节点 ID 的查询命令；(5) Phase 3.6 发布四件套 Step 1/Step 2 修订：① `⚠️ 文件存在但知识树未引用` 明确标注为**真发布失败信号**（不再允许以"假报警"放行）；② 产出文件列表加入 `data/trees/<subject>-<level>.json`（标记为"⭐ 最关键"）；③ 新增 Python 脚本把课件 ID 原子注入对应节点 `courses[]` 数组的修复流程（替代无法处理字符串/数组类型冲突的 jq 方案）；(6) 新增整节"v5.20 重大纠正：知识地图只读 `data/trees/*.json`"，推翻 v5.19 "假报警识别 + Python 检查新 schema" 错误方案，给出 4 条强制执行硬规则；(7) 硬规则 #37 #38 文案强化 ⚠️ v5.20 纠正标签（警告不得以任何理由放行 + 严禁用 `_graph.json` 节点 ID 代替旧 schema 节点 ID）；(8) 长期修复计划：方案 A 升级 `tree.html` 同时加载 `_graph.json` / 方案 B 升级 `rebuild-index.py` 从 `_graph.json` 自动反向生成 `data/trees/*.json` 节点；(9) 地图底图问题说明：用户反馈"地图没有底图"实为 `tree.html` 是纯节点图、全文无 leaflet/hillshade/imageOverlay 渲染代码，该页面**本身不带地理底图**，所有 hillshade + GeoJSON 叠加方案（Section 18.5.1）应在课件自身 `index.html` 内实现，不应期望知识地图页面自带底图；(10) 真实挂载动作：`data/trees/history-high.json` 的 `hist-h-classical-civ` 节点 `courses[]` 新增 `hist-classical-civilization`，manifest.json `node_id` 改为 `hist-h-classical-civ`，rebuild-index 树引用 137→138、警告从 2 条降到 1 条。
- v5.21：**⭐ 再次纠正——GitHub Pages 不部署 `data/geography/` 下的大型二进制**——(1) 用户实测反馈"课件自己那张 Leaflet 地图也没有底图、没有行政边界"，直接跑 curl 验证，定位到**新根因**：即便 `.nojekyll` 存在、文件已 tracked push、raw.githubusercontent.com 能返回 200，`<user>.github.io/<repo>/data/geography/hillshade/*.jpg` 和 `/data/geography/world/countries.geojson` 全部 404，而同目录 `README.md` 却 200——证明 GitHub Pages 对该目录下的大型 `.jpg` / `.geojson` 存在**跳过部署**现象；(2) 新增 **Section 18.5.2 · Leaflet 资源必须用"本地路径 + jsDelivr CDN 回退"双路径**：提供 `addSmartImageOverlay()` / `geoFetchJson()` 工具函数模板（本地优先 → `cdn.jsdelivr.net/gh/<user>/<repo>@main/...` 失败回退），替代所有硬编码单路径；(3) 新增**硬规则 #39 地图资源基线**：强制使用双路径加载，发布前必须用 `curl -I` 验证线上 hillshade/geojson 200 才可声称"地图底图已上线"，Pages 404 且未用回退 → Gate 不通过；(4) 硬规则从 38 条扩到 39 条，Section 十三标题同步改为 "39 条硬规则"；(5) jsDelivr vs raw.githubusercontent 选型说明表（jsDelivr 胜在 CORS 友好 + 积极缓存 + 全球节点）；(6) 真实修复动作：`examples/hist-classical-civilization/index.html` 两处地图初始化函数已改用 `addSmartImageOverlay` + `geoFetchJson`，`L.imageOverlay` + `fetch` 硬编码路径全部下线。
- v5.22：**⭐⭐ 根治地图对不齐——弃用 `L.imageOverlay` 全球底图，改用 XYZ 瓦片**——(1) 用户实测反馈"还是对不齐底图，换个方式？切片也行啊"，直接定位到**本质根因**：v5.21 的 `L.imageOverlay('../../data/geography/hillshade/*.jpg', [[-90,-180],[90,180]])` 用的是 equirectangular 投影源图，而 Leaflet 默认 Web Mercator 投影，两者在高纬度差异极大（纬度 60° 处 Mercator 拉伸约 2 倍），底图和 WGS84 GeoJSON 在地中海以北必然错位——v5.21 的 CDN 兜底方案**只解决了加载，没解决投影对齐**；(2) **硬规则 #35 重大修订**：从"必须用 `L.imageOverlay(hillshade)` + `L.geoJSON`"改为"必须用 `L.tileLayer(XYZ 瓦片)` + `L.geoJSON`"，明令严禁 `L.imageOverlay` 全球铺底图（ECharts graphic 的禁令保留）；(3) **新增 Section 18.5.3 · XYZ 瓦片底图方案**：推荐双层叠加——CartoDB Dark（深色底图 + 国界 + 地名）+ Esri World_Shaded_Relief（半透明地形浮雕），全部免费、无 API key、`maxZoom` 配置+URL 模板+subdomain 规则齐全；(4) 投影对齐对比表 + `imageOverlay` vs `tileLayer` 全维度对比表（投影对齐/Pages 部署/缩放清晰度/加载速度/运维负担，五项 tileLayer 全胜）；(5) 硬规则 #39 修订为"GeoJSON 双路径回退"范围（hillshade `.jpg` 不再作底图，规则收窄但保留，用于 GeoJSON 防 Pages 跳过部署）；(6) 保留 `data/geography/hillshade/*.jpg` 文件但标记为"仓库保留·课件不再引用"，如确有全球静态底图需求需用 `gdal2tiles.py --profile=mercator` 切成 Mercator 瓦片；(7) 境内网络备选源说明（天地图、高德、腾讯、Mapbox）；(8) 真实修复动作：`examples/hist-classical-civilization/index.html` 两处 `addSmartImageOverlay` 全部替换为 `addBaseTiles(map, {...})`，`L.rectangle` 海洋背景移除（瓦片自带海色），UI 文案"DEM底图"改为"深色地图 + 地形浮雕"；(9) `addSmartImageOverlay` 辅助函数从课件代码下线（函数库只保留 `geoAssetUrl / geoAssetCdn / geoFetchJson`）。
- v5.23：**修复选择题致命 bug——`handleQuiz` onclick 第 4 参 `selectedVal` 被硬编码为固定值**——(1) 用户实测反馈"选择题好几道答案都不对"，排查发现 `handleQuiz(this,'<qid>','<correctVal>','<selectedVal>')` 中所有选项的第 4 参 `selectedVal` 被硬编码为同一值（如 pre2 四个选项全传 `'A'`），导致无论用户点哪个选项，系统都判定为选了同一个值，答题逻辑全部失效；(2) 额外发现 pre1 的 `correctVal`（第 3 参）写成 `'A'`，而 `quizAnswers['pre1'].correct` 和题意都是 `'B'`（三面环海，多山少地），导致正确答案被判为 A 选项；(3) 修复动作：全部 11 道选择题（pre1/pre2/pre3/m1q1/m1q2/m2q1/m2q2/post1/post2/post3/post4）共 44 个选项的 onclick 逐一修正，每个选项的 `selectedVal` 改为该选项自身 `data-val`（A→'A'、B→'B'、C→'C'、D→'D'），pre1 的 `correctVal` 从 `'A'` 改为 `'B'`；(4) **新增硬规则 #40 选择题基线**：`handleQuiz` 第 4 参必须等于该选项 `data-val`，同题 4 选项 selectedVal 必须互不相同；`correctVal` 必须与 `quizAnswers[qid].correct` 一致；发布前用 grep 提取全部调用、校验覆盖度；(5) 硬规则从 39 条扩到 40 条，Section 十三标题同步改为 "40 条硬规则"。
- v5.24：**⭐⭐ 根治知识树系统性污染——新增清污脚本 + 硬规则 #41**——(1) 用户反馈"基于新课标检查现有知识地图，很多地方不合理，比如小学语文把后鼻韵母和汉字结构都放在应用文里"，排查定位到全部 20 棵 `data/trees/*.json` 都存在同批次 AI 扩展引入的"系统性污染"：① 每棵树有一个"吸星"节点被 4-23 个无关节点单一依赖（如小学语文 23 个节点的 `prerequisites` 全写成 `["chn-e-application-writing"]`，导致知识地图视觉坍缩为所有路径汇向应用文；② 17 棵树存在英文域名未翻译（`Grammar`、`Classical Chinese`、`Ancient China` 等）；③ 17 棵树 `grade` 字段整数与字符串混用；④ 6 棵树存在同义节点重复（如 `chn-e-char-structure` 与 `chn-e-character-structure`）；(2) **新增 `scripts/clean-tree-pollution.py` 清污脚本**：5 项职责——①检测 prerequisites 集中依赖阈值 ≥4 → 清空并按 grade 向前找同 domain 最近节点补默认前置，②`grade` 字符串数字转 int（区间保留），③英文域名按词典翻译（33 项词汇表），④同义节点按 (domain, normalized_name) 去重保留 id 更短/挂课件的节点，⑤删除孤儿引用 & 自环；支持 `--apply` 真写入前自动备份到 `data/trees/_backup_YYYYMMDD_HHMMSS/`；(3) 批量清污执行结果：20 棵树共清理 141 个污染节点、去重 4 个节点、翻译 33 个英文域名、自动合并 6 个同名冗余域（`chinese-high` 的 2 个"写作"、`english-high` 的 2 个"语法"、`history-high` 的 2 个"中国古代史"、`math-elementary` 的 2 个"图形与几何"/2 个"统计与概率"、`math-middle` 的 2 个"函数"）；(4) 小学语文手工精修：按 2022 版义务教育语文课标，把冗余的 `classical-chinese` 并入 `classical-literature`、`grammar` 并入 `sentence-grammar`，从 10 域精简到 8 域，并为全部 72 个节点按课标重建 `prerequisites` 链条（拼音骨架：单韵母→复韵母→鼻韵母→声母→音节拼读→声调→拼音阅读；识字骨架：笔画→结构→偏旁→认字→查字典）；(5) **新增硬规则 #41 知识树基线**：发布/修改 `data/trees/*.json` 前必须跑 `clean-tree-pollution.py` dry-run，任意"吸星前置/英文域名/grade 混用/同义重复"不通过必须 `--apply` 清污才可提交；(6) `.gitignore` 添加 `data/trees/_backup_*/` 规则；(7) 硬规则从 40 条扩到 41 条，Section 十三标题同步改为 "41 条硬规则"。
- v5.25：**⭐⭐⭐ 全部 20 棵知识树按新课标系统性重构——从"骨架"升级到"课标级结构"**——(1) 继 v5.24 清污（骨架修正）后，本轮按 **2022 版义务教育课程标准（小学/初中）+ 2017 修订 2020 版高中课程标准** 对全部 20 棵 `data/trees/*.json` 逐棵重构，目标是让知识图谱的域划分、节点归属、前置链条完全对齐国家课标；(2) **方法学**：为每棵树编写 `scripts/_rebuild_<subject>_<level>.py` 一次性重构脚本，通过 `pick(nid, prereqs, grade, name)` 工具函数从原树按 id 取节点、保留 `courses` 字段、按课标重设 `prerequisites/grade/name`，最后批量替换 `domains`；同时检查 `orphan = old_ids - new_ids` 和 `must_keep = [x for x in orphan if node.get('courses')]` 双重保险，确保挂课件节点一个都不丢；(3) **20 棵树重构摘要**（按学科学段）：①**小学语文** 10域→8域（合并 classical-chinese/grammar 冗余域，72 节点按拼音→识字→词语→句子→阅读→写作→口语→古诗文骨架）；②**小学数学** 8域→4域（数与代数/图形与几何/统计与概率/综合与实践，对齐 2022 课标 4 主题，61 节点）；③**小学英语** 6 域/35 节点（语音/词汇/语法/语篇/写作/听说，对齐 3-6 年级课标）；④**初中语文** 8域→5域（语言文字运用/现代文阅读/古诗文阅读/写作/整本书阅读与名著导读，34 节点）；⑤**初中数学** 7域→3域（数与代数/图形与几何/统计与概率，对齐 2022 课标 3 主题，50 节点，合并重复的 algebra/algebra-intro）；⑥**初中英语** 5 域/23 节点（语音/词汇/语法/语篇/听说，对齐 2022 课标）；⑦**高中语文** 7域→5域（对齐 2017 修订 2020 任务群：语言文字运用/现代文阅读/古诗文阅读/写作/整本书阅读，25 节点）；⑧**高中数学** 11域→9域（预备/函数/三角/向量/数列/立体几何/解析几何/概率统计/微积分，43 节点）；⑨**高中英语** 7域→6域（词汇/语法/阅读/完形/写作/听力，24 节点）；⑩**初中物理** 6域/51节点（声/光/热/运动和力/电/电磁，修复 ohms-law 与 circuit-basics 错域）；⑪**初中化学** 11域→5域（对齐 2022 化学课标 5 主题：科学探究/物质组成与结构/物质化学变化/物质性质与应用/化学与社会，39 节点）；⑫**初中生物** 8域→6域（生物体结构层次/生物与环境/植物/人体/动物微生物/多样性，44 节点）；⑬**初中地理** 7域→5域（地球地图/世界/中国/经济/区域，30 节点）；⑭**初中历史** 6域→4域（中国古代/近代/世界古代/近现代，38 节点，补回被意外删除的 `hist-m-imperial-unification` 节点+保留课件引用）；⑮**高中物理** 9域→10域（运动学/力/功能/动量/静电/直流/电磁/振动波与光/热/近代物理，44 节点）；⑯**高中化学** 7域→9域（物质分类/离子反应/氧化还原/元素化合物/原子结构周期律/化学反应与能量/速率平衡/电化学/有机化学基础，41 节点）；⑰**高中生物** 10域→8域（细胞结构/细胞代谢/细胞生命历程/孟德尔/分子基础/变异进化/稳态调节/生态学，59 节点）；⑱**高中地理** 7域→4域（地球宇宙/自然地理/人文地理/可持续发展，38 节点，补回挂课件的 `geo-h-monsoon-system`）；⑲**高中历史** 8域→5域（中国古代/近现代/世界古代中世纪/近现代/专题史选必，27 节点）；⑳**高中信息技术** 3域/10节点（程序设计与数据结构/算法/网络与信息安全）；(4) **零课件引用丢失**：全量 `old_ids-new_ids` 对比 20 棵树，所有挂课件节点 100% 保留；rebuild-index 验证 138/138 课件引用全部有效；(5) **经验教训沉淀**——大规模重构 `data/trees/*.json` 的核心教训：a. 重构前必须从 `_backup_YYYYMMDD/` 查询所有挂课件的节点 id 作为"红线节点"；b. 过滤 None 时要用 `must_keep = [x for x in orphan if id2node[x].get('courses')]` 触发告警；c. pick 函数需保留原 `courses` 字段，严禁重置为空；d. 对每棵树执行后立即 rebuild-index，138→138 保持不变才算通过；e. 发现挂课件节点被遗漏时，必须按原信息（包括 name、grade、prerequisites、courses）原样补回，严禁凭空添加 course 引用。
- v5.27：**修复课件学段错挂——建立 manifest vs node_id 前缀强制校验 + 新增硬规则 #42**——(1) 用户反馈"高中化学氧化还原反应课件被挂在了初中化学，看来还是课件或者节点的标签体系有问题，没有直接按年级学科匹配"，排查发现根因：`chem-oxidation-reduction` 课件的 `manifest.grade` 被标记为 `9`（错误），但其 HTML `<title>氧化还原反应 · 高中化学必修一</title>` + `<meta course-id="chem-hs-oxidation-reduction-v1">` 明确指示这是**高中**必修一课件；v5.26 我误信 `manifest.grade=9` 把它从高中树迁移到初中树，导致用户看到的错误挂载。(2) **修复动作**：`chem-oxidation-reduction` 的 `manifest.grade` 从 9 改回 10、`manifest.node_id` 从 `chem-m-reaction-types` 改回 `chem-h-oxidation-reduction`、从初中化学树的 `reaction-types` 节点移除、挂回高中化学树的 `redox` 域 `oxidation-reduction` 节点。(3) **新增 `scripts/validate-courseware.py` 校验器**（3 层校验）：① `manifest.grade` 学段（grade→level 映射：1-6=elementary, 7-9=middle, 10-12=high）必须与 `manifest.node_id` 的 level 前缀（`*-e-*` / `*-m-*` / `*-h-*`）一致；② `manifest.subject`（chemistry/chinese/math/...）必须与 `node_id` 的 subject 前缀（`chem-*` / `chn-*` / `math-*` / `phy-*` / `bio-*` / `hist-*` / `geo-*` / `eng-*` / `it-*`）一致；③ HTML `<title>` 和 `<meta course-id>` 中的学段关键词（`高中`/`必修X`/`高一高二高三` → high；`初中`/`七八九年级`/`中考` → middle；`小学`/`一二三四五六年级` → elementary）必须与 `manifest.grade` 推断的学段一致；任何冲突返回退出码 1。(4) **新增硬规则 #42 课件挂载基线**：发布前必须跑 `python3 scripts/validate-courseware.py` 通过零错误；核心原则——**HTML title 中的"高中必修X"等权威信号优先于 manifest 数字**，如有冲突以 HTML 为准修正 manifest；严禁仅凭 `manifest.grade` 数字决定挂载节点。(5) 全量校验结果：140 个课件扫描、**0 个错误**、2 个警告（无 manifest 的空目录，已知）。(6) 硬规则从 41 条扩到 42 条。
- v5.28：**统一课件 title 规范 + 强制 teachany_version + Gallery 版本徽章**——(1) 用户反馈"很多课件 title 不写年级，这个要统一一下标准。另外在制作时要显示注明使用 teachany 的版本，并且显示在 gallery 的卡片里"；(2) **定义统一 title 格式**：`《课件名》 · 《学段》《学科》 G{grade} · TeachAny v{version}`，例如 `减数分裂与受精过程 · 高中生物 G10 · TeachAny v5.27`；(3) **编写 `scripts/normalize-titles.py` 批量迁移工具**，自动把原有 138 个课件 title（如 `叶片结构与气孔 · TeachAny` / `减数分裂与受精过程 — 七年级生物互动课件` 等 69 种不同格式）统一为标准格式；同时同步写入 `manifest.teachany_version="5.27"`；(4) **修改 `scripts/rebuild-index.py`** 收集 `teachany_version` 字段进 `registry.json`（字段列表 23 → 24）；(5) **Gallery 卡片新增 TeachAny 版本徽章**：`scripts/unified-loader.js` 的 `renderCourseCard()` 在 extraBadges 数组末尾追加 `⚡ TeachAny v5.27` 徽章，并在 `index.html` 新增 `.tag-teachany` CSS 样式（靛青→粉色渐变背景 + 靛青描边，视觉突出标识"制作版本"）；(6) **升级 `scripts/validate-courseware.py`** 新增 4 项 title 规范校验：① title 必须含 `TeachAny v` 字样；② title 必须含学段中文（小学/初中/高中）；③ title 必须含年级 `G{n}` 或 `{n}年级`；④ manifest 必须有非空 `teachany_version`；任一不满足退出码 1 阻断发布；(7) **新增硬规则 #43 课件标识基线**：明确 title 格式、manifest 必填字段、Gallery 渲染规则、发布前校验要求；(8) 批量执行结果：138 课件 title 已统一，138 个 manifest 已写入 `teachany_version: 5.27`，validate-courseware 全量扫描 0 错误；(9) 硬规则从 42 条扩到 43 条。
- v5.29：**清理废弃 admin skill + 删除重复课件 + 新增硬规则 #44 节点挂载基线（v5.29.1 修订：community 允许多份）**——(1) 用户反馈"admin-skillhub-package 这个 admin skill 已经没有了，在各处清理"：删除 `admin-skillhub-package/` 目录（能力已于 v6.0 并入基础 Skill），同步清理 `README.md` / `README_CN.md` 的 `Option 1b` / `方式 1b` 段落和项目结构树条目，`CHANGELOG.md` 的 v1.4.0 条目标注为 superseded。(2) 用户进一步反馈"液体压强与流速关系，存在两个一样的课件，删掉比较旧的"，对 `examples/phy-mid-fluid-flow` 与 `examples/teachany-phy-mid-fluid-flow` 做逐字节对比（index.html 29639 字节完全一致、6 个 TTS 同名同内容），保留较新且命名规范的前者。(3) 进一步核实后发现另外 3 组潜在冲突：①`phy-mid-pressure`（community, 24KB 单页简版） vs `teachany-phy-mid-pressure`（**official**, 66KB 深色完整版 + 8 part 源文件 + 配套 TTS）—— 两者挂同一 node `phy-m-pressure`，保留 official 完整版、删除 community 简版；②`phy-mid-atmospheric-pressure` vs `teachany-phy-mid-atmospheric-pressure`（40904 字节逐字节一致），保留命名规范的前者；③`teachany-phy-mid-pressure-buoyancy` 只有 7 个 mp3、无 `index.html` / `manifest.json` / 不在 registry，属孤儿音频包，直接删除。(4) **v5.29.1 修订语义**：用户澄清"一个节点是可以有多个社区课件的，按心标排序即可"——原硬规则 #44 "同节点严禁多份" 表述过严，修正为"**同 node_id 最多 1 份 official，community 允许多份并按 `likes` 降序展示**"；`courseware-hub.js` 早已实现该排序（`b.likes - a.likes` 降序 + 源优先级 `official > community_reg > community_shared > user`）。(5) **升级 `scripts/validate-courseware.py`** 的第 5 层跨课件校验：仅当 `len(officials) > 1` 时报错退出码 1；多份 community 仅打印 `ℹ️ 信息`不阻断；warn/info/error 三级分层输出。(6) **新增硬规则 #44 节点挂载基线**：明确 official 唯一 + community 可多份 + 冲突三原则（内容相同保留命名规范 / 内容不同合并或降级 community / 孤儿资源直接删）。(7) 最终指标：课件数 138→136，validate-courseware 0 错误 + 1 项无关警告（`it-programming-basics` 无 manifest）；硬规则从 43 条扩到 44 条。
- v5.31：**11 棵国际课标树全部构建完成 · IB DP × 4 + A-Level × 3 + AP × 4**——(1) 承接 v5.30 的多课标基础设施，按 `data/curricula.json` 登记清单一次性构建全部 11 棵国际课标知识树。(2) **权威来源**：每棵树基于对应体系最新官方文档构建——IB 四科用 2025 first assessment 新大纲（Physics/Chemistry/Biology 2023 first teaching 新课纲 + Math AA 2021 课纲），Cambridge 三科用 9709/9702/9701 syllabus 2025-2027 版，AP 四科用 College Board 最新 CED（Physics 1 为 2025 修订版）。(3) **树结构明细**：①`ib-dp-math-aa.json`（5 topics / 29 节点，含 HL 深化）；②`ib-dp-physics.json`（5 themes A-E / 21 节点，Space-Time-Motion → Matter → Waves → Fields → Nuclear-Quantum）；③`ib-dp-chemistry.json`（6 域 Structure 1-3 + Reactivity 1-3 / 19 节点，concept-based 教学）；④`ib-dp-biology.json`（4 themes A-D / 23 节点，Unity-Diversity → Form-Function → Interaction → Continuity-Change）；⑤`cam-al-math.json`（P1 + P3 + M1 + S1/S2 / 28 节点）；⑥`cam-al-physics.json`（Topics 1-25 AS+A2 / 22 节点）；⑦`cam-al-chemistry.json`（AS 物理+无机+有机 + A2 进阶 / 25 节点）；⑧`ap-calculus.json`（CED 10 units / 10 节点，BC 独有 Unit 9-10）；⑨`ap-physics-1.json`（2025 修订 8 units / 8 节点）；⑩`ap-chemistry.json`（9 units / 9 节点）；⑪`ap-biology.json`（8 units / 8 节点）。(4) **节点 id 命名示例**：`math-ib-dp-calculus`、`phy-cam-al-oscillations`、`chem-ap-equilibrium`、`bio-ib-dp-photosynthesis`——全部符合硬规则 #45 的"subject + curriculum_infix + topic"约定。(5) **质量指标**：11 棵树共 **47 个域 / 202 个节点 / 0 id 冲突 / 0 悬空 prereq**；Node 端到端测试 4 个课标 31 棵树全部 HTTP 200 可加载。(6) **设计哲学**：树结构忠实映射官方 Subject Guide 的 themes/topics/units 组织方式，不做"中国风"的再归类；节点名采用"中文名 + 英文括注"或"英文 topic ID + 中文解释"双语呈现，方便国际学校老师定位课标位置的同时让中国学生也能理解。(7) 全部节点 `status=placeholder`，`courses=[]`——等待国际学校老师提交首批课件来"点亮"这些节点。(8) 硬规则保持 45 条不变（本版本只是填充数据，无新规则引入）。

- v5.34：**⭐ 新增 PPTX 导出层 L5 + 所有课件强制内置右下角 AI 学伴悬浮球**——(1) 用户需求：①在 skill 中加入输出 pptx 课件的能力，建立时可选格式，默认为 html；②在生成的 HTML 课件页面右下角增加一个智能学伴小图标，用户第一次点击可以输入 OpenAI 格式的 API Key 激活，就当前学习内容提问，以适当的难度简短回答问题。(2) **PPTX 导出（L5 新层级，可选）**：Section 10.1 新增 PPTX 为推荐技术组合；Section 12 输出层级增加 L5 行（默认跳过，仅在 Phase 0 第 8 步命中"PPT/PPTX/幻灯片/投影版/讲义版/打印讲义"关键词时触发）；Phase 0 第 8 步新增"输出格式选择"步骤，记录 `output_formats` 变量（默认 `["html"]`）；Phase 3 新增 3.7 PPTX 导出执行步骤；新建 `scripts/export-pptx.py` 从 HTML 自动派生 .pptx（按 section 切分幻灯片、提取 `<img src="./assets/*.png">` 作为主图、互动组件降级为扫码/URL 占位页）；`python-pptx` 缺失时自动 `pip3 install`，安装失败不阻断 HTML 交付。(3) **AI 学伴悬浮球（v5.34 强制基线）**：新增 Section 10.2.6《AI 学伴悬浮球规范》，定义左下角 FAB → 首次点击弹 API Key 配置（baseUrl/apiKey/model 三字段，默认 `https://api.openai.com/v1` + `gpt-4o-mini`）→ 配置后展开 360×520 对话面板（头部显示当前 section 标题 + 历史气泡 + 输入框）；答复难度按 `grade` 动态 system prompt（小学 2-3 句口语化 / 初中 3-5 句结构化 / 高中 5-8 句可含公式专业词）；API Key 仅 localStorage 保存、严禁硬编码或上传。(4) **公共资源分发**：新建 `scripts/ai-tutor.css`（FAB + 配置 modal + 对话面板样式，支持深浅色学段变量）+ `scripts/ai-tutor.js`（FAB 注入 / localStorage 读写 / SSE 流式调用 / 学段话术映射）；课件打包时 `pack-courseware.cjs` 自动复制到 `.teachany` 包内（相对路径 `./ai-tutor.css` / `./ai-tutor.js`）。(5) **HTML 骨架模板升级（Section 10.2.1）**：`<head>` 新增 `<link rel="stylesheet" href="./ai-tutor.css">`；`<script>` 最前面注入 `window.__TEACHANY_TUTOR_CONFIG__`（含 `courseTitle/subject/grade/learningObjectives/getContext`）；`</body>` 前新增 `<script src="./ai-tutor.js" defer></script>`。(6) **Completeness Gate 扩充**：从 27 项扩充至 29 项——新增 #28 AI 学伴悬浮球（引用 + 配置 + FAB + API Key 安全）、#29 PPTX 导出（output_formats 含 pptx 时检查切分/插图/降级）。(7) **硬规则扩充**：从 44 条扩充至 46 条——新增 #45 AI 学伴基线（必须引入 ai-tutor.css/js + TUTOR_CONFIG + 打包带资源 + 严禁硬编码 Key + 答复难度按 grade）、#46 PPTX 导出基线（触发规则 + 执行要求 + 互动组件降级 + 安装失败不阻断 HTML）；Section 十三标题从 "44 条" 改为 "46 条"。(8) **validate-courseware.py 升级**：新增 4 项 AI 学伴相关校验（① 引用 ai-tutor.css；② 引用 ai-tutor.js；③ 含 TUTOR_CONFIG；④ 无 `sk-xxx` 明文 Key）。(9) **设计哲学**：PPTX 是派生件而非替代品（线下投影/打印讲义场景），HTML 始终是主交付物；AI 学伴把"课件即学习闭环"升级为"课件 + 陪伴式答疑"，学生在 HTML 课件内部就能就地提问，不用切到 ChatGPT 或其他 App，教学连续性和专注度显著提升。

- v5.34.6：**⭐ 注入课标基本要求 · 新增小学科学 · SKILL 课标速查表**——(1) 用户反馈"现在小学没有科学课和图谱，要根据新课标补上"→"同时在 skill 知识库中注入课标内容，尤其是新加入的小学科学"。(2) **数据层**：新建 `data/trees/science-elementary.json`（48 节点、4 领域、`#3b82f6/#10b981/#f59e0b/#8b5cf6` 配色、覆盖 1-6 年级），严格对齐《义务教育科学课程标准（2022 年版）》4 领域 × 13 核心概念结构；在 `data/curricula.json` v1.3 的 cn-national.trees 注册为第 21 棵树（🔬 label_zh "小学科学"）；tree.html 中文课标下新增"🔬 小学科学"按钮并能正确渲染 48 circle + 192 text（Playwright 实测通过）。(3) **SKILL 知识库注入**：新增 Section 17.7「各学科课标速查表」——① 17.7.1 总览表列出 21 棵国内课标树各自的《标准全名》《核心素养（一级）》《年级范围》《颁布机构》《修订版本》，AI 生成课件时可直接定位；② 17.7.2《小学科学课标详细要求》展开该学科的学段划分（第一/二/三学段 3 条目标）、4 大领域对应 13 核心概念、学科前缀约定（`sci-e-*` ⭐ 新增）、探究实践 6 步、探究深度分层（L1→L3）、4 件必做事项、4 种禁用模板；③ 17.7.3 `manifest.curriculum_standards` 字段 7 种 category 引用范式；④ 17.7.4 每棵树的 `metadata.curriculum` / `domain.curriculum_goal` / `node.curriculum_points` 三层 schema 与注入工具说明。(4) **硬规则 #42 扩充**：学科前缀清单从 9 个扩为 10 个，新增 `sci` 小学科学前缀；`manifest.subject: "science"` 被正式纳入合法值；v5.34.6 增量标注"补 `sci`"。(5) **8.3.1 小学科学专属节奏（新小节）**：明确 1-2 / 3-4 / 5-6 年级三学段的设计重点、典型互动、探究深度上限；列出 4 件必做事项（观察入手 / 记录单可填 / 生活联想 / 技术工程收尾）；列出 4 种禁用模板（公式推导 / 题海 / 纯抽象 / 应试导向），防止 AI 把"小学数学模板"套到科学上。(6) **rebuild-index.py 映射扩充**：`subject_to_tree_prefix()` 的 mapping 新增 `'science': ['science-elementary']` 和 `'info_tech': ['info-tech-high']`，让小学科学课件和信息技术课件能被 rebuild-index 正确关联到对应知识树（之前 rebuild-index 漏配就会卡在"文件存在但知识树未引用"警告）。(7) **设计哲学**：课标不只是数据层属性，还应该是 AI 生成课件时的"宪法"——SKILL 知识库里有完整的课标速查表，AI 在 Phase 0.5 知识查询时就能优先引用课标条款而非编造，Phase 3 生成的 HTML 课件也能在 manifest in 准确标注课标依据，形成"课标 → 知识树 → 课件"的完整可追溯链路。

- v5.34.9.2：**⭐ 封堵"直推 examples/ 绕过质检"漏洞 · validator 严格化 · pre-push hook 双重护栏**——(1) 用户发现 2026-04-20 早上 `https://weponusa.github.io/teachany/examples/science-genetics-variation-intro/` 是一份**质量很差、没走社区流水线**的课件，追查发现：commit 记录 `wepon <weponusa@gmail.com>` 直接 `git push origin main` 推的（没走 PR），课件目录只有裸 `index.html`（34KB，0 张图、0 段 mp3、0 canvas、0 svg、0 AI 学伴配置、0 manifest.json），但 registry.json 里 status=official，放到 Gallery 的"官方课件"区。用户质问"质检失效了？"。(2) **根因**：`scripts/validate-courseware.py` 的 `validate_one()` 函数第一行遇到"无 manifest.json"就 `return [('warn', ...)]`——只给个警告然后直接返回，**跳过了后续 47 条硬规则的全部检查**。结果任何人（甚至包括 owner 自己图省事）往 `examples/` 塞一个裸 HTML 都能绕过整个发布闸门。v5.34.9 建的"零配置自动提交 + 自动质检 + 自动合并"流水线再漂亮也挡不住 owner 本地的 `git push`。(3) **修复（validator 严格化）**：`validate_one()` 改为：① 无 manifest.json → `error`（发布阻断）而非 warn；② 即使无 manifest，也继续检查 index.html 是否存在（一次性反馈所有错误）；③ `issues = list(errors)` 把早期致命错误带进主返回列表，供 exit code 判定。(4) **修复（pre-push hook 双重护栏）**：新增 `scripts/pre-push.sh`——每次 `git push` 时自动：① 找出本次 push 涉及的 `examples/<course-id>/` 课件；② 对每个课件跑 `validate-courseware.py`；③ 任何一个 error → 立即拒绝 push。用户需要 `ln -sf ../../scripts/pre-push.sh .git/hooks/pre-push` 一次性安装。紧急绕过：`TEACHANY_SKIP_VALIDATE=1 git push`（仅非课件 push 时用）。(5) **处置已有劣质课件**：删除 `examples/science-genetics-variation-intro/` 目录，从 `registry.json` 移除该条目（140 → 139），从 `data/trees/science-elementary.json` 的 courses[] 引用中清除（实际为 0 处引用，说明当时 rebuild-index 也没跑）。(6) **硬规则 #48 补丁**：在原有"AI 禁止未经用户同意就 push"之上，追加"**任何人（包括 owner）**向 examples/ 推新课件前都必须跑过 validate-courseware.py 0 错误，否则 pre-push hook 会拒绝；owner 紧急修复 README 等非课件文件时才能用 `TEACHANY_SKIP_VALIDATE=1` 绕过"。(7) **防御纵深**：validator 严格化（代码层）+ pre-push hook（本地 git 层）+ GitHub Actions validate.yml（远端 CI 层）三层守护，任何一层都能独立拦住劣质课件；owner 再想"临时图省事 push 一份"都必须要跑一次 validator 才行。(8) **设计哲学**："质检通过 = 发布成功"这条 v5.34.9 定下的规则，必须对**所有提交路径**（社区 PR / owner 直推 / CI 自动化）一视同仁执行，任何一条路径留后门，整个质量体系就崩塌。**Owner 不是免检特权用户，owner 是最应该以身作则的守门人**。

- v5.35：**用户身份上传与自动注册**——课件制作完成后统一写入 `community/<course-id>/`，运行 `scripts/rebuild-index.py` 自动更新 Registry 与知识树，再以当前 Git 用户身份提交并推送到远端；移除旧的多身份发布分支、额外权限标记和审批路径说明。


- v5.34.7：**⭐ L3/L4/PPTX 强制机器校验 · 新增硬规则 #47 PPTX 含图基线**——(1) 用户反馈"现在用户生成的还是没有音频视频互动，而且生成的 pptx 太简陋了，需要强制安装调用 ppt 相关 skill，还要保证有图"。(2) **根因诊断**：此前 L2/L3/L4/L5 都只在 SKILL_CN 文本层面要求"默认执行"，但缺乏 `validate-courseware.py` 层面的**机器校验**——AI 经常跳过就交付，没人能拦住；`examples/science-plant-life-cycle/` 就是典型（交付时无 tts/、无 assets/、PPTX 仅 41KB 且 0 张图）。(3) **validate-courseware.py 升级（5 层新校验）**：① 课件必须有 `tts/*.mp3` 文件（硬规则 #16/#31），缺失即 error；② 有 tts/ 时 HTML 必须含播放器 UI（audioBadge/audioPanel/audioPlaylist 任一），缺失即 error；③ 课件必须有 `assets/*.png|jpg ≥ 2` 张（硬规则 #34），纯计算题课可豁免；④ HTML 必须至少 2 处 `<img src="./assets/">` 引用，缺失即 error；⑤ PPTX 存在时大小必须 ≥ 100KB 且含图 ≥ 1（PPTX 简陋直接 error），图/slide 比 < 30% 报 warn。(4) **新增硬规则 #47 PPTX 含图基线**：量化版 #46，明确 PPTX ≥ 100KB + 图/slide ≥ 30% + 图必须 ≥ 1；校验失败直接 exit 1 阻断 rebuild-index 与 git push。(5) **SUBJECT_PREFIXES 补齐 `sci` 前缀**：配合 v5.34.6 小学科学，`science` 正式纳入 validate-courseware 合法学科。(6) **科学课件范例修复**：`examples/science-plant-life-cycle/` 一键补齐——调用 `image_gen` 生成 2 张课件图（植物生命周期总览 + 部位图）并嵌入 HTML、用 edge-tts 生成 6 段中文旁白 mp3、注入音频播放器 UI 及 `goSlide` 双向 hook、重跑 `export-pptx.py` 得到 3057KB / 10 slides / 2 images 的丰富版 PPTX（原版 41KB / 0 image 的简陋 PPTX 被彻底替换）。(7) **硬规则扩充**：从 46 条扩到 **47 条**；Section 十三标题同步更新。(8) **设计哲学**：把"默认执行"从纸面约束升级为脚本阻断——`validate-courseware.py` 现在能精确识别每一项缺失并报告具体路径，AI 交付前跑一遍就能看到 0 错误才敢 push，彻底终结"又没音频又没图还 PPTX 简陋"的体验问题。



- v5.30：**多课标体系支持 · 国际学校可用（IB/A-Level/AP）**——(1) 用户反馈"有国际学校的老师也想用，但是不是类似 IB 这种体系，没有类似课标的东西？"确认 IB/Cambridge/AP 等体系**都有官方 Subject Guide/Syllabus/CED 文档**，只是结构、学段划分、命名空间与中国课标不同（如 IB DP 是 16-19 岁两年项目 + 跨学科核心，A-Level 分 AS+A2 两阶段，AP 是单学科独立课程）。(2) 选择"路径 A 轻量兼容"方案：不改现有中国课标树的任何 id，通过 **manifest.curriculum 字段 + 独立的国际 ID 前缀 + 配置化课标清单** 支持多体系。(3) **新增 `data/curricula.json`** 登记支持的课程体系：`cn-national`（默认，中国国家课标，20 棵树）/`ib-dp`（IB Diploma Programme）/`cambridge-al`（Cambridge A-Level + IGCSE）/`ap`（Advanced Placement），每个体系定义 `stages[]`（学段枚举 + 年级范围 + id_infix）和 `trees[]`（树文件清单）。(4) **新增 `data/trees/international/`** 目录与 README + `_template.json`：国际课标树与中国课标树分目录存放，避免命名冲突；首批预留 11 棵国际树的文件路径（实际 JSON 按需生长，不强求立即全建）。(5) **manifest schema 扩展**：新增 `curriculum` 字段（默认 `cn-national`）；`rebuild-index.py` 把该字段写入 `registry.json`。(6) **ID 前缀命名空间**：中国 `<subject>-e/m/h-*`；国际 `<subject>-ib-dp-*` / `-cam-igcse-*` / `-cam-as-*` / `-cam-al-*` / `-ap-*`，subject 前缀共用（chem/phy/bio/math 等学科内核跨体系相通）。(7) **`validate-courseware.py` 路由校验**：检测到 curriculum != cn-national 时跳过中国学段硬匹配，仅校验 subject 前缀一致 + teachany_version + title 含 `TeachAny v`；保持对中国课件 100% 向下兼容。(8) **`tree.html` 新增 `#curriculumTabs` 课标切换栏**：顶部多出一排带国旗 emoji 的课标按钮（🇨🇳 中国 / 🎓 IB DP / 🇬🇧 A-Level / 🇺🇸 AP），点击后下方学科 tab 区和知识树动态切到该体系；切换状态存 localStorage；国际课标若尚无树，显示友好占位"该课标体系的知识树尚未建立，欢迎贡献"。(9) **Gallery `index.html` 新增课标过滤器**：新增一行 filter-row 按钮（全部/🇨🇳 中国/🎓 IB DP/🇬🇧 A-Level/🇺🇸 AP），`unified-loader.js` 给每张卡片加 `data-curriculum` 属性，`applyFilters()` 新增课标维度匹配。(10) **新增硬规则 #45 多课标体系基线**：明确 manifest.curriculum 必填、ID 前缀命名空间、校验规则路由、目录约定、贡献流程；硬规则从 44 条扩到 45 条。(11) 设计哲学：TeachAny 的教学方法论（ABT 叙事/五镜头法/ConcepTest/三段式作业）天然与课标无关，本轮改造让工具链也做到了课标中立。


---

