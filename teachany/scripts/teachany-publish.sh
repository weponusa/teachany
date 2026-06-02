#!/usr/bin/env bash
# ============================================================
# TeachAny Publish Orchestrator · 自动选择推送路径
# ============================================================
# Agent 制作课件后应调用本脚本（Phase 4 默认入口）：
#   - 能 SSH/GH_TOKEN push → auto-publish.sh（直推 courseware main）
#   - 否则 → publish_course.sh（Worker PR，无需凭据）
#
# 用法:
#   bash teachany-publish.sh <course-id>
#   bash teachany-publish.sh <course-id> --course-dir /path/to/community/foo
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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

COURSEWARE_REPO="${TEACHANY_COURSEWARE_REPO:-$HOME/CodeBuddy/一次函数/teachany-courseware}"
[ -z "$COURSE_DIR" ] && COURSE_DIR="$COURSEWARE_REPO/community/$COURSE_ID"

if [ -z "$COURSE_ID" ]; then
  echo "用法: $0 <course-id> [--course-dir PATH] [extra flags]"
  exit 1
fi

if [ "${TEACHANY_UPLOAD_CONFIRMED:-}" != "1" ]; then
  echo ""
  echo "❌ Phase 3.5b：发布前必须征得用户同意上传。"
  echo "   请先完成 phases/phase3-5-gates.md 中的询问，再执行："
  echo "   TEACHANY_UPLOAD_CONFIRMED=1 bash \"$0\" $COURSE_ID"
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
  echo "✅ 检测到 GitHub push 权限 → auto-publish（rebuild-index + 挂树 + 限定 commit）"
  exec bash "$SCRIPT_DIR/auto-publish.sh" "$COURSE_ID" "${EXTRA[@]}"
else
  echo "ℹ️  无 push 权限 → publish_course（Worker PR）"
  exec bash "$SCRIPT_DIR/publish_course.sh" "$COURSE_DIR" "$COURSE_ID" "${EXTRA[@]}"
fi
