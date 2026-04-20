#!/usr/bin/env bash
# ============================================================
# TeachAny bootstrap-tools.sh (v5.34.11, 2026-04-20)
# ------------------------------------------------------------
# 一键安装 TeachAny 课件制作所需的系统工具链。
# 先检测，再按需安装，尽量不打扰用户；安装失败不直接退出，
# 打印清晰的 fallback 建议让用户自助修复。
#
# 覆盖：
#   • Python 3.8+  + pip
#   • Node.js 20 LTS + npm
#   • ffmpeg（Remotion 渲染必需）
#   • cwebp（体积压缩）
#   • fonts-noto-cjk（Linux 下 Remotion 中文字幕）
#   • 关键 pip 包：edge-tts / python-pptx / Pillow / requests / bs4 /
#     pyyaml / beautifulsoup4
#
# 用法：
#   bash scripts/bootstrap-tools.sh
#   bash scripts/bootstrap-tools.sh --dry-run
#   bash scripts/bootstrap-tools.sh --python-only    # 不装 Node 相关
# ============================================================

set +u

DRY_RUN=0
PYTHON_ONLY=0

for a in "$@"; do
    case "$a" in
        --dry-run) DRY_RUN=1 ;;
        --python-only) PYTHON_ONLY=1 ;;
        -h|--help)
            sed -n '1,30p' "$0"; exit 0 ;;
    esac
done

# ── 颜色 ─────────────────────────────────────────────
if [ -t 1 ] && [ "${NO_COLOR:-}" = "" ]; then
    G=$'\033[92m'; Y=$'\033[93m'; R=$'\033[91m'; B=$'\033[94m'; BOLD=$'\033[1m'; END=$'\033[0m'
else
    G=""; Y=""; R=""; B=""; BOLD=""; END=""
fi
ok()   { echo "${G}✅${END} $*"; }
warn() { echo "${Y}⚠️ ${END} $*"; }
err()  { echo "${R}❌${END} $*"; }
info() { echo "${B}ℹ️ ${END} $*"; }
head() { echo ""; echo "${BOLD}${B}━━━ $* ━━━${END}"; }

run() {
    if [ "$DRY_RUN" = "1" ]; then
        info "[dry-run] $*"
        return 0
    fi
    "$@"
}

# ── OS 检测 ──────────────────────────────────────────
OS="unknown"
case "$(uname -s)" in
    Darwin) OS="macos" ;;
    Linux)
        if [ -f /etc/debian_version ]; then OS="debian"
        elif [ -f /etc/alpine-release ]; then OS="alpine"
        else OS="linux"; fi ;;
    MINGW*|MSYS*|CYGWIN*) OS="windows" ;;
esac
info "Detected OS: $OS"

# ── Homebrew（macOS 兜底） ──────────────────────────
ensure_brew() {
    if command -v brew >/dev/null 2>&1; then return 0; fi
    warn "Homebrew 未安装（macOS 推荐用 brew 装系统工具）"
    info "    安装命令（手动）： "
    echo '      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    return 1
}

# ── Python 3 ─────────────────────────────────────────
head "Python 3.8+"
if command -v python3 >/dev/null 2>&1; then
    PYV=$(python3 -c 'import sys; print(".".join(str(v) for v in sys.version_info[:3]))')
    ok "python3 $PYV 已安装"
else
    err "python3 缺失"
    case "$OS" in
        macos)  info "手动：brew install python@3.11" ;;
        debian) info "手动：sudo apt install -y python3 python3-pip python3-venv" ;;
        windows) info "手动：winget install Python.Python.3.11" ;;
    esac
fi

# ── pip + Python 包 ──────────────────────────────────
head "Python 包（edge-tts / Pillow / python-pptx / bs4 / requests / pyyaml）"
PY_PKGS=(edge-tts Pillow python-pptx beautifulsoup4 requests pyyaml)
for pkg in "${PY_PKGS[@]}"; do
    # 尝试 import 一次对应的模块名
    case "$pkg" in
        edge-tts) import_name="edge_tts" ;;
        Pillow) import_name="PIL" ;;
        python-pptx) import_name="pptx" ;;
        beautifulsoup4) import_name="bs4" ;;
        pyyaml) import_name="yaml" ;;
        *) import_name="$pkg" ;;
    esac
    if python3 -c "import $import_name" 2>/dev/null; then
        ok "$pkg 已安装"
    else
        info "安装 $pkg..."
        if run python3 -m pip install --user --quiet "$pkg"; then
            ok "$pkg 安装成功"
        else
            err "$pkg 安装失败——pip install --user $pkg （检查网络/代理）"
        fi
    fi
done

# ── cwebp ────────────────────────────────────────────
head "cwebp（WebP 图片压缩）"
if command -v cwebp >/dev/null 2>&1; then
    ok "cwebp 已安装"
