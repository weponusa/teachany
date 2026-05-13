#!/usr/bin/env bash
# =============================================================================
# pre-commit-courseware.sh（v7.9.13）
# commit 前课件四项质检:
#   1) validate-courseware.py
#   2) check-plan.py (PLAN.md + 模块级媒体策划表)
#   3) batch-quality-check.py (五件套体检)
#   4) check-knowledge-graph.py (知识图谱公共模块合规 — v7.9.13 新增)
#
# 紧急绕过开关: TEACHANY_SKIP_PRECOMMIT=1
# =============================================================================

set -u  # 不设 -e：我们手动管理退出码以便打印清晰日志

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT" || exit 0

# --- 紧急绕过开关 ---
if [ "${TEACHANY_SKIP_PRECOMMIT:-0}" = "1" ]; then
  echo ""
  echo "⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️"
  echo "⚠️  TEACHANY_SKIP_PRECOMMIT=1 已绕过课件质检"
  echo "⚠️  这是紧急开关，不得作为常规操作使用"
  echo "⚠️  违反硬规则 #69 (v7.9.13)"
  echo "⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️"
  echo ""
  exit 0
fi

# --- 收集 staged 区的课件目录 ---
CHANGED_DIRS=$(git diff --cached --name-only \
  | grep -E '^(community|examples)/[^/]+/' \
  | grep -vE '^community/(drafts|pending|archive)/' \
  | awk -F'/' '{print $1 "/" $2}' \
  | sort -u)

if [ -z "$CHANGED_DIRS" ]; then
  # 没有课件变更，直接放行
  exit 0
fi

echo ""
echo "🔒 pre-commit-courseware (v7.9.13) —— 本次 commit 涉及以下课件："
echo "$CHANGED_DIRS" | sed 's/^/   - /'
echo ""

FAIL_DIRS=()

for DIR in $CHANGED_DIRS; do
  # pending/ 是提交队列，不是课件本体；里面只有 .json/.teachany/.gitkeep，不跑四项课件质检。
  if [ "$DIR" = "community/pending" ]; then
    echo "  ↪️  $DIR 是社区提交队列，跳过课件四项质检"
    continue
  fi

  # 跳过已被删除的目录
  if [ ! -d "$DIR" ]; then
    continue
  fi

  # v7.10.4：旧课件迁移后的轻量 redirect stub 不是课件本体，不跑四项课件质检。
  # 判定标准：跳转页 index.html 明确跳转到 teachany-courseware；manifest 可保留用于 registry 重建。
  if [ -f "$DIR/index.html" ] \
    && grep -q "TeachAny 课件已迁移" "$DIR/index.html" \
    && grep -q "weponusa.github.io/teachany-courseware" "$DIR/index.html"; then
    echo "  ↪️  $DIR 是旧 URL 轻量跳转页，跳过课件四项质检"
    continue
  fi

  echo "───────────────────────────────────────────────"
  echo "📂 质检: $DIR"
  echo "───────────────────────────────────────────────"

  FAILED=0

  # 1) validate-courseware.py —— 若存在才跑
  if [ -f "scripts/validate-courseware.py" ]; then
    echo "  [1/4] validate-courseware.py ..."
    if ! python3 scripts/validate-courseware.py "$DIR" >/tmp/pre-commit-vcw.log 2>&1; then
      echo "      ❌ validate-courseware.py 失败"
      tail -20 /tmp/pre-commit-vcw.log | sed 's/^/        /'
      FAILED=1
    else
      echo "      ✅ validate-courseware.py 通过"
    fi
  else
    echo "  [1/4] validate-courseware.py 未安装，跳过"
  fi

  # 2) check-plan.py —— PLAN.md 硬校验（v7.9.11 核心）
  if [ -f "scripts/check-plan.py" ]; then
    echo "  [2/4] check-plan.py ..."
    if ! python3 scripts/check-plan.py "$DIR" >/tmp/pre-commit-plan.log 2>&1; then
      echo "      ❌ check-plan.py 失败（PLAN.md 不合规）"
      cat /tmp/pre-commit-plan.log | sed 's/^/        /'
      FAILED=1
    else
      echo "      ✅ check-plan.py 通过（PLAN.md 合规）"
    fi
  else
    echo "  [2/4] check-plan.py 未安装，跳过（WARNING: v7.9.11 强烈建议安装）"
  fi

  # 3) batch-quality-check.py —— 五件套体检
  if [ -f "scripts/batch-quality-check.py" ]; then
    echo "  [3/4] batch-quality-check.py ..."
    if ! python3 scripts/batch-quality-check.py "$DIR" >/tmp/pre-commit-bqc.log 2>&1; then
      echo "      ❌ batch-quality-check.py 失败"
      tail -20 /tmp/pre-commit-bqc.log | sed 's/^/        /'
      FAILED=1
    else
      echo "      ✅ batch-quality-check.py 通过"
    fi
  else
    echo "  [3/4] batch-quality-check.py 未安装，跳过"
  fi

  # 4) check-knowledge-graph.py —— 知识图谱公共模块合规（v7.9.13 新增）
  if [ -f "scripts/check-knowledge-graph.py" ]; then
    echo "  [4/4] check-knowledge-graph.py ..."
    if ! python3 scripts/check-knowledge-graph.py "$DIR" >/tmp/pre-commit-kg.log 2>&1; then
      echo "      ❌ check-knowledge-graph.py 失败（知识图谱绕过公共模块）"
      cat /tmp/pre-commit-kg.log | sed 's/^/        /'
      echo "        💡 修复指引："
      echo "           - 删除课件内手写的 <svg><rect>/<line>/<text> 图谱"
      echo "           - 改用 <div data-teachany-kg=\"<node_id>\"> + teachany-knowledge-graph.js"
      echo "           - node_id 必须存在于 scripts/teachany-kg-manifest.json"
      FAILED=1
    else
      echo "      ✅ check-knowledge-graph.py 通过（知识图谱走公共模块）"
    fi
  else
    echo "  [4/4] check-knowledge-graph.py 未安装，跳过（WARNING: v7.9.13 强烈建议安装）"
  fi

  if [ $FAILED -eq 1 ]; then
    FAIL_DIRS+=("$DIR")
  fi
  echo ""
done

# --- 汇总 ---
if [ ${#FAIL_DIRS[@]} -gt 0 ]; then
  echo "═══════════════════════════════════════════════"
  echo "❌ pre-commit 拦截（${#FAIL_DIRS[@]} 个课件未通过）"
  echo "═══════════════════════════════════════════════"
  for d in "${FAIL_DIRS[@]}"; do
    echo "   - $d"
  done
  echo ""
  echo "修复后重 commit；或紧急情况用："
  echo "   TEACHANY_SKIP_PRECOMMIT=1 git commit ..."
  echo "（不建议常规使用，违反硬规则 #69）"
  echo ""
  exit 1
fi

echo "═══════════════════════════════════════════════"
echo "✅ 四项质检全部通过，放行 commit"
echo "═══════════════════════════════════════════════"
exit 0
