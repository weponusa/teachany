#!/usr/bin/env bash
# ============================================================
# TeachAny pre-push hook (v5.34.10)
# ------------------------------------------------------------
# 禁止"管理员直推课件"通道——任何 examples/<id>/ 下的课件，只能通过
# 以下两条通道之一进入仓库：
#
#   A) 用户侧 skill 上传（默认路径，绝大多数情况走这条）：
#        python3 scripts/submit-to-community.py <id>
#      → 走 Cloudflare Worker → PR → auto-merge，落在 community/
#
#   B) 管理员升级通道（未来由独立命令实现，不在本仓库内提供脚本）：
#      独立管理员 CLI 升级社区课件为官方课件时，应当在 commit message
#      末尾追加 Git trailer，格式为：
#          TeachAny-Promote: <course-id>
#      （可选附加：TeachAny-Promote-Reason: ...）
#      本 hook 检测到该 trailer 时放行；否则一律拒绝 push。
#
# 本 hook 会：
#   1. 找出本次 push 涉及的 examples/ 下的课件
#   2. 检查每个涉及课件的 commit 是否带 `TeachAny-Promote:` trailer
#      —— 没有 trailer 的课件变更 = 直推 = 拒绝
#   3. 对允许通过的课件仍然跑 validate-courseware.py（质检闸门）
#
# 安装方式（一次性，从仓库根目录）：
#   ln -sf ../../scripts/pre-push.sh .git/hooks/pre-push
#   chmod +x scripts/pre-push.sh
#
# 紧急绕过（仅用于非课件改动，如 README/CI 脚本修复）：
#   TEACHANY_SKIP_VALIDATE=1 git push
#   ⚠️  若本次 push 同时包含 examples/ 变更，本 hook 依然会拒绝——
#       这种"跳过质检"的 flag 只免除 validator，不免除"禁直推"铁律。
#
# 终极绕过（仅 repo owner 紧急 hotfix 用，强烈不推荐）：
#   TEACHANY_ADMIN_BYPASS=1 git push
#   会在控制台打印红色警告，提醒这次 push 已跳过所有护栏。
# ============================================================

set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# ── 终极绕过（慎用）──
if [ "$TEACHANY_ADMIN_BYPASS" = "1" ]; then
    echo ""
    echo "🚨 TEACHANY_ADMIN_BYPASS=1 已启用，跳过全部护栏（禁直推 + validator）"
    echo "   这次 push 不会被任何本地 hook 校验，请确认你在做 README/CI hotfix"
    echo ""
    exit 0
fi

