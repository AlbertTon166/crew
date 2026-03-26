#!/bin/bash
# ============================================
# 租户命名空间隔离脚本
# Namespace Isolation Script for Multi-Tenant
# ============================================

set -e

TENANT_ID="${1:-tenant001}"
ACTION="${2:-create}"  # create | destroy | status | verify

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================
# 创建租户网络命名空间
# ============================================
create_tenant_namespace() {
    local tenant_id=$1
    local bridge_name="br-tenant-${tenant_id}"
    local iface_name="veth-${tenant_id}"
    
    log_info "创建租户网络命名空间: ${tenant_id}"
    
    # 检查是否已存在
    if ip link show ${bridge_name} &>/dev/null; then
        log_warn "租户网桥 ${bridge_name} 已存在，跳过创建"
        return 0
    fi
    
    # 创建 Docker 网络
    docker network create \
        --driver bridge \
        --opt "com.docker.network.bridge.name=${bridge_name}" \
        --opt "com.docker.network.bridge.enable_icc=true" \
        --opt "com.docker.network.bridge.enable_ip_masquerade=true" \
        tenant-${tenant_id}-network 2>/dev/null || true
    
    # 获取网桥 IP 段
    local bridge_ip=$(ip addr show ${bridge_name} 2>/dev/null | grep -oP 'inet \K[\d.]+' | head -1 || echo "172.20.0.1/16")
    
    log_info "租户网络创建完成: ${bridge_name} (${bridge_ip})"
}

# ============================================
# 销毁租户命名空间
# ============================================
destroy_tenant_namespace() {
    local tenant_id=$1
    
    log_info "销毁租户命名空间: ${tenant_id}"
    
    # 删除 Docker 网络
    docker network rm tenant-${tenant_id}-network 2>/dev/null || true
    
    # 删除网桥
    ip link del "br-tenant-${tenant_id}" 2>/dev/null || true
    
    log_info "租户命名空间已销毁: ${tenant_id}"
}

# ============================================
# 查看租户状态
# ============================================
status_tenant() {
    local tenant_id=$1
    
    echo "========================================"
    echo "租户状态: ${tenant_id}"
    echo "========================================"
    
    # 网络状态
    echo -e "\n${GREEN}[网络]${NC}"
    if docker network inspect tenant-${tenant_id}-network &>/dev/null; then
        echo "✓ Docker 网络: tenant-${tenant_id}-network (存在)"
        docker network inspect tenant-${tenant_id}-network --format '{{range .IPAM.Config}}Subnet: {{.Subnet}}{{end}}' 2>/dev/null || true
    else
        echo "✗ Docker 网络: tenant-${tenant_id}-network (不存在)"
    fi
    
    # 网桥状态
    echo -e "\n${GREEN}[网桥]${NC}"
    if ip link show "br-tenant-${tenant_id}" &>/dev/null; then
        echo "✓ 网桥: br-tenant-${tenant_id} (活跃)"
        ip addr show "br-tenant-${tenant_id}" | grep -oP 'inet \K[\d.]+'
    else
        echo "✗ 网桥: br-tenant-${tenant_id} (不存在)"
    fi
    
    # 容器状态
    echo -e "\n${GREEN}[租户容器]${NC}"
    docker ps -a --filter "label=tenant.id=${tenant_id}" --format "{{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    # 资源使用
    echo -e "\n${GREEN}[资源使用]${NC}"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" $(docker ps -q --filter "label=tenant.id=${tenant_id}") 2>/dev/null || echo "无运行中的容器"
}

# ============================================
# 验证租户隔离
# ============================================
verify_tenant_isolation() {
    local tenant_id=$1
    
    log_info "验证租户隔离: ${tenant_id}"
    
    local errors=0
    
    # 1. 验证网络隔离
    echo -e "\n${GREEN}[1/4] 验证网络隔离${NC}"
    local other_tenants=$(docker ps --format '{{.Labels}}' | grep -oP 'tenant\.id=\K[^,]+' | sort -u | grep -v "^${tenant_id}$" || true)
    
    for other in ${other_tenants}; do
        if docker network inspect tenant-${tenant_id}-network &>/dev/null; then
            # 检查是否能访问其他租户网络
            local can_reach=$(ping -c 1 -W 1 "br-tenant-${other}" 2>/dev/null && echo "yes" || echo "no")
            if [ "${can_reach}" = "yes" ]; then
                log_error "网络隔离失败: ${tenant_id} 可以访问 ${other}"
                ((errors++))
            else
                log_info "网络隔离正常: ${tenant_id} 无法访问 ${other}"
            fi
        fi
    done
    
    # 2. 验证资源配额
    echo -e "\n${GREEN}[2/4] 验证资源配额${NC}"
    local sandbox_container="tenant-${tenant_id}-sandbox"
    if docker inspect ${sandbox_container} &>/dev/null; then
        local cpu_limit=$(docker inspect --format '{{.HostConfig.CpuQuota}}' ${sandbox_container} 2>/dev/null || echo "0")
        local mem_limit=$(docker inspect --format '{{.HostConfig.Memory}}' ${sandbox_container} 2>/dev/null || echo "0")
        
        if [ "${cpu_limit}" > "0" ]; then
            log_info "CPU 配额: ${cpu_limit}"
        else
            log_error "CPU 配额未设置"
            ((errors++))
        fi
        
        if [ "${mem_limit}" > "0" ]; then
            log_info "内存配额: ${mem_limit} bytes ($(echo "scale=2; ${mem_limit}/1024/1024/1024" | bc)GB)"
        else
            log_error "内存配额未设置"
            ((errors++))
        fi
    else
        log_warn "沙盒容器不存在，跳过资源配额验证"
    fi
    
    # 3. 验证文件系统隔离
    echo -e "\n${GREEN}[3/4] 验证文件系统隔离${NC}"
    if docker volume inspect tenant-${tenant_id}-data &>/dev/null; then
        log_info "租户数据卷: tenant-${tenant_id}-data (存在)"
    else
        log_error "租户数据卷不存在"
        ((errors++))
    fi
    
    # 4. 验证进程隔离
    echo -e "\n${GREEN}[4/4] 验证进程隔离${NC}"
    local pids_limit=$(docker inspect --format '{{.HostConfig.PidsLimit}}' ${sandbox_container} 2>/dev/null || echo "0")
    if [ "${pids_limit}" > "0" ]; then
        log_info "进程数限制: ${pids_limit}"
    else
        log_warn "进程数限制未设置（允许无限）"
    fi
    
    echo -e "\n========================================"
    if [ ${errors} -eq 0 ]; then
        log_info "验证通过: 租户 ${tenant_id} 隔离正常"
        return 0
    else
        log_error "验证失败: ${errors} 个错误"
        return 1
    fi
}

# ============================================
# 主逻辑
# ============================================
case "${ACTION}" in
    create)
        create_tenant_namespace "${TENANT_ID}"
        ;;
    destroy)
        destroy_tenant_namespace "${TENANT_ID}"
        ;;
    status)
        status_tenant "${TENANT_ID}"
        ;;
    verify)
        verify_tenant_isolation "${TENANT_ID}"
        ;;
    *)
        echo "用法: $0 <TENANT_ID> <ACTION>"
        echo "  ACTION: create | destroy | status | verify"
        echo ""
        echo "示例:"
        echo "  $0 tenant001 create  # 创建租户命名空间"
        echo "  $0 tenant001 status  # 查看租户状态"
        echo "  $0 tenant001 verify   # 验证租户隔离"
        echo "  $0 tenant001 destroy  # 销毁租户命名空间"
        exit 1
        ;;
esac
