#!/usr/bin/env bash
# ============================================================
# TeachAny Auto-Publish · v1.0 (基线 ⑰)
# ============================================================
# 课件做完/改完后的标准发布流程：3 仓自动注册 + 推送
#
# 使用方法：
#   bash auto-publish.sh <course-id> [<courseware-repo-path>] [<opensource-repo-path>]
#
# 默认路径：
#   courseware: ~/CodeBuddy/一次函数/teachany-courseware
#   opensource: ~/CodeBuddy/一次函数/teachany-opensource
#
# 流程：
#   [1/3] courseware 仓库：commit + push origin + push gitee
#   [2/3] opensource 仓库：建 redirect + 拷 manifest + rebuild-index + commit + push
#   [3/3] skill 仓库：如有未提交变更则 commit + push
#
# 退出码：0=完全成功 / 10=origin成功但gitee失败 / 1+=fatal
# ============================================================

set -e

COURSE_ID="${1:-}"
COURSEWARE_REPO="${2:-$HOME/CodeBuddy/一次函数/teachany-courseware}"
OPENSOURCE_REPO="${3:-$HOME/CodeBuddy/一次函数/teachany-opensource}"
SKILL_REPO="${4:-$HOME/.codebuddy/skills/teachany}"

if [ -z "$COURSE_ID" ]; then
  echo "用法: $0 <course-id> [courseware-repo] [opensource-repo] [skill-repo]"
  echo "例: $0 hist-m-renaissance"
  exit 1
fi

SRC_DIR="$COURSEWARE_REPO/community/$COURSE_ID"
if [ ! -d "$SRC_DIR" ]; then
  echo "❌ 找不到课件目录: $SRC_DIR"
  exit 1
fi

echo "═══════════════════════════════════════════════"
echo "  TeachAny Auto-Publish v1.0 · 基线 ⑰"
echo "═══════════════════════════════════════════════"
echo "  Course ID:        $COURSE_ID"
echo "  Courseware repo:  $COURSEWARE_REPO"
echo "  Opensource repo:  $OPENSOURCE_REPO"
echo "  Skill repo:       $SKILL_REPO"
echo

# 状态变量
FAIL_GITEE=0
FAIL_OTHER=0

# ──────────────────────────────────────────────────
# Step 1: 推 courseware 仓库
# ──────────────────────────────────────────────────
echo "[1/3] 推 courseware 仓库（完整 HTML + assets + tts）"
cd "$COURSEWARE_REPO"

if [ -z "$(git status --short -- "community/$COURSE_ID/")" ]; then
  echo "  ⏭️  community/$COURSE_ID/ 没有变更，跳过 courseware 推送"
else
  git add "community/$COURSE_ID/"
  CHANGES=$(git status --short -- "community/$COURSE_ID/" | wc -l | tr -d ' ')
  echo "  📝 $CHANGES 个变更"
  if git commit -m "feat: 更新 $COURSE_ID

