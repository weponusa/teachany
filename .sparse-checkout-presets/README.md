# TeachAny 按需下载预设

本仓库 **仅含 Skill**（`teachany/`）。完整网站在 [teachany-courseware](https://github.com/weponusa/teachany-courseware) → [www.teachany.cn](https://www.teachany.cn/)。

## 一键命令

```bash
git clone --filter=blob:none --sparse https://github.com/weponusa/teachany.git
cd teachany
git sparse-checkout set --from-file .sparse-checkout-presets/standard.txt
ln -sfn "$PWD/teachany" ~/.agents/skills/teachany
```

## 档位

| 档位 | 含什么 |
|------|--------|
| **standard** ⭐ | `teachany/` Skill 本体 |
| **full** | Skill + 根目录文档 |
| **disable sparse** | 完整 teachany 仓（仍无 `community/` 课件） |

## 在线课件

所有成品课件在 **https://www.teachany.cn/** ，无需 clone `teachany-courseware` 即可浏览。
