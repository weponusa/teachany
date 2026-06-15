#!/usr/bin/env bash
# ============================================================
# TeachAny Auto-Publish · v3.0
# ============================================================
# 维护者直推（本地 Mac + SSH/GH_TOKEN）：
#   验证 → rebuild-index（挂树+registry+kg）→ sync node-index
#   → 限定范围 git commit/push → 验证 teachany.cn + 远端树节点
#
# 用法:
#   bash auto-publish.sh <course-id> [--all-changes] [--no-verify] [--dry-run]
#   bash auto-publish.sh chn-h-red-chamber
#
# 环境:
#   TEACHANY_COURSEWARE_REPO  课件仓路径（默认 ~/.cache/teachany-courseware，无仓则浅克隆）
#   --course-dir PATH         课件源目录（任意路径，不必在 courseware 仓内）
#   TEACHANY_REPO             主仓（仅当课件需从 opensource 复制时）
#   GH_TOKEN                  无 SSH 时用 HTTPS push
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_defaults.sh
source "$SCRIPT_DIR/_defaults.sh" 2>/dev/null || true
_CONFIG="$HOME/.teachany/config"
[ -f "$_CONFIG" ] && source "$_CONFIG"

COURSE_ID=""
COURSE_DIR_ARG=""
FLAG_ALL=0
FLAG_NO_VERIFY=0
FLAG_DRY_RUN=0

while [ $# -gt 0 ]; do
  case "$1" in
    --course-dir) COURSE_DIR_ARG="$2"; shift 2 ;;
    --all-changes) FLAG_ALL=1; shift ;;
    --no-verify)   FLAG_NO_VERIFY=1; shift ;;
    --dry-run)     FLAG_DRY_RUN=1; shift ;;
    -h|--help)
      sed -n '2,22p' "$0"
      exit 0
      ;;
    *)
      [ -z "$COURSE_ID" ] && COURSE_ID="$1"
      shift
      ;;
  esac
done

COURSEWARE_REPO="${TEACHANY_COURSEWARE_REPO:-$HOME/.cache/teachany-courseware}"
SOURCE_REPO="${TEACHANY_REPO:-$HOME/CodeBuddy/一次函数/teachany-opensource}"
SITE_COURSE_URL="https://www.teachany.cn/community/${COURSE_ID}/"
GITHUB_COURSE_URL="https://weponusa.github.io/teachany-courseware/community/${COURSE_ID}/"
TREE_URL="https://www.teachany.cn/tree.html"

if [ -z "$COURSE_ID" ]; then
  echo "用法: $0 <course-id> [--all-changes] [--no-verify] [--dry-run]"
  exit 1
fi

if [ "${TEACHANY_UPLOAD_CONFIRMED:-}" != "1" ]; then
  echo ""
  echo "❌ Phase 3.5b：未确认上传。"
  echo "   须先询问用户是否上传，同意后再执行："
  echo "   TEACHANY_UPLOAD_CONFIRMED=1 bash \"$0\" $COURSE_ID"
  echo "   详见: phases/phase3-5-gates.md"
  echo ""
  exit 3
fi

TARGET_DIR="$COURSEWARE_REPO/community/$COURSE_ID"
SOURCE_DIR="$SOURCE_REPO/community/$COURSE_ID"

echo "═══════════════════════════════════════════════"
echo "  TeachAny Auto-Publish v3.0"
echo "═══════════════════════════════════════════════"
echo "  Course ID:    $COURSE_ID"
echo "  Courseware:   $COURSEWARE_REPO"
echo "  线上课件:     $SITE_COURSE_URL"
echo

# ── 0. Push 凭据检测 ──
can_push() {
  if [ -n "${GH_TOKEN:-}" ]; then return 0; fi
  ssh -T git@github.com -o BatchMode=yes -o ConnectTimeout=8 2>&1 | grep -qi "successfully authenticated" && return 0
  return 1
}

if ! can_push; then
  echo "❌ 当前环境无法 push 到 GitHub（无 SSH 且无 GH_TOKEN）"
  echo "   Agent/CI 请改用: bash \"$SCRIPT_DIR/publish_course.sh\" \"$TARGET_DIR\" \"$COURSE_ID\""
  exit 2
fi

if [ ! -d "$COURSEWARE_REPO/.git" ]; then
  if can_push; then
    echo "[0/8] 无本地 courseware → 浅克隆到 $COURSEWARE_REPO ..."
    mkdir -p "$(dirname "$COURSEWARE_REPO")"
    RM_REPO=0
    [ -d "$COURSEWARE_REPO" ] && RM_REPO=1
    [ "$RM_REPO" = 1 ] && rm -rf "$COURSEWARE_REPO"
    if [ -n "${GH_TOKEN:-}" ]; then
      git clone --depth 1 --branch main \
        "https://x-access-token:${GH_TOKEN}@github.com/weponusa/teachany-courseware.git" \
        "$COURSEWARE_REPO"
    else
      git clone --depth 1 --branch main git@github.com:weponusa/teachany-courseware.git "$COURSEWARE_REPO"
    fi
  else
    echo "❌ 课件仓库不存在且无 push 凭据: $COURSEWARE_REPO"
    echo "   请设置 GH_TOKEN，或: bash \"$SCRIPT_DIR/publish_course.sh\" ..."
    exit 1
  fi
