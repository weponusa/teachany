#!/usr/bin/env bash
# ============================================================
# TeachAny Publish Orchestrator · 自动选择推送路径
# ============================================================
# Phase 4 推荐（与 hang_tree.py publish 等价）：
#   TEACHANY_UPLOAD_CONFIRMED=1 bash teachany-publish.sh <course-id> --course-dir <任意路径>
#
#   - 有 GH_TOKEN/SSH → auto-publish（无本地仓则自动浅克隆 ~/.cache/teachany-courseware）
#   - 否则 → publish_course（Worker PR，无需凭据，合并后 CI rebuild-index 挂树）
#
# 挂树/注册节点/重建索引：python3 hang_tree.py {register|publish|rebuild}
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_defaults.sh
source "$SCRIPT_DIR/_defaults.sh" 2>/dev/null || true
COURSE_ID=""
COURSE_DIR=""
EXTRA=()

while [ $# -gt 0 ]; do
  case "$1" in
    --course-dir)
      COURSE_DIR="$2"
      shift 2
      ;;
    *)
      if [ -z "$COURSE_ID" ]; then COURSE_ID="$1"; else EXTRA+=("$1"); fi
      shift
      ;;
  esac
done

COURSEWARE_REPO="${TEACHANY_COURSEWARE_REPO:-$HOME/.cache/teachany-courseware}"
if [ -z "$COURSE_DIR" ]; then
  if [ -d "./community/$COURSE_ID" ]; then
    COURSE_DIR="$(cd "./community/$COURSE_ID" && pwd)"
  else
    COURSE_DIR="$COURSEWARE_REPO/community/$COURSE_ID"
  fi
fi

if [ -z "$COURSE_ID" ]; then
  echo "用法: $0 <course-id> [--course-dir PATH] [extra flags]"
  exit 1
fi

if [ "${TEACHANY_UPLOAD_CONFIRMED:-}" != "1" ]; then
  echo ""
  echo "❌ Phase 3.5b：发布前必须征得用户同意上传。"
  echo "   请先完成 phases/phase3-5-gates.md 中的询问，再执行："
  echo "   TEACHANY_UPLOAD_CONFIRMED=1 python3 \"$SCRIPT_DIR/hang_tree.py\" publish $COURSE_ID --course-dir \"$COURSE_DIR\""
  echo "   # 或: TEACHANY_UPLOAD_CONFIRMED=1 bash \"$0\" $COURSE_ID --course-dir \"$COURSE_DIR\""
  echo ""
  exit 3
fi

can_push() {
  if [ -n "${GH_TOKEN:-}" ]; then return 0; fi
  ssh -T git@github.com -o BatchMode=yes -o ConnectTimeout=8 2>&1 | grep -qi "successfully authenticated" && return 0
  return 1
}

echo "TeachAny Publish Orchestrator"
echo "  course-id: $COURSE_ID"
echo "  course-dir: $COURSE_DIR"
echo

if can_push; then
  echo "✅ 检测到 GitHub push 权限 → auto-publish（浅克隆 courseware + rebuild-index 挂树）"
  exec bash "$SCRIPT_DIR/auto-publish.sh" "$COURSE_ID" --course-dir "$COURSE_DIR" "${EXTRA[@]}"
else
  echo "ℹ️  无 push 权限 → publish_course（Worker PR，合并后 CI 自动挂树）"
  exec bash "$SCRIPT_DIR/publish_course.sh" "$COURSE_DIR" "$COURSE_ID" "${EXTRA[@]}"
fi
