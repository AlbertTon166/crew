#!/bin/bash
# ============================================
# 多租户部署脚本
# Deploy Multi-Tenant Infrastructure
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
TENANT_ID="${TENANT_ID:-tenant001}"
TENANT_TIER="${TENANT_TIER:-starter}"
ACTION="${1:-deploy}"  # deploy | destroy | status

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================
# 读取配额配置
# ============================================
load_quota() {
    local tier=$1
    local quota_file="multi-tenant/quota.json"
    
    if [ ! -f "${quota_file}" ]; then
        log_error "配额文件不存在: ${quota_file}"
        exit 1
    fi
    
    # 使用 Python 解析 JSON
    python3 << EOF
import json
with open('${quota_file}', 'r') as f:
    quotas = json.load(f)['quotas']['${tier}']
    print(json.dumps(quotas))
EOF
}

# ============================================
# 部署租户
# ============================================
deploy_tenant() {
    local tenant_id=$1
    local tier=$2
    
    log_info "部署租户: ${tenant_id} (${tier})"
    
    # 读取配额
    local quota=$(load_quota ${tier})
    local cpu_limit=$(echo $quota | python3 -c "import sys,json; print(json.load(sys.stdin)['cpu_limit'])")
    local mem_limit=$(echo $quota | python3 -c "import sys,json; print(json.load(sys.stdin)['mem_limit'])")
    local pids_limit=$(echo $quota | python3 -c "import sys,json; print(json.load(sys.stdin)['pids_limit'])")
    local disk_quota=$(echo $quota | python3 -c "import sys,json; print(json.load(sys.stdin)['disk_quota'])")
    local redis_maxmemory=$(echo $quota | python3 -c "import sys,json; print(json.load(sys.stdin)['redis_maxmemory'])")
    local sandbox_cpu=$(echo $quota | python3 -c "import sys,json; print(json.load(sys.stdin)['sandbox_cpu'])")
    local sandbox_mem=$(echo $quota | python3 -c "import sys,json; print(json.load(sys.stdin)['sandbox_mem'])")
    
    # 生成随机密码
    local tenant_password=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 16)
    local redis_password=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 16)
    
    # 创建 .env 文件
    cat > "multi-tenant/.env.${tenant_id}" << EOF
TENANT_ID=${tenant_id}
TENANT_TIER=${tier}
TENANT_PASSWORD=${tenant_password}
TENANT_REDIS_PASSWORD=${redis_password}
TENANT_CPU_LIMIT=${cpu_limit}
TENANT_MEM_LIMIT=${mem_limit}
TENANT_PIDS_LIMIT=${pids_limit}
TENANT_DISK_QUOTA=${disk_quota}
TENANT_REDIS_MAXMEMORY=${redis_maxmemory}
TENANT_SANDBOX_CPU=${sandbox_cpu}
TENANT_SANDBOX_MEM=${sandbox_mem}
EOF
    
    log_info "创建租户环境配置文件: .env.${tenant_id}"
    
    # 部署 Docker Compose
    log_info "启动租户容器..."
    TENANT_ID=${tenant_id} \
    TENANT_PASSWORD=${tenant_password} \
    TENANT_REDIS_PASSWORD=${redis_password} \
    TENANT_CPU_LIMIT=${cpu_limit} \
    TENANT_MEM_LIMIT=${mem_limit} \
    TENANT_PIDS_LIMIT=${pids_limit} \
    TENANT_DISK_QUOTA=${disk_quota} \
    TENANT_REDIS_MAXMEMORY=${redis_maxmemory} \
    TENANT_SANDBOX_CPU=${sandbox_cpu} \
    TENANT_SANDBOX_MEM=${sandbox_mem} \
    docker compose -f multi-tenant/docker-compose.multiTenant.yml up -d
    
    # 运行命名空间隔离脚本
    log_info "配置网络命名空间隔离..."
    chmod +x multi-tenant/namespace.sh
    ./multi-tenant/namespace.sh ${tenant_id} create
    
    # 验证部署
    log_info "验证租户部署..."
    ./multi-tenant/namespace.sh ${tenant_id} verify || log_warn "验证过程中有警告"
    
    echo ""
    log_info "========================================"
    log_info "租户部署完成: ${tenant_id}"
    log_info "========================================"
    echo ""
    echo "连接信息:"
    echo "  - 租户 ID: ${tenant_id}"
    echo "  - 数据库密码: ${tenant_password}"
    echo "  - Redis 密码: ${redis_password}"
    echo "  - CPU 限制: ${cpu_limit}"
    echo "  - 内存限制: ${mem_limit}"
    echo ""
    echo "查看状态: ./multi-tenant/deploy-tenant.sh status"
    echo "销毁租户: ./multi-tenant/deploy-tenant.sh destroy"
}

# ============================================
# 销毁租户
# ============================================
destroy_tenant() {
    local tenant_id=$1
    
    log_warn "销毁租户: ${tenant_id}"
    
    # 停止容器
    TENANT_ID=${tenant_id} docker compose -f multi-tenant/docker-compose.multiTenant.yml down -v 2>/dev/null || true
    
    # 清理命名空间
    ./multi-tenant/namespace.sh ${tenant_id} destroy 2>/dev/null || true
    
    # 删除环境配置文件
    rm -f "multi-tenant/.env.${tenant_id}"
    
    log_info "租户已销毁: ${tenant_id}"
}

# ============================================
# 查看租户状态
# ============================================
status_tenant() {
    local tenant_id=$1
    
    echo "========================================"
    echo "租户状态: ${tenant_id}"
    echo "========================================"
    
    # 显示配额信息
    if [ -f "multi-tenant/.env.${tenant_id}" ]; then
        echo ""
        echo "配额配置:"
        grep -E "^(TENANT_ID|TENANT_TIER|TENANT_CPU_LIMIT|TENANT_MEM_LIMIT)=" "multi-tenant/.env.${tenant_id}" | sed 's/^/  /'
    fi
    
    # 显示命名空间状态
    echo ""
    ./multi-tenant/namespace.sh ${tenant_id} status 2>/dev/null || log_error "无法获取租户状态"
}

# ============================================
# 主逻辑
# ============================================
case "${ACTION}" in
    deploy)
        deploy_tenant "${TENANT_ID}" "${TENANT_TIER}"
        ;;
    destroy)
        destroy_tenant "${TENANT_ID}"
        ;;
    status)
        status_tenant "${TENANT_ID}"
        ;;
    list)
        echo "所有租户:"
        docker ps --filter "label=tenant.id" --format "{{.Names}}\t{{.Status}}" | grep "^tenant-" || echo "无运行中的租户"
        ;;
    *)
        echo "用法: $0 <ACTION> [TENANT_ID]"
        echo ""
        echo "ACTION:"
        echo "  deploy   - 部署租户 (需设置 TENANT_ID, TENANT_TIER)"
        echo "  destroy  - 销毁租户"
        echo "  status   - 查看租户状态"
        echo "  list     - 列出所有租户"
        echo ""
        echo "示例:"
        echo "  TENANT_ID=tenant001 TENANT_TIER=starter $0 deploy"
        echo "  TENANT_ID=tenant001 $0 status"
        echo "  TENANT_ID=tenant001 $0 destroy"
        echo "  $0 list"
        exit 1
        ;;
esac
