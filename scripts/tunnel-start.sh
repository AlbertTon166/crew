#!/bin/bash
#===========================================
# Cloudflare Tunnel 启动脚本
# 用于将本地服务暴露到公网
#
# 使用前提:
#   1. 安装 cloudflared:
#      - macOS: brew install cloudflare/cloudflare/cloudflared
#      - Linux: curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared
#      - Windows: 下载 https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
#
#   2. 配置 Cloudflare API Token:
#      - 访问 https://dash.cloudflare.com/profile/api-tokens
#      - 创建 "Edit Cloudflare Tunnel" 权限的 Token
#      - 运行: cloudflared login
#
#   3. 创建 Tunnel:
#      cloudflared tunnel create agent-teams
#
#   4. 配置 DNS:
#      - 在 Cloudflare Dashboard 添加 CNAME 记录
#      - api.yourdomain.com -> agent-teams.cfarg.net
#      - rag.yourdomain.com -> agent-teams.cfarg.net
#
#===========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN=${1:-""}
TUNNEL_NAME=${2:-"agent-teams"}

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查 cloudflared 是否安装
check_cloudflared() {
    if ! command -v cloudflared &> /dev/null; then
        log_error "cloudflared 未安装!"
        echo ""
        echo "请安装 cloudflared:"
        echo "  Linux: curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared"
        echo "  macOS: brew install cloudflare/cloudflare/cloudflared"
        exit 1
    fi
    log_success "cloudflared 已安装: $(cloudflared version)"
}

# 创建 Tunnel
create_tunnel() {
    log_info "创建 Cloudflare Tunnel: $TUNNEL_NAME"
    
    # 检查是否已存在
    if cloudflared tunnel list 2>/dev/null | grep -q "$TUNNEL_NAME"; then
        log_warn "Tunnel '$TUNNEL_NAME' 已存在"
    else
        cloudflared tunnel create "$TUNNEL_NAME"
    fi
    
    # 获取 Tunnel ID
    TUNNEL_ID=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" | awk '{print $1}')
    log_success "Tunnel ID: $TUNNEL_ID"
}

# 配置 DNS
setup_dns() {
    if [ -z "$DOMAIN" ]; then
        log_warn "未指定域名，跳过 DNS 配置"
        log_info "请手动配置 DNS:"
        echo "  - api.$DOMAIN CNAME -> $TUNNEL_ID.cfarg.net"
        echo "  - rag.$DOMAIN CNAME -> $TUNNEL_ID.cfarg.net"
        return
    fi
    
    log_info "配置 DNS 记录..."
    
    # 获取 Tunnel 子域名
    TUNNEL_SUBDOMAIN=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" | awk '{print $4}')
    
    # 配置 DNS
    cloudflared tunnel route dns "$TUNNEL_NAME" "api.$DOMAIN"
    cloudflared tunnel route dns "$TUNNEL_NAME" "rag.$DOMAIN"
    
    log_success "DNS 配置完成!"
}

# 运行 Tunnel
run_tunnel() {
    log_info "启动 Cloudflare Tunnel..."
    log_info "按 Ctrl+C 停止"
    echo ""
    
    cloudflared tunnel run --token "$(cloudflared tunnel token "$TUNNEL_NAME")"
}

# 主流程
main() {
    echo "==========================================="
    echo "  Cloudflare Tunnel 启动脚本"
    echo "==========================================="
    echo ""
    
    check_cloudflared
    
    # 如果没有运行过，需要创建 Tunnel
    if ! cloudflared tunnel list 2>/dev/null | grep -q "$TUNNEL_NAME"; then
        log_info "首次运行，需要创建 Tunnel..."
        create_tunnel
        
        if [ -n "$DOMAIN" ]; then
            setup_dns
        fi
        
        echo ""
        log_warn "首次配置完成，下次运行直接执行: $0"
        exit 0
    fi
    
    # 运行 Tunnel
    run_tunnel
}

# 显示帮助
show_help() {
    echo "用法: $0 [域名] [Tunnel名称]"
    echo ""
    echo "示例:"
    echo "  $0                                    # 交互式首次配置"
    echo "  $0 yourdomain.com                     # 配置域名并运行"
    echo "  $0 yourdomain.com my-tunnel           # 自定义 Tunnel 名称"
    echo "  $0 \"\"                                  # 仅运行已有 Tunnel"
    echo ""
    echo "前提条件:"
    echo "  1. 安装 cloudflared"
    echo "  2. 运行 cloudflared login 进行认证"
    echo "  3. 在 Cloudflare Dashboard 创建 API Token"
}

case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main
        ;;
esac