else
    case "$OS" in
        macos)
            if ensure_brew; then run brew install webp && ok "cwebp 安装成功" || err "cwebp 安装失败"; fi
            ;;
        debian)
            run sudo -n apt-get install -y webp && ok "cwebp 安装成功" \
                || err "cwebp 安装失败——手动：sudo apt install -y webp"
            ;;
        windows)
            warn "Windows 请手动安装：winget install Google.WebP"
            ;;
        *) warn "OS=$OS 未知，请参照 https://developers.google.com/speed/webp/download" ;;
    esac
fi

# ── ffmpeg ───────────────────────────────────────────
head "ffmpeg（Remotion 渲染必需）"
if [ "$PYTHON_ONLY" = "1" ]; then
    warn "--python-only 跳过 ffmpeg"
elif command -v ffmpeg >/dev/null 2>&1; then
    ok "ffmpeg 已安装"
else
    case "$OS" in
        macos)
            if ensure_brew; then run brew install ffmpeg && ok "ffmpeg 安装成功" || err "ffmpeg 安装失败"; fi ;;
        debian)
            run sudo -n apt-get install -y ffmpeg && ok "ffmpeg 安装成功" \
                || err "ffmpeg 安装失败——手动：sudo apt install -y ffmpeg" ;;
        windows)
            warn "Windows 请手动安装：winget install Gyan.FFmpeg" ;;
        *) warn "请参照 https://ffmpeg.org/download.html" ;;
    esac
fi

# ── Node.js 20 LTS ───────────────────────────────────
head "Node.js 20 LTS + Remotion 依赖"
if [ "$PYTHON_ONLY" = "1" ]; then
    warn "--python-only 跳过 Node"
else
    if command -v node >/dev/null 2>&1; then
        NVER=$(node --version | sed 's/^v//')
        NMAJOR=$(echo "$NVER" | cut -d. -f1)
        if [ "$NMAJOR" -ge 18 ]; then
            ok "Node v${NVER} (>=18) OK"
        else
            warn "Node v${NVER} < 18, please upgrade to 20 LTS"
        fi
    else
        case "$OS" in
            macos)
                if ensure_brew; then run brew install node@20 && run brew link --overwrite node@20 && ok "Node 20 安装成功" || err "Node 安装失败"; fi ;;
            debian)
                info "使用 NodeSource 安装 Node 20..."
                run bash -c "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -" \
                    && run sudo -n apt-get install -y nodejs \
                    && ok "Node 安装成功" || err "Node 安装失败"
                ;;
            windows)
                warn "Windows 请手动安装：winget install OpenJS.NodeJS.LTS" ;;
            *) warn "请访问 https://nodejs.org/ 下载 Node 20 LTS" ;;
        esac
    fi
fi

# ── Linux 中文字体（Remotion 字幕必需） ──────────────
if [ "$OS" = "debian" ] && [ "$PYTHON_ONLY" != "1" ]; then
    head "Linux 中文字体 fonts-noto-cjk"
    if fc-list 2>/dev/null | grep -iqE 'noto.*cjk|source.*han'; then
        ok "Noto CJK 已安装"
    else
        info "安装 fonts-noto-cjk..."
        run sudo -n apt-get install -y fonts-noto-cjk && ok "安装成功" \
            || err "安装失败——手动：sudo apt install -y fonts-noto-cjk"
    fi
fi

# ── Git hooks ────────────────────────────────────────
head "Git 禁直推 hook"
if [ -d .git ]; then
    HOOK=".git/hooks/pre-push"
    TARGET="scripts/pre-push.sh"
    if [ -f "$TARGET" ]; then
        if [ -L "$HOOK" ] || [ -f "$HOOK" ]; then
            ok "pre-push hook 已安装"
        else
            run ln -sf "../../scripts/pre-push.sh" "$HOOK" && run chmod +x "$TARGET" \
                && ok "pre-push hook 安装完成" || err "安装失败"
        fi
    else
        warn "$TARGET 不存在，跳过（可能不在 TeachAny 仓库根目录）"
    fi
else
    warn "当前不在 git 仓库内，跳过 hook 安装"
fi

# ── 最终自检 ─────────────────────────────────────────
head "最终自检"
if [ -f scripts/preflight-check.py ]; then
    info "调用 preflight-check.py 做最终能力评估..."
    python3 scripts/preflight-check.py --dry-run 2>&1 | tail -15
    EC=${PIPESTATUS[0]:-0}
    if [ "$EC" = "0" ] || [ "$EC" = "10" ]; then
        ok "TeachAny 工具链就位，欢迎开工"
    elif [ "$EC" = "20" ] || [ "$EC" = "30" ]; then
        err "仍有关键能力缺失，请根据上面提示手动处理"
        exit "$EC"
    fi
else
    warn "scripts/preflight-check.py 不存在，无法做最终评估"
fi
