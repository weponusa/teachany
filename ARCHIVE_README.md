# Archive 目录说明

## 📁 备份位置

`archive/examples-backup-20260412/`

## 📊 备份内容

- **备份日期**: 2026-04-12
- **文件数量**: 2,379 个文件
- **总大小**: 98 MB
- **课件数量**: 160+ 个完整课件目录

## 🎯 备份原因

在 v2.1 版本中,为了优化 Skill 安装速度和仓库体积,我们将官方课件从 100+ 个精简至 7 个。被移除的课件已全部备份到此目录。

## 📋 保留的7个官方课件

1. 一元二次函数 (数学 Grade 9)
2. 一次函数 (数学 Grade 8)
3. 光合作用 (生物 Grade 7)
4. 秦汉统一多民族国家 (历史 Grade 7)
5. 压强 (物理 Grade 8)
6. 全球季风系统 (地理 Grade 10)
7. 元素周期表 (化学 Grade 9)

## 🌐 降级为社区课件

备份的课件中,已有 20 个代表性课件被降级为社区课件,可通过以下方式访问:

1. **Gallery 页面**: 社区课件区 (🌐 标识)
2. **知识地图**: 节点 Tooltip 显示社区课件列表
3. **社区索引**: `community/index.json`

## 🔄 如何恢复备份课件

如果需要恢复某个被备份的课件到官方课件区:

```bash
# 1. 复制课件目录回 examples/
cp -r archive/examples-backup-20260412/<课件目录名> examples/

# 2. 在 courseware-registry.json 中添加该课件的条目
# 参考现有7个课件的格式

# 3. 提交更改
git add examples/<课件目录名> courseware-registry.json
git commit -m "Restore courseware: <课件名>"
```

## 📦 访问备份课件的其他方式

### 方式1: 本地访问
```bash
# 启动本地服务器
cd /path/to/teachany-opensource
python3 -m http.server 8888

# 访问备份课件
http://localhost:8888/archive/examples-backup-20260412/<课件目录名>/index.html
```

### 方式2: 从 GitHub Releases 下载
所有课件的 `.teachany` 打包版本已上传至 GitHub Releases:
- https://github.com/weponusa/teachany/releases/tag/courseware-v20260410
- https://github.com/weponusa/teachany/releases/tag/courseware-v20260411

### 方式3: 社区索引查询
```javascript
// 在浏览器控制台中
const index = await fetch('./community/index.json').then(r => r.json());
console.log(index.courses); // 查看所有社区课件
```

## 📝 备份清单 (前20个示例)

| 序号 | 课件ID | 课件名称 | 学科 | 年级 |
|:---:|:---|:---|:---:|:---:|
| 1 | math-congruent-triangles | 全等三角形的判定 | 数学 | 8 |
| 2 | math-variable-function | 变量与函数 | 数学 | 7 |
| 3 | phy-mid-atmospheric-pressure | 大气压强 | 物理 | 8 |
| 4 | phy-mid-buoyancy | 浮力 | 物理 | 8 |
| 5 | bio-cell-structure | 细胞的结构与功能 | 生物 | 7 |
| 6 | math-rational-numbers | 有理数 | 数学 | 7 |
| 7 | math-absolute-value | 绝对值 | 数学 | 7 |
| 8 | phy-newton-second-law | 牛顿第二定律 | 物理 | 9 |
| 9 | phy-light-reflection | 光的反射 | 物理 | 8 |
| 10 | math-linear-inequality | 一元一次不等式 | 数学 | 8 |
| ... | ... | ... | ... | ... |

完整清单请查看 `community/index.json` 和 `courseware-registry-backup-20260412.json`

## ⚠️ 重要提示

**本地备份目录 (`archive/`) 不会提交到 Git 仓库**,原因:
- 文件过大 (98 MB)
- 文件数量过多 (2,379 个)
- 已有更好的备份方案 (GitHub Releases + 社区索引)

如需完整备份,请:
1. 从 `courseware-registry-backup-20260412.json` 获取课件列表
2. 从 GitHub Releases 下载对应的 `.teachany` 包
3. 或使用社区课件下载功能

## 📊 备份统计

```
备份目录结构:
archive/
└── examples-backup-20260412/        # 160+ 课件目录
    ├── bio-*.teachany              # 生物课件
    ├── math-*.teachany             # 数学课件
    ├── phy-*.teachany              # 物理课件
    ├── chem-*.teachany             # 化学课件
    ├── geo-*.teachany              # 地理课件
    ├── his-*.teachany              # 历史课件
    └── ...

文件类型分布:
- .html 文件: ~530 个
- .mp3 文件: ~710 个
- .py 文件: ~530 个
- .pyc 文件: ~530 个
- .json 文件: ~170 个
- 其他文件: ~200 个
```

## 🔗 相关文档

- [社区课件集成验证报告](./COMMUNITY_INTEGRATION_VERIFICATION_REPORT.md)
- [课件注册表备份](./courseware-registry-backup-20260412.json)
- [社区课件索引](./community/index.json)
- [验证工具](./verify-community-integration.html)

---

**创建日期**: 2026-04-12  
**备份版本**: v2.1  
**维护者**: TeachAny Team
