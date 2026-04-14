# TeachAny 一键自动安装脚本（国内版 - Windows）
# 适用系统：Windows 10/11（PowerShell 5.1+）
# 用途：自动从 Gitee 下载并安装到 CodeBuddy

# 要求管理员权限（可选，根据安装位置决定）
# Requires -RunAsAdministrator

# 配置项
$GiteeURL = "https://gitee.com/wepon/teachany-opensource/repository/archive/main.zip"
$InstallDir = "$env:USERPROFILE\.agents\skills\teachany-opensource"
$TempDir = "$env:TEMP\teachany-install-$(Get-Random)"

# 颜色函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Header {
    Write-Host ""
    Write-ColorOutput "==========================================" "Cyan"
    Write-ColorOutput "  TeachAny 一键安装脚本（国内版）" "Cyan"
    Write-ColorOutput "==========================================" "Cyan"
    Write-Host ""
}

function Write-Step {
    param([string]$Step, [string]$Message)
    Write-ColorOutput "[$Step] $Message..." "Yellow"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✓ $Message" "Green"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "✗ 错误：$Message" "Red"
}

# 主函数
function Main {
    Write-Header
    
    try {
        # 步骤1：检查 PowerShell 版本
        Write-Step "1/5" "检查系统环境"
        $PSVersion = $PSVersionTable.PSVersion
        if ($PSVersion.Major -lt 5) {
            Write-Error "PowerShell 版本过低（当前：$PSVersion），需要 5.1 或更高版本"
            Write-Host "请访问 https://aka.ms/powershell 下载最新版本"
            exit 1
        }
        Write-Success "PowerShell 版本检查通过（$PSVersion）"
        
        # 步骤2：创建临时目录
        Write-Step "2/5" "准备安装环境"
        New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
        Write-Success "临时目录已创建：$TempDir"
        
        # 步骤3：从 Gitee 下载 ZIP
        Write-Step "3/5" "从 Gitee 下载代码（国内高速）"
        $ZipPath = Join-Path $TempDir "teachany.zip"
        
        # 下载文件（带进度条）
        $ProgressPreference = 'SilentlyContinue'  # 隐藏进度条以提高速度
        Invoke-WebRequest -Uri $GiteeURL -OutFile $ZipPath -UseBasicParsing
        $ProgressPreference = 'Continue'
        
        Write-Success "代码下载成功（$(((Get-Item $ZipPath).Length / 1MB).ToString('0.00')) MB）"
        
        # 步骤4：解压文件
        Write-Step "4/5" "解压并安装到 CodeBuddy"
        
        # 解压
        Expand-Archive -Path $ZipPath -DestinationPath $TempDir -Force
        
        # Gitee 下载的 ZIP 解压后会有一个子目录
        $ExtractedDir = Get-ChildItem -Path $TempDir -Directory | Where-Object { $_.Name -like "teachany-opensource-*" } | Select-Object -First 1
        
        if (-not $ExtractedDir) {
            Write-Error "解压后未找到预期的目录结构"
            exit 1
        }
        
        # 创建安装目录（如果不存在）
        $InstallParentDir = Split-Path -Parent $InstallDir
        if (-not (Test-Path $InstallParentDir)) {
            New-Item -ItemType Directory -Path $InstallParentDir -Force | Out-Null
        }
        
        # 如果已存在旧版本，备份
        if (Test-Path $InstallDir) {
            $BackupDir = "$InstallDir.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
            Move-Item -Path $InstallDir -Destination $BackupDir -Force
            Write-Success "已备份旧版本到：$BackupDir"
        }
        
        # 复制文件到安装目录
        Copy-Item -Path $ExtractedDir.FullName -Destination $InstallDir -Recurse -Force
        Write-Success "已安装到：$InstallDir"
        
        # 步骤5：清理临时文件
        Write-Step "5/5" "清理临时文件"
        Remove-Item -Path $TempDir -Recurse -Force
        Write-Success "临时文件已清理"
        
        # 安装完成
        Write-Host ""
        Write-ColorOutput "==========================================" "Green"
        Write-ColorOutput "  ✨ 安装完成！" "Green"
        Write-ColorOutput "==========================================" "Green"
        Write-Host ""
        Write-Host "📂 安装位置：$InstallDir"
        Write-Host ""
        Write-Host "📚 包含的教学数据："
        Write-Host "  - 数学、物理、化学、生物（理科）"
        Write-Host "  - 历史、地理、语文（人文学科）"
        Write-Host "  - 共 178+ 条高质量教学素材"
        Write-Host ""
        Write-Host "🚀 下一步："
        Write-Host "  1. 打开 CodeBuddy 应用"
        Write-Host "  2. 在设置中刷新 Skills 列表"
        Write-Host "  3. 输入 /teachany 开始使用"
        Write-Host ""
        Write-Host "📖 使用教程："
        Write-Host "  $InstallDir\INSTALL_CN.md"
        Write-Host ""
        Write-Host "❓ 遇到问题？"
        Write-Host "  - Gitee Issues: https://gitee.com/wepon/teachany-opensource/issues"
        Write-Host "  - 微信交流群：[扫码加入]"
        Write-Host ""
        
        # 询问是否打开安装目录
        Write-Host "按任意键打开安装目录，或按 Ctrl+C 退出..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        Start-Process explorer.exe $InstallDir
        
    } catch {
        Write-Error "安装过程中发生错误：$($_.Exception.Message)"
        Write-Host ""
        Write-Host "请尝试以下解决方案："
        Write-Host "  1. 检查网络连接是否正常"
        Write-Host "  2. 关闭防火墙或杀毒软件后重试"
        Write-Host "  3. 手动从 Gitee 下载 ZIP 并解压安装"
        Write-Host "     https://gitee.com/wepon/teachany-opensource"
        Write-Host ""
        
        # 清理临时文件
        if (Test-Path $TempDir) {
            Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        exit 1
    }
}

# 执行主函数
Main
