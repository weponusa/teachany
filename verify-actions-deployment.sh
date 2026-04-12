#!/bin/bash
# 验证 GitHub Actions 部署状态

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║        检查 GitHub Actions 部署状态                               ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# 检查 Pages 配置
echo "🔍 检查 Pages 配置..."
PAGES_INFO=$(gh api repos/weponusa/teachany/pages 2>&1)

if [ $? -ne 0 ]; then
  echo "❌ 无法获取 Pages 信息"
  exit 1
fi

BUILD_TYPE=$(echo "$PAGES_INFO" | python3 -c "import json,sys; print(json.load(sys.stdin).get('build_type', 'unknown'))" 2>/dev/null)
STATUS=$(echo "$PAGES_INFO" | python3 -c "import json,sys; print(json.load(sys.stdin).get('status', 'unknown'))" 2>/dev/null)

echo "【Pages 配置】"
echo "  构建类型: $BUILD_TYPE"
echo "  状态: $STATUS"
echo ""

if [ "$BUILD_TYPE" == "workflow" ]; then
  echo "✅ Pages 已切换到 GitHub Actions!"
  echo ""
  
  # 检查最新的 workflow runs
  echo "🔍 检查最新的部署记录..."
  echo ""
  
  gh run list --workflow=deploy-pages.yml --limit 5 --json status,conclusion,createdAt,displayTitle | \
    python3 -c "
import json, sys
runs = json.load(sys.stdin)
if not runs:
    print('⚠️  还没有 workflow 运行记录')
    print('   可能需要手动触发: gh workflow run deploy-pages.yml')
else:
    print(f'找到 {len(runs)} 条部署记录:\n')
    for i, run in enumerate(runs, 1):
        status = run['status']
        conclusion = run.get('conclusion', '')
        time = run['createdAt'][:19].replace('T', ' ')
        title = run['displayTitle']
        
        if status == 'completed':
            if conclusion == 'success':
                icon = '✅'
                status_text = '成功'
            else:
                icon = '❌'
                status_text = f'失败 ({conclusion})'
        else:
            icon = '🔄'
            status_text = '运行中'
        
        print(f'{i}. {icon} {status_text} - {time}')
        print(f'   {title}')
        print()
    
    # 检查最新一次
    latest = runs[0]
    if latest['status'] == 'completed' and latest['conclusion'] == 'success':
        print('═══════════════════════════════════════════════════════════════════')
        print('🎉 最新部署成功!')
        print()
        print('📍 访问网站: https://weponusa.github.io/teachany/')
        print('💡 建议: 使用无痕模式 (Cmd+Shift+N) 避免缓存')
        print('═══════════════════════════════════════════════════════════════════')
    elif latest['status'] == 'completed':
        print('❌ 最新部署失败!')
        print('🔧 查看详细日志: gh run view --log')
    else:
        print('🔄 部署正在进行中...')
        print('⏱️  请等待 1-2 分钟后重新运行此脚本')
"
  
elif [ "$BUILD_TYPE" == "legacy" ]; then
  echo "⚠️  Pages 仍在使用 legacy (Jekyll) 构建方式"
  echo ""
  echo "请按以下步骤切换:"
  echo "  1. 访问: https://github.com/weponusa/teachany/settings/pages"
  echo "  2. Source 下拉菜单选择: GitHub Actions"
  echo "  3. 等待 1-2 分钟后重新运行此脚本"
else
  echo "⚠️  未知的构建类型: $BUILD_TYPE"
fi

echo ""