fi

# ── 1. 确保课件目录存在 ──
if [ ! -d "$TARGET_DIR" ]; then
  COPY_FROM=""
  if [ -n "$COURSE_DIR_ARG" ] && [ -d "$COURSE_DIR_ARG" ]; then
    COPY_FROM="$COURSE_DIR_ARG"
  elif [ -d "$SOURCE_DIR" ]; then
    COPY_FROM="$SOURCE_DIR"
  fi
  if [ -n "$COPY_FROM" ]; then
    echo "[1/8] 复制课件 $COPY_FROM → courseware/community/$COURSE_ID ..."
    mkdir -p "$COURSEWARE_REPO/community"
    cp -R "$COPY_FROM" "$TARGET_DIR"
  else
    echo "❌ 找不到课件: $TARGET_DIR"
    echo "   请用 --course-dir 指定课件目录，或先制作 community/$COURSE_ID"
    exit 1
  fi
else
  echo "[1/8] 课件目录已存在"
  if [ -n "$COURSE_DIR_ARG" ] && [ -d "$COURSE_DIR_ARG" ]; then
    echo "  ↻ 用 --course-dir 覆盖同步到 courseware/community/..."
    rm -rf "$TARGET_DIR"
    mkdir -p "$COURSEWARE_REPO/community"
    cp -R "$COURSE_DIR_ARG" "$TARGET_DIR"
  fi
fi

for f in index.html manifest.json; do
  [ -f "$TARGET_DIR/$f" ] || { echo "❌ 缺少 $f"; exit 1; }
done

echo "[0/8] Phase 3.5a feedback manifest..."
FB_SCRIPT="$SCRIPT_DIR/set-feedback-password.py"
[ -f "$FB_SCRIPT" ] || FB_SCRIPT="$COURSEWARE_REPO/scripts/set-feedback-password.py"
if [ -f "$FB_SCRIPT" ]; then
  python3 "$FB_SCRIPT" --check "$TARGET_DIR/manifest.json" || exit 1
else
  echo "  ⚠️  未找到 set-feedback-password.py，跳过 feedback 校验"
fi

PREFLIGHT="$SCRIPT_DIR/preflight-publish.py"
[ -f "$PREFLIGHT" ] || PREFLIGHT="$COURSEWARE_REPO/scripts/preflight-publish.py"
if [ -f "$PREFLIGHT" ]; then
  echo "[0.5/8] preflight-publish（发布前闸门）..."
  if ! python3 "$PREFLIGHT" "$TARGET_DIR"; then
    echo "❌ preflight-publish 未通过，已中止 auto-publish"
    exit 1
  fi
fi

NODE_ID="$(python3 -c "
import re, pathlib
h = pathlib.Path('$TARGET_DIR/index.html').read_text(encoding='utf-8')
for pat in [r'teachany-node', r'course-id']:
    m = re.search(rf'name=[\"\']{pat}[\"\'][^>]*content=[\"\']([^\"\']+)', h, re.I)
    if m: print(m.group(1).strip()); break
else:
    import json
    print(json.load(open('$TARGET_DIR/manifest.json')).get('node_id','') or '$COURSE_ID')
" 2>/dev/null || echo "$COURSE_ID")"
echo "  node_id: $NODE_ID"

# ── 2. 课件质检 ──
echo "[2/8] validate-courseware..."
cd "$COURSEWARE_REPO"
if [ -f scripts/validate-courseware.py ]; then
  python3 scripts/validate-courseware.py "$COURSE_ID" || exit 1
elif [ -f "$SCRIPT_DIR/validate-courseware.cjs" ]; then
  node "$SCRIPT_DIR/validate-courseware.cjs" "$TARGET_DIR" || exit 1
else
  echo "  ⚠️  跳过：未找到 validator"
fi

# ── 3. KCP（可选）──
if [ ! -f "$TARGET_DIR/knowledge-context.json" ] && [ -f scripts/knowledge_layer.py ]; then
  echo "[3/8] emit knowledge-context.json..."
  python3 scripts/knowledge_layer.py lookup --node-id "$NODE_ID" \
    --emit-kcp "community/$COURSE_ID/knowledge-context.json" 2>/dev/null || true
else
  echo "[3/8] KCP 已存在或跳过"
fi

# ── 4. rebuild-index（挂树 + registry + kg manifest）──
echo "[4/8] rebuild-index.py..."
if [ "$FLAG_DRY_RUN" = 1 ]; then
  echo "  [dry-run] 跳过 rebuild-index"
else
  python3 scripts/rebuild-index.py 2>&1 | tail -20 | sed 's/^/    /'
