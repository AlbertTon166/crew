#!/bin/bash
#===========================================
# Agent Teams Manager - 完善版部署脚本
# 支持：云端部署 / 本地部署 / 混合部署
#===========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
PROJECT_NAME="agent-teams-manager"
COMPOSE_FILE="docker-compose.yml"
COMPOSE_PROD_FILE="docker-compose.prod.yml"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check Docker
check_docker() {
    log_info "检查 Docker 环境..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
    
    if ! docker info &> /dev/null 2>&1; then
        log_error "Docker daemon 未运行"
        exit 1
    fi
    
    log_success "Docker: $(docker --version)"
}

# Check Docker Compose
check_compose() {
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        log_error "Docker Compose 未安装"
        exit 1
    fi
    log_success "Docker Compose: $($COMPOSE_CMD version | head -1)"
}

# Deploy Cloud Mode (All-in-one)
deploy_cloud() {
    log_info "🚀 开始云端部署 (全量服务)..."
    check_docker
    check_compose
    
    # Pull latest images
    log_info "拉取最新镜像..."
    $COMPOSE_CMD --profile cloud pull
    
    # Start all services
    log_info "启动所有服务..."
    $COMPOSE_CMD --profile cloud up -d
    
    # Wait for services
    log_info "等待服务启动..."
    sleep 15
    
    # Check status
    if $COMPOSE_CMD --profile cloud ps | grep -q "Up"; then
        log_success "云端部署完成!"
        show_status
    else
        log_error "部分服务启动失败"
        $COMPOSE_CMD --profile cloud logs
        exit 1
    fi
}

# Deploy Local Mode (RAG only)
deploy_local() {
    log_info "🚀 开始本地部署 (仅核心服务)..."
    check_docker
    check_compose
    
    # Start core services only
    log_info "启动核心服务 (PostgreSQL + Redis + ChromaDB)..."
    $COMPOSE_CMD up -d postgres redis chromadb
    
    # Wait for services
    log_info "等待服务健康检查..."
    sleep 10
    
    # Start backend
    log_info "启动后端服务..."
    $COMPOSE_CMD up -d backend
    
    sleep 5
    
    log_success "本地部署完成!"
    show_status
    
    echo ""
    echo -e "${CYAN}本地服务端口:${NC}"
    echo "  PostgreSQL: 5432"
    echo "  Redis: 6379"
    echo "  ChromaDB: 8000"
    echo "  Backend API: 3001"
    echo ""
    echo -e "${YELLOW}提示: 本地模式需要配置 Cloudflare Tunnel 才能从公网访问${NC}"
}

# Deploy Hybrid Mode (Local RAG + Cloud Management)
deploy_hybrid() {
    log_info "🚀 开始混合部署模式"
    log_info "本地 RAG + 云端管理界面"
    echo ""
    
    # Check if cloudflared is installed
    if ! command -v cloudflared &> /dev/null; then
        log_warning "cloudflared 未安装，正在安装..."
        install_cloudflared
    fi
    
    echo -e "${CYAN}混合部署架构:${NC}"
    echo "  本地服务器: ChromaDB + Backend + PostgreSQL + Redis"
    echo "  云端服务器: Frontend (通过 Tunnel 访问)"
    echo ""
    
    read -p "请选择部署位置 [1]本地 / [2]云端: " location
    
    case $location in
        1)
            deploy_local
            setup_tunnel
            ;;
        2)
            deploy_cloud
            ;;
        *)
            log_error "无效选择"
            exit 1
            ;;
    esac
}

# Install cloudflared
install_cloudflared() {
    log_info "安装 Cloudflare Tunnel 客户端..."
    
    if [ "$(uname -m)" = "x86_64" ]; then
        ARCH="amd64"
    elif [ "$(uname -m)" = "aarch64" ]; then
        ARCH="arm64"
    else
        ARCH="amd64"
    fi
    
    curl -L "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}" \
        -o /usr/local/bin/cloudflared
    chmod +x /usr/local/bin/cloudflared
    
    log_success "cloudflared 安装完成"
}

# Setup Tunnel
setup_tunnel() {
    echo ""
    log_info "配置 Cloudflare Tunnel..."
    echo ""
    echo "请确保已完成以下步骤:"
    echo "  1. 在 Cloudflare 控制台创建 Tunnel"
    echo "  2. 配置 DNS 域名指向 Tunnel"
    echo ""
    
    read -p "请输入你的域名 (例如: api.example.com): " DOMAIN
    
    if [ -z "$DOMAIN" ]; then
        log_warning "跳过 Tunnel 配置"
        return
    fi
    
    # Check if tunnel exists
    if [ -f "cloudflared/config.yml" ]; then
        log_info "使用现有 Tunnel 配置"
    else
        log_warning "请先运行: cloudflared login 创建 Tunnel"
        return
    fi
    
    # Start tunnel
    log_info "启动 Tunnel..."
    cloudflared tunnel --config cloudflared/config.yml run 2>/dev/null &
    
    log_success "Tunnel 已启动: https://$DOMAIN"
}

# Stop all services
stop_services() {
    log_info "停止所有服务..."
    $COMPOSE_CMD down || true
    log_success "服务已停止"
}

# Restart services
restart_services() {
    log_info "重启服务..."
    stop_services
    $COMPOSE_CMD up -d
    show_status
}

# Show status
show_status() {
    COMPOSE_CMD="docker compose"
    log_info "服务状态:"
    $COMPOSE_CMD -f docker-compose.yml ps 2>/dev/null || echo "暂无运行中的服务"
    echo ""
    log_info "Docker 容器:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || true
}

# Show logs
show_logs() {
    $COMPOSE_CMD logs -f
}

# Cleanup
cleanup() {
    log_warning "清理未使用的 Docker 资源..."
    docker system prune -f
    log_success "清理完成"
}

# Update
update() {
    log_info "更新服务..."
    check_docker
    check_compose
    
    $COMPOSE_CMD pull
    $COMPOSE_CMD up -d
    
    log_success "更新完成"
}

# Usage
usage() {
    echo -e "${CYAN}Agent Teams Manager 部署脚本${NC}"
    echo ""
    echo "用法: $0 <命令>"
    echo ""
    echo -e "${GREEN}部署模式:${NC}"
    echo "  cloud     云端部署 (全量服务)"
    echo "  local     本地部署 (仅核心服务)"
    echo "  hybrid    混合部署 (本地 RAG + 云端管理)"
    echo ""
    echo -e "${GREEN}服务管理:${NC}"
    echo "  start     启动服务"
    echo "  stop      停止服务"
    echo "  restart   重启服务"
    echo "  status    查看状态"
    echo "  logs      查看日志"
    echo "  update    更新服务"
    echo ""
    echo -e "${GREEN}维护:${NC}"
    echo "  cleanup   清理 Docker 缓存"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo "  $0 cloud      # 云端部署"
    echo "  $0 local      # 本地部署"
    echo "  $0 hybrid     # 混合部署"
    echo "  $0 status     # 查看状态"
    echo ""
}

# Main
case "${1:-usage}" in
    cloud)
        deploy_cloud
        ;;
    local)
        deploy_local
        ;;
    hybrid)
        deploy_hybrid
        ;;
    start)
        check_docker
        check_compose
        $COMPOSE_CMD up -d
        show_status
        ;;
    stop)
        check_docker
        stop_services
        ;;
    restart)
        check_docker
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    update)
        update
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        usage
        exit 1
        ;;
esac
