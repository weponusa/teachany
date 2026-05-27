#!/usr/bin/env bash
# Build merged static site for CloudBase hosting (teachany/ + teachany-courseware/).
# Source of truth: local git checkouts on main — deploy the newest build to both CDNs.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OPEN_ROOT="${OPEN_SOURCE_ROOT:-$ROOT}"
CW_ROOT="${COURSEWARE_ROOT:-$(cd "$ROOT/../teachany-courseware" 2>/dev/null && pwd || true)}"
DIST="${DIST_DIR:-$ROOT/dist/cloudbase}"
SHA="${DEPLOY_SHA:-$(git -C "$OPEN_ROOT" rev-parse HEAD 2>/dev/null || echo unknown)}"
BUILT_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

if [[ ! -d "$CW_ROOT/community" ]]; then
  echo "❌ teachany-courseware not found at: $CW_ROOT"
  echo "   Set COURSEWARE_ROOT=/path/to/teachany-courseware"
  exit 1
fi

echo "=== TeachAny CloudBase dist ==="
echo "  opensource: $OPEN_ROOT"
echo "  courseware: $CW_ROOT"
echo "  dist:       $DIST"
echo "  sha:        $SHA"

rm -rf "$DIST"
mkdir -p "$DIST/teachany" "$DIST/teachany-courseware"

# ── teachany-opensource → dist/teachany/ (mirrors deploy-pages.yml) ──
OS_SITE="$DIST/teachany"
for dir in assets community data scripts styles gallery pages; do
  [[ -d "$OPEN_ROOT/$dir" ]] && rsync -a "$OPEN_ROOT/$dir/" "$OS_SITE/$dir/"
done
shopt -s nullglob
for f in "$OPEN_ROOT"/*.html "$OPEN_ROOT"/*.json; do
  cp "$f" "$OS_SITE/"
done
shopt -u nullglob
find "$OS_SITE" -type f \( -name '*.py' -o -name '*.pyc' -o -name '*.sh' -o -name '*.cjs' -o -name '*.log' \) -delete 2>/dev/null || true
find "$OS_SITE" -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true
find "$OS_SITE" -type d -name 'node_modules' -exec rm -rf {} + 2>/dev/null || true
find "$OS_SITE" -type l -delete 2>/dev/null || true
touch "$OS_SITE/.nojekyll"

# ── teachany-courseware → dist/teachany-courseware/ (mirrors deploy-pages.yml) ──
CW_SITE="$DIST/teachany-courseware"
# -L: 跟随符号链接；exit 23 = 部分文件缺失（本地断链），CI 上通常无此问题
rsync -aL --exclude='remotion/' "$CW_ROOT/community/" "$CW_SITE/community/" || {
  code=$?
  [[ $code -eq 23 ]] && echo "⚠️ rsync community: 部分断链文件已跳过 (exit $code)" || exit $code
}
rsync -aL --exclude='maps/physical/' "$CW_ROOT/assets/" "$CW_SITE/assets/" || {
  code=$?
  [[ $code -eq 23 ]] && echo "⚠️ rsync assets: 部分断链已跳过 (exit $code)" || exit $code
}
rsync -a --exclude='.venv/' --exclude='history' --exclude='geography' "$CW_ROOT/data/" "$CW_SITE/data/"
touch "$CW_SITE/.nojekyll"
for f in 404.html index.html courseware-registry.json registry.json registry-v2.json commercial-license.html; do
  [[ -f "$CW_ROOT/$f" ]] && cp "$CW_ROOT/$f" "$CW_SITE/"
done

# ── deploy manifest (for sync verification) ──
cat > "$DIST/DEPLOY_SHA.txt" <<EOF
sha=$SHA
built_at=$BUILT_AT
opensource=$OPEN_ROOT
courseware=$CW_ROOT
courseware_sha=$(git -C "$CW_ROOT" rev-parse HEAD 2>/dev/null || echo unknown)
EOF

# Root redirect: CloudBase 根路径 → 主站
cat > "$DIST/index.html" <<'EOF'
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=/teachany/">
  <link rel="canonical" href="/teachany/">
  <title>TeachAny</title>
</head>
<body><p><a href="/teachany/">进入 TeachAny</a></p></body>
</html>
EOF

echo "✅ dist ready: $(du -sh "$DIST" | cut -f1), files=$(find "$DIST" -type f | wc -l | tr -d ' ')"
echo "   DEPLOY_SHA=$SHA"