fi

# ── 5. 链接检查 ──
echo "[5/8] check-courseware-links..."
if [ "$FLAG_DRY_RUN" = 1 ]; then
  echo "  [dry-run] 跳过"
else
  python3 scripts/check-courseware-links.py --id "$COURSE_ID" 2>&1 | sed 's/^/    /' || exit 1
fi

# ── 6. Git：限定范围提交（默认不 git add -A）──
echo "[6/8] git commit（限定范围）..."
cd "$COURSEWARE_REPO"

stage_publish_files() {
  git add "community/$COURSE_ID"
  local index_files=(
    registry.json registry-v2.json community/index.json
    data/node-index.json data/nodes-metadata.json data/nodes-selector.json
    assets/scripts/teachany-kg-manifest.json scripts/teachany-kg-manifest.json
  )
  for f in "${index_files[@]}"; do
    [ -f "$f" ] && git add -u "$f" 2>/dev/null || true
  done
  git add -u data/trees 2>/dev/null || true
}

if [ "$FLAG_ALL" = 1 ]; then
  echo "  ⚠️  --all-changes：暂存全部变更（维护者批量发布）"
  git add -A
else
  stage_publish_files
fi

if [ -z "$(git status --short)" ]; then
  echo "  ⏭️  无变更，跳过 commit/push"
else
  if [ "$FLAG_DRY_RUN" = 1 ]; then
    echo "  [dry-run] 将提交:"
    git status --short | sed 's/^/    /'
  else
    git commit -m "$(cat <<EOF
feat(courseware): publish $COURSE_ID

- register community course and mount on knowledge tree (node $NODE_ID)
- rebuild registry, kg-manifest, node-index

EOF
)"
    echo "  📤 push origin main..."
    if ! git push origin main 2>&1; then
      echo "  🔄 pull --rebase 后重试..."
      git pull origin main --rebase
      git push origin main
    fi
    echo "  ✅ 已推送 origin/main"
  fi
fi

# ── 7. 挂树自检（本地树 = 已 push 内容）──
echo "[7/8] 验证知识树挂载..."
if [ "$FLAG_DRY_RUN" = 1 ]; then
  echo "  [dry-run] 跳过"
else
  TREE_CHECK="$(python3 -c "
import json
from pathlib import Path
nid = '$NODE_ID'
for p in Path('data/trees').rglob('*.json'):
    if p.name.startswith('_'): continue
    d = json.loads(p.read_text(encoding='utf-8'))
    for dom in d.get('domains') or []:
        for node in dom.get('nodes') or []:
            if node.get('id') == nid:
                print(node.get('status','?'), node.get('courses',[]))
                raise SystemExit(0)
print('NOT_FOUND')
raise SystemExit(1)
" 2>/dev/null || echo "CHECK_FAILED")"
  echo "  树节点: $TREE_CHECK"
  if echo "$TREE_CHECK" | grep -q "active"; then
    echo "  ✅ status=active（push 后 teachany.cn/tree.html 应显示 ✅）"
  else
    echo "  ⚠️  节点未 active，请检查 manifest.node_id 与 rebuild-index"
  fi
fi

# ── 8. 线上 URL（teachany.cn 优先）──
echo "[8/8] 验证线上 URL..."
if [ "$FLAG_NO_VERIFY" = 1 ] || [ "$FLAG_DRY_RUN" = 1 ]; then
  echo "  跳过 URL 轮询"
else
  echo "  ⏳ 等待 Pages 部署（最多 8 分钟）..."
  ok=0
  for attempt in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16; do
    sleep 30
    code_cn=$(curl -sI -L --max-time 12 "$SITE_COURSE_URL" 2>/dev/null | head -1 | grep -oE '[0-9]{3}' | head -1)
    code_gh=$(curl -sI -L --max-time 12 "$GITHUB_COURSE_URL" 2>/dev/null | head -1 | grep -oE '[0-9]{3}' | head -1)
    echo "  ⏳ ${attempt}×30s: teachany.cn=$code_cn github.io=$code_gh"
    if [ "$code_cn" = "200" ] || [ "$code_gh" = "200" ]; then
      ok=1
      break
    fi
    if [ "$attempt" = "6" ]; then
      echo "  🔧 尝试 empty commit 触发 Pages..."
      git commit --allow-empty -m "chore: trigger pages redeploy for $COURSE_ID" 2>/dev/null || true
      git push origin main 2>/dev/null | tail -2 || true
    fi
  done
  if [ "$ok" != 1 ]; then
    echo "  ⚠️  8 分钟内未收到 HTTP 200，勿声称发布完成"
  fi
fi

echo
echo "═══════════════════════════════════════════════"
echo "  发布流程结束"
echo "  📚 课件: $SITE_COURSE_URL"
echo "  🗺️  知识地图: $TREE_URL （高中/初中语文 → 对应节点应显示 ✅）"
echo "  📋 node_id: $NODE_ID"
echo "═══════════════════════════════════════════════"
