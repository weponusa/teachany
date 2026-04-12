#!/bin/bash
# GitHub Pages 部署状态检查脚本

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║            检查 GitHub Pages 部署状态                             ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# 检查最新构建状态
echo "🔍 正在检查最新部署..."
BUILD_INFO=$(gh api repos/weponusa/teachany/pages/builds/latest 2>&1)

if [ $? -ne 0 ]; then
  echo "❌ 无法获取部署信息,请检查 gh CLI 是否已登录"
  echo "   运行: gh auth login"
  exit 1
fi

STATUS=$(echo "$BUILD_INFO" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])" 2>/dev/null)
COMMIT=$(echo "$BUILD_INFO" | python3 -c "import json,sys; print(json.load(sys.stdin)['commit'][:7])" 2>/dev/null)
CREATED=$(echo "$BUILD_INFO" | python3 -c "import json,sys; print(json.load(sys.stdin)['created_at'])" 2>/dev/null)
UPDATED=$(echo "$BUILD_INFO" | python3 -c "import json,sys; print(json.load(sys.stdin)['updated_at'])" 2>/dev/null)

echo "【部署信息】"
echo "  Commit:  $COMMIT"
echo "  创建时间: $CREATED"
echo "  更新时间: $UPDATED"
echo ""

case "$STATUS" in
  "built")
    echo "✅ 部署状态: 成功 (built)"
    echo ""
    echo "📍 访问地址: https://weponusa.github.io/teachany/"
    echo ""
    echo "💡 如果还看不到更新,请:"
    echo "   1. 硬刷新: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Win)"
    echo "   2. 清空缓存: F12 → Application → Clear site data"
    echo "   3. 无痕模式: Cmd+Shift+N 打开新窗口访问"
    ;;
  "building")
    echo "🔄 部署状态: 构建中 (building)"
    echo ""
    echo "⏱️  请等待 1-3 分钟,然后重新运行此脚本检查"
    echo ""
    echo "💡 或者先打开本地预览:"
    echo "   open index.html"
    ;;
  "errored")
    echo "❌ 部署状态: 失败 (errored)"
    echo ""
    echo "🔧 可能的原因:"
    echo "   1. 仓库设置问题"
    echo "   2. Pages 配置问题"
    echo "   3. 构建超时"
    echo ""
    echo "🛠️  解决方法:"
    echo "   1. 访问: https://github.com/weponusa/teachany/settings/pages"
    echo "   2. 检查 Source 是否设置为 main 分支"
    echo "   3. 尝试重新部署: git commit --allow-empty -m 'Trigger Pages rebuild' && git push"
    ;;
  *)
    echo "⚠️  部署状态: $STATUS (未知)"
    ;;
esac

echo ""
echo "═══════════════════════════════════════════════════════════════════"
