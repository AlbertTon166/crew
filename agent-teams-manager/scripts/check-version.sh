#!/bin/bash
#===========================================
# OpenClaw 版本检查脚本
# 确保部署时版本兼容
#===========================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 锁定版本配置
LOCKED_VERSION="2026.3.13"
LOCKED_BUILD="61d171a"
MIN_VERSION="2026.3.0"
MAX_VERSION="2026.4.0"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_openclaw_version() {
    log_info "检查 OpenClaw 版本..."
    
    # 检查 openclaw 命令是否存在
    if ! command -v openclaw &> /dev/null; then
        log_error "OpenClaw 未安装"
        echo ""
        echo "安装命令:"
        echo "  npm install -g openclaw"
        return 1
    fi
    
    # 获取当前版本
    CURRENT_VERSION=$(openclaw --version 2>/dev/null | grep -oP '\d+\.\d+\.\d+' | head -1)
    CURRENT_BUILD=$(openclaw --version 2>/dev/null | grep -oP '\([a-f0-9]+\)' | tr -d '()' | head -1)
    
    if [ -z "$CURRENT_VERSION" ]; then
        log_error "无法获取 OpenClaw 版本"
        return 1
    fi
    
    log_info "当前版本: $CURRENT_VERSION ($CURRENT_BUILD)"
    log_info "锁定版本: $LOCKED_VERSION ($LOCKED_BUILD)"
    
    # 比较版本
    CURRENT_MAJOR=$(echo $CURRENT_VERSION | cut -d. -f1)
    CURRENT_MINOR=$(echo $CURRENT_VERSION | cut -d. -f2)
    CURRENT_PATCH=$(echo $CURRENT_VERSION | cut -d. -f3)
    
    MIN_MAJOR=$(echo $MIN_VERSION | cut -d. -f1)
    MIN_MINOR=$(echo $MIN_VERSION | cut -d. -f2)
    MIN_PATCH=$(echo $MIN_VERSION | cut -d. -f3)
    
    MAX_MAJOR=$(echo $MAX_VERSION | cut -d. -f1)
    MAX_MINOR=$(echo $MAX_VERSION | cut -d. -f2)
    MAX_PATCH=$(echo $MAX_VERSION | cut -d. -f3)
    
    COMPATIBLE=true
    
    # 检查是否低于最低版本
    if [ "$CURRENT_MAJOR" -lt "$MIN_MAJOR" ] || \
       [ "$CURRENT_MAJOR" -eq "$MIN_MAJOR" -a "$CURRENT_MINOR" -lt "$MIN_MINOR" ] || \
       [ "$CURRENT_MAJOR" -eq "$MIN_MAJOR" -a "$CURRENT_MINOR" -eq "$MIN_MINOR" -a "$CURRENT_PATCH" -lt "$MIN_PATCH" ]; then
        COMPATIBLE=false
        log_error "版本过低！需要 >= $MIN_VERSION"
    fi
    
    # 检查是否高于最高版本
    if [ "$CURRENT_MAJOR" -gt "$MAX_MAJOR" ] || \
       [ "$CURRENT_MAJOR" -eq "$MAX_MAJOR" -a "$CURRENT_MINOR" -gt "$MAX_MINOR" ] || \
       [ "$CURRENT_MAJOR" -eq "$MAX_MAJOR" -a "$CURRENT_MINOR" -eq "$MAX_MINOR" -a "$CURRENT_PATCH" -gt "$MAX_PATCH" ]; then
        COMPATIBLE=false
        log_error "版本过高！需要 <= $MAX_VERSION"
    fi
    
    if [ "$COMPATIBLE" = true ]; then
        if [ "$CURRENT_VERSION" = "$LOCKED_VERSION" ]; then
            log_success "✅ 版本完全匹配"
        else
            log_warning "⚠️ 版本兼容但不是锁定版本 ($LOCKED_VERSION)"
            echo ""
            echo "建议安装锁定版本:"
            echo "  npm install -g openclaw@$LOCKED_VERSION"
        fi
        return 0
    else
        log_error "版本不兼容！"
        echo ""
        echo "请安装兼容版本:"
        echo "  npm install -g openclaw@$LOCKED_VERSION"
        return 1
    fi
}

check_node_version() {
    log_info "检查 Node.js 版本..."
    
    CURRENT_NODE=$(node --version)
    CURRENT_NODE_NUM=$(echo $CURRENT_NODE | sed 's/v//')
    
    log_info "当前 Node.js: $CURRENT_NODE"
    log_info "推荐版本: 22.0.0"
    
    # 检查是否为 18+
    MAJOR=$(echo $CURRENT_NODE_NUM | cut -d. -f1 | sed 's/v//')
    
    if [ "$MAJOR" -lt 18 ]; then
        log_error "Node.js 版本过低，需要 >= 18.0.0"
        return 1
    fi
    
    if [ "$MAJOR" -gt 22 ]; then
        log_warning "Node.js 版本较高 (>= 23)，可能存在兼容性问题"
    fi
    
    log_success "✅ Node.js 版本兼容"
    return 0
}

show_version_info() {
    echo "========================================"
    echo "       OpenClaw 版本信息"
    echo "========================================"
    echo ""
    
    if command -v openclaw &> /dev/null; then
        echo -e "${BLUE}OpenClaw 版本:${NC}"
        openclaw --version
        echo ""
    else
        echo -e "${RED}OpenClaw 未安装${NC}"
        echo ""
    fi
    
    echo -e "${BLUE}Node.js 版本:${NC}"
    node --version
    echo ""
    
    echo -e "${BLUE}npm 版本:${NC}"
    npm --version
    echo ""
    
    echo "========================================"
    echo "       锁定版本配置"
    echo "========================================"
    echo ""
    echo "锁定版本: $LOCKED_VERSION ($LOCKED_BUILD)"
    echo "兼容范围: $MIN_VERSION ~ $MAX_VERSION"
    echo "Node.js: >= 18.0.0 (推荐 22.0.0)"
    echo ""
}

case "${1:-check}" in
    check)
        check_openclaw_version && check_node_version
        ;;
    info)
        show_version_info
        ;;
    lock)
        log_info "安装锁定版本..."
        npm install -g openclaw@$LOCKED_VERSION
        ;;
    *)
        echo "用法: $0 {check|info|lock}"
        echo ""
        echo "  check - 检查版本兼容性"
        echo "  info  - 显示版本信息"
        echo "  lock  - 安装锁定版本"
        exit 1
        ;;
esac
