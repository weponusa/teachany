#!/usr/bin/env bash
# TeachAny Skill Release Builder · v7.9.3
# 按 2 个预设档位打包 skill 发布 ZIP，放到 dist/
# 用法：bash scripts/build-skill-release.sh [standard|full|all]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DIST_DIR="$ROOT/dist"
mkdir -p "$DIST_DIR"

# 从 manifest.json 或 skill/SKILL.md frontmatter 读版本号
# 优先用 skill-v* 标签；次选最近 commit 短哈希；最后用日期
if git describe --tags --match "skill-v*" --abbrev=0 >/dev/null 2>&1; then
  VERSION=$(git describe --tags --match "skill-v*" --abbrev=0 | sed 's/^skill-v//')
else
  VERSION=$(date +%Y%m%d)-$(git rev-parse --short HEAD 2>/dev/null || echo "dev")
fi
echo "📦 TeachAny Skill Release Builder · version=$VERSION"
echo ""

build_preset() {
  local preset="$1"
  local preset_file=".sparse-checkout-presets/${preset}.txt"
  if [ ! -f "$preset_file" ]; then
    echo "❌ 预设不存在: $preset_file"
    return 1
  fi

  local tmp_dir="$DIST_DIR/_staging_${preset}"
  local zip_file="$DIST_DIR/teachany-skill-${preset}-v${VERSION}.zip"
  rm -rf "$tmp_dir" "$zip_file"
  mkdir -p "$tmp_dir"

  echo "🔨 Building preset: $preset"

  # 解析预设文件为 rsync include/exclude 规则
  # 预设文件格式：
  #   path/          → include
  #   !path/         → exclude
  #   # comment      → ignore
  #   blank          → ignore
  local rsync_args=()
  local include_paths=()
  local exclude_paths=()
  while IFS= read -r line; do
    # 去首尾空白
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [ -z "$line" ] && continue
    case "$line" in
      \#*) continue ;;
      !*) exclude_paths+=("${line:1}") ;;
      *) include_paths+=("$line") ;;
    esac
  done < "$preset_file"

  # rsync 从仓库复制到 staging，按 include_paths 精确拷贝
  for p in "${include_paths[@]}"; do
    # 忽略明显是 git 元的特殊项
    case "$p" in
      .gitignore|.gitattributes|.nojekyll|LICENSE|MANIFEST|manifest.json)
        [ -e "$ROOT/$p" ] && cp -a "$ROOT/$p" "$tmp_dir/$p" || true
        ;;
      */)
        # 目录：递归拷贝，对 exclude_paths 做过滤
        local src="${p%/}"
        if [ -d "$ROOT/$src" ]; then
          mkdir -p "$tmp_dir/$src"
          # 构造 rsync exclude 参数
          local exc_args=()
          for e in "${exclude_paths[@]:-}"; do
            [ -z "$e" ] && continue
            # 仅匹配当前目录的 exclude
            if [[ "$e" == "$src/"* ]]; then
              exc_args+=("--exclude" "${e#$src/}")
            fi
          done
          if [ ${#exc_args[@]} -gt 0 ]; then
            rsync -a "${exc_args[@]}" "$ROOT/$src/" "$tmp_dir/$src/"
          else
            rsync -a "$ROOT/$src/" "$tmp_dir/$src/"
          fi
        fi
        ;;
      *)
        # 单文件/通配
        if [ -e "$ROOT/$p" ]; then
          mkdir -p "$tmp_dir/$(dirname "$p")"
          cp -a "$ROOT/$p" "$tmp_dir/$p"
        fi
        ;;
    esac
  done

  # 始终包含关键元文件（即使未列入预设）
  for must in README.md README_CN.md INSTALL_CN.md INSTALL_CN_SIMPLE.md LICENSE manifest.json .nojekyll; do
    [ -e "$ROOT/$must" ] && [ ! -e "$tmp_dir/$must" ] && cp -a "$ROOT/$must" "$tmp_dir/$must" || true
  done

  # 产出 ZIP
  local size_raw=$(du -sh "$tmp_dir" | awk '{print $1}')
  echo "   staging size: $size_raw"
  (cd "$DIST_DIR" && zip -rq "$(basename "$zip_file")" "_staging_${preset}" -x "*.DS_Store" -x "*/__pycache__/*" -x "*/.pytest_cache/*" && \
   # 重新打包让根目录名变成 teachany-${preset}
   rm -rf "_final_${preset}" && \
   mv "_staging_${preset}" "teachany-${preset}" && \
   rm -f "$(basename "$zip_file")" && \
   zip -rq "$(basename "$zip_file")" "teachany-${preset}" -x "*.DS_Store" -x "*/__pycache__/*" -x "*/.pytest_cache/*" && \
   mv "teachany-${preset}" "_staging_${preset}")
  local zip_size=$(du -h "$zip_file" | awk '{print $1}')
  echo "   ✅ $zip_file  ($zip_size)"
  rm -rf "$tmp_dir"
  echo ""
}

case "${1:-all}" in
  standard|full)
    build_preset "$1"
    ;;
  all)
    for p in standard; do
      build_preset "$p"
    done
    echo "ℹ️  'full' preset 包含所有内容 (~700MB)，不默认打包。如需：bash $0 full"
    ;;
  *)
    echo "用法：$0 [standard|full|all]"
    exit 2
    ;;
esac

echo "🎉 Release 产物全部在 $DIST_DIR/"
ls -lh "$DIST_DIR"/*.zip 2>/dev/null
