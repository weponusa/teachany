#!/usr/bin/env bash
# ============================================================
# TeachAny Auto-Publish · v2.0 (单仓库版)
# ============================================================
# 课件做完后的标准发布流程：
#   1. 验证课件目录
#   2. rebuild-index（注册 + 挂知识树）
#   3. git add / commit / push
#   4. 验证线上 URL
#
# 使用方法：
#   bash auto-publish.sh <course-id> [<repo-path>]
#
# 默认路径：~/CodeBuddy/一次函数/teachany-opensource
# ============================================================

set -e

COURSE_ID="${1:-}"
REPO="${2:-$HOME/CodeBuddy/一次函数/teachany-opensource}"

if [ -z "$COURSE_ID" ]; then
  echo "用法: $0 <course-id> [repo-path]"
  echo "例:   $0 hist-m-greece-rome"
  exit 1
fi

COURSE_DIR="$REPO/community/$COURSE_ID"

echo "═══════════════════════════════════════════════"
echo "  TeachAny Auto-Publish v2.0 · 单仓库"
echo "═══════════════════════════════════════════════"
echo "  Course ID: $COURSE_ID"
echo "  Repo:      $REPO"
echo "  Dir:       $COURSE_DIR"
echo

# ──────────────────────────────────────────────────
# Step 1: 验证课件目录和必要文件
# ──────────────────────────────────────────────────
echo "[1/4] 验证课件目录..."

if [ ! -d "$COURSE_DIR" ]; then
  echo "  ❌ 课件目录不存在: $COURSE_DIR"
  exit 1
fi

MISSING=""
[ ! -f "$COURSE_DIR/index.html" ]    && MISSING="$MISSING index.html"
[ ! -f "$COURSE_DIR/manifest.json" ] && MISSING="$MISSING manifest.json"

if [ -n "$MISSING" ]; then
  echo "  ❌ 缺少必要文件:$MISSING"
  exit 1
fi

# 检查 index.html 不是 redirect 页
if grep -q "location.replace" "$COURSE_DIR/index.html" 2>/dev/null; then
  HTML_SIZE=$(wc -c < "$COURSE_DIR/index.html")
  if [ "$HTML_SIZE" -lt 2000 ]; then
    echo "  ❌ index.html 是 redirect 页面，不是真实课件内容"
    echo "  💡 请先把完整课件内容写入 community/$COURSE_ID/index.html"
    exit 1
  fi
fi

# 检查 teachany-node meta
if ! grep -q 'teachany-node' "$COURSE_DIR/index.html" 2>/dev/null; then
  echo "  ⚠️  index.html 缺少 <meta name=\"teachany-node\"> 标签，知识树挂载可能失败"
fi

echo "  ✅ 课件目录验证通过"
echo

# ──────────────────────────────────────────────────
# Step 2: rebuild-index（注册 + 挂知识树）
# ──────────────────────────────────────────────────
echo "[2/4] rebuild-index（注册课件 + 挂载知识树）..."
cd "$REPO"

if python3 scripts/rebuild-index.py 2>&1 | tee /tmp/rebuild_out.txt | tail -8 | sed 's/^/    /'; then
  # 检查新课件是否成功挂树
  if grep -q "$COURSE_ID" /tmp/rebuild_out.txt; then
    grep "$COURSE_ID" /tmp/rebuild_out.txt | sed 's/^/    /'
  fi
  # 检查是否还有"未被知识树引用"的警告
  if grep -q "文件存在但知识树未引用" /tmp/rebuild_out.txt; then
    grep -A3 "文件存在但知识树未引用" /tmp/rebuild_out.txt | sed 's/^/    ⚠️  /'
    echo "  ℹ️  如果上面包含 $COURSE_ID，请检查 manifest.json 的 node_id 是否在知识树中"
  fi
  echo "  ✅ rebuild-index 完成"
else
  echo "  ❌ rebuild-index 失败"
  exit 1
fi
echo

# ──────────────────────────────────────────────────
# Step 3: git commit + push
# ──────────────────────────────────────────────────
echo "[3/4] git commit + push..."
cd "$REPO"

# 检查是否有变更
if [ -z "$(git status --short)" ]; then
  echo "  ⏭️  没有变更，跳过推送"
