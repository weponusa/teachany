# CDN Hero 孤儿图对照表

`teachany-images` 上有预制 `*-hero.png`，但课件 `registry.json` / `index.html` 用了别的文件名（如 `hero-knowledge-map.png`、`hero-infographic.svg`）时，批量图会显示为「未引用」。

`build-image-registry.py` 已通过 `CDN_EXTRA` 把下列条目挂入 `image-registry.json`，供 `find-hero.py` L1 命中。

| CDN 路径 | 建议 course_id | node_id | 说明 |
| --- | --- | --- | --- |
| `biology/cell-membrane-hero.png` | `bio-h-cell-membrane` | `bio-h-cell-membrane` | 课件用 `hero-knowledge-map.png` |
| `biology/cell-metabolism-hero.png` | `bio-h-cell-metabolism` | `bio-h-cell-metabolism` | 课件用 `hero-cell-metabolism.png` |
| `biology/elements-compounds-hero.png` | `bio-h-elements-compounds` | `bio-h-elements-compounds` | 课件用 `hero-knowledge-map.png` |
| `biology/endomembrane-system-hero.png` | `bio-h-endomembrane-system` | `bio-h-endomembrane-system` | 课件用 `hero-endomembrane-structure.png` |
| `biology/nucleus-hero.png` | `bio-h-nucleus` | `bio-h-nucleus` | 课件用 `hero-nucleus.png` |
| `biology/organelles-hero.png` | `bio-h-organelles` | `bio-h-organelles` | 课件用 `hero-knowledge-map.png` |
| `biology/photosynthesis-m-hero.png` | `bio-m-photosynthesis-m` | `bio-m-photosynthesis-m` | 另有 `bio-photosynthesis` 用本地 png |
| `biology/prokaryote-eukaryote-hero.png` | `bio-h-prokaryote-eukaryote` | `bio-h-prokaryote-eukaryote` | 课件用 `hero-prokaryote-eukaryote.png` |
| `chemistry/aluminum-compounds-hero.png` | `chem-h-aluminum-compounds` | `chem-h-aluminum-compounds` | 已登记本地 hero |
| `chemistry/ib-dp-periodic-table-hero.png` | `chem-ib-dp-periodic-table` | `chem-ib-dp-periodic-table` | 已登记 |
| `chemistry/oxidation-reduction-hero.png` | `chem-oxidation-reduction` | `chem-h-oxidation-reduction` | 已登记 |
| `chemistry/periodic-table-hero.png` | `chem-periodic-table` | `chem-m-periodic-table` | `chem-h-periodic-table-h` 用 SVG |
| `geography/monsoon-system-hero.png` | `geo-h-monsoon-system` | `geo-h-monsoon-system` | 另有 `geo-monsoon` 用 `geo-monsoon-hero.png` |
| `science/plant-life-cycle-hero.png` | `sci-e-plant-life-cycle` | `sci-e-plant-life-cycle` | registry 无 hero_image |
| `science/-hero.png` | — | — | **坏文件名**，建议从 CDN 仓库删除或重命名 |

维护：批量 OpenRouter hero 上传 CDN 后运行：

```bash
python3 scripts/build-image-registry.py --write-opensource
python3 scripts/image_resolver.py audit
```