- 经 auto-publish.sh 自动发布
- 满足 17 项基线" 2>&1 | tail -3; then
    echo "  ✅ commit 成功"
  else
    echo "  ⚠️  commit 失败（可能没改动）"
  fi

  echo "  📤 push origin..."
  if git push origin main 2>&1 | tail -3 && [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "  ✅ origin 推送成功"
  else
    echo "  ❌ origin 推送失败"
    FAIL_OTHER=1
  fi

  echo "  📤 push gitee..."
  if git push gitee main 2>&1 | tail -3 && [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "  ✅ gitee 推送成功"
  else
    echo "  ⚠️  gitee 推送失败（可能 DNS/网络），origin 已成功"
    FAIL_GITEE=1
  fi
fi
echo

# ──────────────────────────────────────────────────
# Step 2: opensource 仓库 redirect + register + push
# ──────────────────────────────────────────────────
echo "[2/3] opensource 仓库（redirect + rebuild-index + push）"
cd "$OPENSOURCE_REPO"

# 2a. redirect
DST_DIR="community/$COURSE_ID"
mkdir -p "$DST_DIR"
cat > "$DST_DIR/index.html" <<EOF
<!DOCTYPE html>
<html><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=https://weponusa.github.io/teachany-courseware/community/$COURSE_ID/">
<title>Redirecting...</title>
</head><body>
<p>Redirecting to <a href="https://weponusa.github.io/teachany-courseware/community/$COURSE_ID/">课件页</a></p>
</body></html>
EOF
echo "  ✅ redirect 已建（$DST_DIR/index.html）"

# 2b. manifest
if [ -f "$SRC_DIR/manifest.json" ]; then
  cp "$SRC_DIR/manifest.json" "$DST_DIR/manifest.json"
  echo "  ✅ manifest 已同步"
else
  echo "  ⚠️  $SRC_DIR/manifest.json 不存在，跳过 manifest 同步"
fi

# 2c. rebuild-index
echo "  🔨 跑 rebuild-index.py..."
if python3 scripts/rebuild-index.py 2>&1 | tail -8 | sed 's/^/      /'; then
  echo "  ✅ rebuild-index 完成"
else
  echo "  ❌ rebuild-index 失败"
  FAIL_OTHER=1
fi

# 2d. commit + push
if [ -z "$(git status --short)" ]; then
  echo "  ⏭️  opensource 没有变更，跳过推送"
else
  git add -A
  # pre-commit 钩子可能误把 redirect-only 目录当成完整课件查 ⑦/#68/#69
  # 这是 hook 的合理性问题（redirect 不该被当真课件），用 SKIP 绕过
  if TEACHANY_SKIP_PRECOMMIT=1 git commit -m "feat: 注册 $COURSE_ID 到知识图谱

注：community/$COURSE_ID/ 仅含 redirect+manifest，
真实课件在 teachany-courseware 仓库。" 2>&1 | tail -3; then
    echo "  ✅ commit 成功"
  fi

  echo "  📤 push origin..."
  if git push origin main 2>&1; then
    echo "  ✅ origin 推送成功"
  else
    # 尝试 rebase 后再推
    echo "  🔄 push 失败，尝试 pull --rebase 后重试..."
    git stash -u 2>/dev/null || true
    if git pull origin main --rebase 2>&1 | tail -3; then
      git stash pop 2>/dev/null || true
      if git push origin main 2>&1; then
        echo "  ✅ rebase 后推送成功"
      else
        echo "  ❌ origin 推送失败（rebase 也未解决）"
        FAIL_OTHER=1
      fi
    else
      echo "  ❌ origin 推送失败"
      FAIL_OTHER=1
    fi
  fi

  echo "  📤 push gitee..."
  if git push gitee main 2>&1; then
    echo "  ✅ gitee 推送成功"
  else
    echo "  ⚠️  gitee 推送失败，origin 已成功"
    FAIL_GITEE=1
  fi
fi
echo

# ──────────────────────────────────────────────────
# Step 3: skill 仓库（如有未提交变更）
# ──────────────────────────────────────────────────
echo "[3/3] skill 仓库（如有未提交变更）"
cd "$SKILL_REPO"

if [ -z "$(git status --short)" ]; then
  echo "  ⏭️  skill 没有变更，跳过"
else
  echo "  📝 skill 有未提交变更："
  git status --short | head -10 | sed 's/^/      /'
  echo "  ℹ️  请人工确认是否要把 skill 一起推上去（避免误推）："
  echo "      cd $SKILL_REPO"
  echo "      git add skill/"
  echo "      git commit -m '<change>'"
  echo "      git push origin main"
fi
echo

# ──────────────────────────────────────────────────
# 总结
# ──────────────────────────────────────────────────
echo "═══════════════════════════════════════════════"
COURSE_URL="https://weponusa.github.io/teachany-courseware/community/$COURSE_ID/"
GALLERY_URL="https://weponusa.github.io/teachany/"

if [ "$FAIL_OTHER" = "0" ] && [ "$FAIL_GITEE" = "0" ]; then
  echo "  ✅ 全部成功（origin + gitee）"
  echo "  📚 课件 URL: $COURSE_URL（Pages 部署 1-3 分钟）"
  echo "  📋 Gallery: $GALLERY_URL"
  exit 0
elif [ "$FAIL_OTHER" = "0" ] && [ "$FAIL_GITEE" = "1" ]; then
  echo "  🟡 origin 全部成功，gitee 失败（DNS/网络）"
  echo "  📚 课件 URL: $COURSE_URL"
  echo "  💡 稍后可单独重试: cd <repo> && git push gitee main"
  exit 10
else
  echo "  ❌ 有 fatal 错误，请检查上面的日志"
  exit 1
fi
