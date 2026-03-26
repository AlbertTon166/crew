#!/bin/bash
# ============================================
# 快速多租户部署脚本
# Quick Multi-Tenant Deploy
# ============================================

set -e

TENANT_ID="${1:-tenant001}"
TENANT_TIER="${2:-starter}"

echo "========================================"
echo "快速部署租户"
echo "========================================"
echo "租户 ID: ${TENANT_ID}"
echo "套餐级别: ${TENANT_TIER}"
echo ""

# 检查必要文件
if [ ! -f "multi-tenant/quota.json" ]; then
    echo "[ERROR] 缺少 multi-tenant/quota.json"
    exit 1
fi

if [ ! -f "multi-tenant/docker-compose.multiTenant.yml" ]; then
    echo "[ERROR] 缺少 multi-tenant/docker-compose.multiTenant.yml"
    exit 1
fi

# 执行部署
echo "[INFO] 开始部署租户 ${TENANT_ID}..."
chmod +x multi-tenant/deploy-tenant.sh
./multi-tenant/deploy-tenant.sh deploy

echo ""
echo "========================================"
echo "部署完成！"
echo "========================================"
echo ""
echo "查看租户状态:"
echo "  TENANT_ID=${TENANT_ID} ./multi-tenant/deploy-tenant.sh status"
echo ""
echo "查看日志:"
echo "  docker compose -f multi-tenant/docker-compose.multiTenant.yml logs -f"
