#!/bin/bash
#===========================================
# SSL Certificate Setup Script
# 使用 Let's Encrypt 生成免费 SSL 证书
#===========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN=${1:-""}
EMAIL=${2:-"admin@example.com"}

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

if [ -z "$DOMAIN" ]; then
    echo "用法: $0 <域名> [邮箱]"
    echo "示例: $0 ai.example.com admin@example.com"
    exit 1
fi

log_info "设置 SSL 证书 for $DOMAIN..."

# 创建必要的目录
mkdir -p data/certbot/conf/live/$DOMAIN
mkdir -p data/certbot/www

# 创建 standalone nginx 配置用于验证
cat > /tmp/nginx-ssl.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;
    root /var/www/html;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}
EOF

log_info "启动临时 nginx 用于域验证..."
docker run -d --name certbot-standalone \
    -p 80:80 \
    -v /tmp/nginx-ssl.conf:/etc/nginx/conf.d/default.conf \
    -v $(pwd)/data/certbot/www:/var/www/certbot \
    nginx:alpine

sleep 3

log_info "请求 Let's Encrypt 证书..."
docker run --rm \
    -v $(pwd)/data/certbot/conf:/etc/letsencrypt \
    -v $(pwd)/data/certbot/www:/var/www/certbot \
    certbot/certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d $DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    || true

# 清理
docker stop certbot-standalone 2>/dev/null || true
docker rm certbot-standalone 2>/dev/null || true

# 检查证书是否生成
if [ -d "data/certbot/conf/live/$DOMAIN" ]; then
    log_success "SSL 证书已生成!"
    log_info "证书位置: data/certbot/conf/live/$DOMAIN/"
    ls -la data/certbot/conf/live/$DOMAIN/
else
    log_error "证书生成失败，请检查域名 DNS 配置"
    exit 1
fi

log_success "完成!"
echo ""
echo "下一步:"
echo "1. 确保 .env 文件中设置 DOMAIN=$DOMAIN"
echo "2. 运行 docker-compose -f docker-compose.prod.yml up -d"