else
  git add -A
  CHANGES=$(git status --cached --short | wc -l | tr -d ' ')
  echo "  📝 $CHANGES 个文件变更"

  # commit（不绕过 pre-commit，让质检正常跑）
  if git commit -m "feat: 新增课件 $COURSE_ID"; then
    echo "  ✅ commit 成功"
  else
    echo "  ⚠️  commit 失败，可能需要检查 PLAN.md 格式"
    exit 1
  fi

  # push origin（先检测认证，再 push）
  echo "  📤 push origin..."

  # ── 认证检测 & 自动配置 ───────────────────────────────
  # 优先级：SSH → GH_TOKEN 环境变量 → HTTPS 凭据缓存
  _can_push=false

  # 1. 检测 SSH
  if ssh -T git@github.com -o BatchMode=yes -o ConnectTimeout=5 2>&1 | grep -q "successfully authenticated"; then
    _can_push=true
    echo "  🔑 SSH 认证 OK"
  # 2. 检测 GH_TOKEN 环境变量（CI / CodeBuddy agent 场景）
  elif [ -n "$GH_TOKEN" ]; then
    _owner_repo=$(git remote get-url origin | sed 's|.*github.com[:/]\(.*\)\.git|\1|')
    git remote set-url origin "https://x-access-token:${GH_TOKEN}@github.com/${_owner_repo}.git"
    _can_push=true
    echo "  🔑 GH_TOKEN 认证 OK"
  # 3. 检测 HTTPS 凭据缓存（本地已登录 gh cli 或 credential helper）
  elif git ls-remote origin HEAD &>/dev/null 2>&1; then
    _can_push=true
    echo "  🔑 HTTPS 凭据缓存 OK"
  fi

  if ! $_can_push; then
    echo ""
    echo "  ❌ 当前环境没有 GitHub 推送权限，课件已 commit 但未推送。"
    echo ""
    echo "  📋 三种解决方式（任选其一）："
    echo ""
    echo "  ① 设置 GH_TOKEN 后重跑（推荐 CI/agent 环境）："
    echo "     export GH_TOKEN=<your_github_pat>"
    echo "     bash \"$0\" $COURSE_ID"
    echo ""
    echo "  ② 在有认证的机器上 pull 再 push："
    echo "     git pull origin main   # 在本地 Mac 执行"
    echo "     git push origin main"
    echo ""
    echo "  ③ 配置 HTTPS credential helper（一次性）："
    echo "     git config --global credential.helper store"
    echo "     echo \"https://<user>:<pat>@github.com\" >> ~/.git-credentials"
    echo ""
    echo "  本次 commit hash: $(git rev-parse HEAD)"
    exit 1
  fi

  if ! git push origin main 2>&1; then
    echo "  🔄 push 失败，尝试 pull --rebase..."
    if git pull origin main --rebase && git push origin main; then
      echo "  ✅ rebase 后推送成功"
    else
      echo "  ❌ push 失败"
      exit 1
    fi
  else
    echo "  ✅ origin 推送成功"
  fi

  # push gitee（可选，失败不阻断）
  echo "  📤 push gitee（可选）..."
  if GIT_SSH_COMMAND='ssh -p 22 -o BatchMode=yes -o ConnectTimeout=10' \
     git push gitee main 2>&1 | tail -2; then
    echo "  ✅ gitee 推送成功"
  else
    echo "  ⚠️  gitee 推送失败（网络/DNS），不影响 GitHub Pages"
  fi
fi
echo

# ──────────────────────────────────────────────────
# Step 4: 验证线上 URL（等待 Pages 部署）
# ──────────────────────────────────────────────────
echo "[4/4] 验证线上 URL..."
COURSE_URL="https://weponusa.github.io/teachany/community/$COURSE_ID/"
GALLERY_URL="https://weponusa.github.io/teachany/"

echo "  ⏳ 等待 GitHub Actions 部署（60秒）..."
sleep 60

CODE=$(curl -sI -L --max-time 10 "$COURSE_URL" 2>/dev/null | head -1 | grep -oE "[0-9]{3}" | head -1)
if [ "$CODE" = "200" ]; then
  echo "  ✅ 课件页面可访问 (HTTP 200)"
else
  echo "  ⚠️  HTTP $CODE（可能 Pages 还在部署，稍后再刷新）"
fi

echo
echo "═══════════════════════════════════════════════"
echo "  ✅ 发布完成！"
echo "  📚 课件 URL:  $COURSE_URL"
echo "  📋 Gallery:  $GALLERY_URL"
echo "  🌳 tree.html: https://weponusa.github.io/teachany/tree.html"
echo "═══════════════════════════════════════════════"