# stdin 格式：<local ref> <local sha> <remote ref> <remote sha>
while read -r local_ref local_sha remote_ref remote_sha; do
    # 删除分支（local_sha=0000...）直接放行
    if [ "$local_sha" = "0000000000000000000000000000000000000000" ]; then
        continue
    fi

    # 新分支：比对 origin/main
    if [ "$remote_sha" = "0000000000000000000000000000000000000000" ]; then
        if git rev-parse --verify origin/main >/dev/null 2>&1; then
            base="origin/main"
        else
            base="$(git rev-list --max-parents=0 "$local_sha" | head -1)"
        fi
    else
        base="$remote_sha"
    fi

    # 找本次 push 改过的 examples/ 下的课件 id
    changed_courses=$(git diff --name-only "$base" "$local_sha" 2>/dev/null \
              | grep -E '^examples/[^/]+/' \
              | awk -F/ '{print $2}' \
              | sort -u \
              | grep -v '^_template$' \
              | grep -v '^$' || true)

    if [ -z "$changed_courses" ]; then
        # 没动课件，放行（README/CI 等改动无需 validator）
        continue
    fi

    echo ""
    echo "🔍 TeachAny pre-push hook v5.34.10: 检测到以下官方课件变更："
    echo "$changed_courses" | sed 's/^/   - examples\//'
    echo ""

    # ── 检查"禁止直推 examples/"规则 ──
    # 遍历每个课件，检查本次 push 的 commit 中是否有 TeachAny-Promote trailer
    direct_push_detected=0
    direct_push_list=""

    while IFS= read -r course_id; do
        [ -z "$course_id" ] && continue

        # 找出本次 push 中"改到该课件"的全部 commit
        commits_for_course=$(git log --format="%H" "$base..$local_sha" -- "examples/$course_id/" 2>/dev/null || true)

        if [ -z "$commits_for_course" ]; then
            continue
        fi

        # 其中是否至少有一个 commit 带 `TeachAny-Promote:` trailer
        promote_found=0
        while IFS= read -r sha; do
            [ -z "$sha" ] && continue
            # 看 commit message 里是否有 trailer（区分大小写以避免意外命中）
            if git log -1 --format="%B" "$sha" 2>/dev/null \
                | grep -E '^TeachAny-Promote:\s+' >/dev/null 2>&1; then
                promote_found=1
                break
            fi
            # 另一条放行通道：bot 直接在 PR 里合并（auto-merge / admin-promote workflow）
            # 这类 commit 的 author 是 github-actions[bot]
            author=$(git log -1 --format="%an" "$sha" 2>/dev/null || echo "")
            if [ "$author" = "github-actions[bot]" ]; then
                promote_found=1
                break
            fi
        done <<< "$commits_for_course"

        if [ "$promote_found" = "0" ]; then
            direct_push_detected=1
            direct_push_list="$direct_push_list$course_id\n"
        fi
    done <<< "$changed_courses"

    if [ "$direct_push_detected" = "1" ]; then
        echo "❌ 禁止直推 examples/ 官方课件（v5.34.10 新规则）"
        echo ""
        echo "以下课件的本次变更没有 \`TeachAny-Promote:\` commit trailer，"
        echo "也不是由 github-actions[bot] 产生——视为管理员直推，已拒绝："
        echo ""
        echo -e "$direct_push_list" | sed '/^$/d' | sed 's/^/   - examples\//'
        echo ""
        echo "正确的通道："
        echo ""
        echo "  ● 作为内容创作者（默认）："
        echo "      python3 scripts/submit-to-community.py <course-id>"
        echo "    该脚本会把课件 POST 给 Worker → 自动建 PR → 质检通过后自动"
        echo "    合并到 community/，而非 examples/。"
        echo ""
        echo "  ● 作为管理员（把社区课件升级为官方课件）："
        echo "    未来会有独立的管理员 CLI 命令完成此动作；该命令会自动在"
        echo "    commit message 末尾写入："
        echo "        TeachAny-Promote: <course-id>"
        echo "    trailer，本 hook 识别到即放行。当前仓库未内置该脚本，请勿"
        echo "    手动 push 到 examples/。"
        echo ""
        echo "紧急绕过（仅 owner、仅 hotfix）："
        echo "      TEACHANY_ADMIN_BYPASS=1 git push"
        echo ""
        exit 1
    fi

    # ── 放行后仍然跑 validator ──
    if [ "$TEACHANY_SKIP_VALIDATE" = "1" ]; then
        echo "⚠️  TEACHANY_SKIP_VALIDATE=1 已启用，跳过 validator 检查"
        continue
    fi

    ids=$(echo "$changed_courses" | tr '\n' ' ')
    if ! python3 scripts/validate-courseware.py $ids 2>&1; then
        echo ""
        echo "❌ validate-courseware.py 校验失败，push 被拒绝"
        echo ""
        echo "修复建议："
        echo "   1. 按上面报错列表修复课件（补 manifest / 补音频 / 补图 / 改 node_id）"
        echo "   2. 确认 python3 scripts/validate-courseware.py <id> 输出 0 错误"
        echo "   3. 或改走社区自动提交流程：python3 scripts/submit-to-community.py <id>"
        echo ""
        exit 1
    fi

    echo "✅ 所有课件质检通过，允许 push"
done

exit 0
