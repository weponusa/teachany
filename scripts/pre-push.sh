#!/usr/bin/env bash
# ============================================================
# TeachAny pre-push hook (v5.34.9.2)
# ------------------------------------------------------------
# 防止直接 git push 绕过 validate-courseware.py 质检。
# 本 hook 会：
#   1. 找出本次 push 涉及的 examples/ 下的课件
#   2. 对每个课件跑 validate-courseware.py
#   3. 0 错误才放行；有任何错误则拒绝 push
#
# 安装方式（一次性）：
#   ln -sf ../../scripts/pre-push.sh .git/hooks/pre-push
#
# 绕过方式（管理员紧急修复用）：
#   TEACHANY_SKIP_VALIDATE=1 git push
#   （强烈建议仅在 README 修复等非课件 push 时用）
# ============================================================

set -e

# 允许紧急绕过
if [ "$TEACHANY_SKIP_VALIDATE" = "1" ]; then
    echo "⚠️  TEACHANY_SKIP_VALIDATE=1 已启用，跳过 validator 检查"
    exit 0
fi

# 仓库根目录
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# 找出本次 push 涉及的 examples/ 课件
# stdin 格式：<local ref> <local sha> <remote ref> <remote sha>
while read -r local_ref local_sha remote_ref remote_sha; do
    # 删除分支（local_sha=0000...）直接放行
    if [ "$local_sha" = "0000000000000000000000000000000000000000" ]; then
        continue
    fi

    # 新分支：比对 origin/main
    if [ "$remote_sha" = "0000000000000000000000000000000000000000" ]; then
        base="origin/main"
    else
        base="$remote_sha"
    fi

    # 找本次 push 改过的 examples/ 下的课件 id
    changed=$(git diff --name-only "$base" "$local_sha" 2>/dev/null \
              | grep -E '^examples/[^/]+/' \
              | awk -F/ '{print $2}' \
              | sort -u \
              | grep -v '^_template$' \
              | grep -v '^$' || true)

    if [ -z "$changed" ]; then
        # 没动课件，放行
        continue
    fi

    echo ""
    echo "🔍 TeachAny pre-push hook: 检测到以下课件变更："
    echo "$changed" | sed 's/^/   - /'
    echo ""

    # 跑 validator
    ids=$(echo "$changed" | tr '\n' ' ')
    if ! python3 scripts/validate-courseware.py $ids 2>&1; then
        echo ""
        echo "❌ validate-courseware.py 校验失败，push 被拒绝"
        echo ""
        echo "修复建议："
        echo "   1. 按上面报错列表修复课件（补 manifest / 补音频 / 补图 / 改 node_id）"
        echo "   2. 确认 python3 scripts/validate-courseware.py <id> 输出 0 错误"
        echo "   3. 或改走社区自动提交流程：python3 scripts/submit-to-community.py <id>"
        echo ""
        echo "紧急绕过（仅非课件 push 时用）："
        echo "   TEACHANY_SKIP_VALIDATE=1 git push"
        echo ""
        exit 1
    fi

    echo "✅ 所有课件质检通过，允许 push"
done

exit 0
