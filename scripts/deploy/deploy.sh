#!/bin/bash
#===========================================
# Agent Teams Manager - 部署脚本
#===========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="agent-teams-manager"
COMPOSE_FILE="docker-compose.yml"
REGISTRY=${DOCKER_REGISTRY:-""}

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

check_docker() {
    log_info "检查 Docker 环境..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon 未运行"
        exit 1
    fi
    
    log_success "Docker 环境正常"
}

check_docker_compose() {
    log_info "检查 Docker Compose..."
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        log_error "Docker Compose 未安装"
        exit 1
    fi
    
    log_success "Docker Compose: $($COMPOSE_CMD version)"
}

pull_images() {
    log_info "拉取最新镜像..."
    $COMPOSE_CMD pull
}

build_images() {
    log_info "构建镜像..."
    $COMPOSE_CMD build --no-cache
}

start_services() {
    log_info "启动服务..."
    $COMPOSE_CMD up -d
    
    log_info "等待服务启动..."
    sleep 10
    
    # Check service health
    if $COMPOSE_CMD ps | grep -q "Up"; then
        log_success "所有服务已启动"
    else
        log_error "部分服务启动失败"
        $COMPOSE_CMD logs
        exit 1
    fi
}

stop_services() {
    log_info "停止服务..."
    $COMPOSE_CMD down
    log_success "服务已停止"
}

restart_services() {
    log_info "重启服务..."
    stop_services
    start_services
}

show_status() {
    log_info "服务状态:"
    $COMPOSE_CMD ps
}

show_logs() {
    log_info "日志 (Ctrl+C 退出):"
    $COMPOSE_CMD logs -f
}

show_stats() {
    log_info "资源使用:"
    docker stats --no-stream $($COMPOSE_CMD ps -q)
}

cleanup() {
    log_warning "清理未使用的 Docker 资源..."
    docker system prune -f
    log_success "清理完成"
}

# Main
case "${1:-start}" in
    start)
        check_docker
        check_docker_compose
        start_services
        show_status
        ;;
    stop)
        check_docker
        stop_services
        ;;
    restart)
        check_docker
        restart_services
        show_status
        ;;
    rebuild)
        check_docker
        check_docker_compose
        log_warning "重新构建并启动..."
        $COMPOSE_CMD down
        build_images
        start_services
        show_status
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    stats)
        show_stats
        ;;
    pull)
        check_docker
        pull_images
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "用法: $0 {start|stop|restart|rebuild|logs|status|stats|pull|cleanup}"
        exit 1
        ;;
esac
