#!/bin/bash
#===========================================
# Project Deployment Script
# 部署任意项目到 Docker 容器
#===========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_NAME=${1:-""}
PROJECT_PATH=${2:-""}

if [ -z "$PROJECT_NAME" ] || [ -z "$PROJECT_PATH" ]; then
    echo -e "${RED}用法: $0 <项目名称> <项目路径>${NC}"
    echo -e "示例: $0 my-app /path/to/my-app"
    exit 1
fi

CONTAINER_NAME="${PROJECT_NAME}-app"
IMAGE_NAME="${PROJECT_NAME}:latest"

log() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect project type
detect_project_type() {
    if [ -f "$PROJECT_PATH/package.json" ]; then
        if [ -f "$PROJECT_PATH/Dockerfile" ]; then
            echo "docker"
        elif grep -q '"react"' "$PROJECT_PATH/package.json" || grep -q '"vue"' "$PROJECT_PATH/package.json" || grep -q '"angular"' "$PROJECT_PATH/package.json"; then
            echo "frontend"
        else
            echo "nodejs"
        fi
    elif [ -f "$PROJECT_PATH/requirements.txt" ] || [ -f "$PROJECT_PATH/pyproject.toml" ]; then
        echo "python"
    elif [ -f "$PROJECT_PATH/go.mod" ]; then
        echo "golang"
    elif [ -f "$PROJECT_PATH/pom.xml" ] || [ -f "$PROJECT_PATH/build.gradle" ]; then
        echo "java"
    else
        echo "unknown"
    fi
}

# Build Docker image
build_docker() {
    log "构建 Docker 镜像..."
    
    if [ ! -f "$PROJECT_PATH/Dockerfile" ]; then
        log_error "未找到 Dockerfile"
        exit 1
    fi
    
    docker build -t "$IMAGE_NAME" "$PROJECT_PATH"
    
    if [ $? -eq 0 ]; then
        log_success "镜像构建成功: $IMAGE_NAME"
    else
        log_error "镜像构建失败"
        exit 1
    fi
}

# Run container
run_container() {
    log "启动容器..."
    
    # Stop existing container
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
    
    # Run new container
    docker run -d \
        --name "$CONTAINER_NAME" \
        --restart unless-stopped \
        -p 8080:8080 \
        "$IMAGE_NAME"
    
    if [ $? -eq 0 ]; then
        log_success "容器启动成功: $CONTAINER_NAME"
        docker ps --filter "name=$CONTAINER_NAME"
    else
        log_error "容器启动失败"
        exit 1
    fi
}

# Deploy with Dockerfile
deploy_docker() {
    build_docker
    run_container
}

# Deploy Node.js without Dockerfile
deploy_nodejs() {
    log "部署 Node.js 应用..."
    
    cat > "$PROJECT_PATH/Dockerfile" << 'EOF'
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["node", "index.js"]
EOF
    
    deploy_docker
}

# Deploy Python
deploy_python() {
    log "部署 Python 应用..."
    
    cat > "$PROJECT_PATH/Dockerfile" << 'EOF'
FROM python:3.12-alpine
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8080
CMD ["python", "main.py"]
EOF
    
    deploy_docker
}

# Main
log "开始部署项目: $PROJECT_NAME"
log "项目路径: $PROJECT_PATH"
log "检测项目类型..."

PROJECT_TYPE=$(detect_project_type)
log "项目类型: $PROJECT_TYPE"

case $PROJECT_TYPE in
    docker)
        deploy_docker
        ;;
    frontend|nodejs)
        deploy_nodejs
        ;;
    python)
        deploy_python
        ;;
    golang)
        log "Golang 部署暂不支持自动检测，请提供 Dockerfile"
        exit 1
        ;;
    java)
        log "Java 部署暂不支持自动检测，请提供 Dockerfile"
        exit 1
        ;;
    *)
        log_error "无法识别的项目类型: $PROJECT_TYPE"
        exit 1
        ;;
esac

echo ""
log_success "部署完成!"
echo ""
echo -e "${CYAN}容器信息:${NC}"
echo "  名称: $CONTAINER_NAME"
echo "  镜像: $IMAGE_NAME"
echo "  端口: 8080"
echo ""
echo -e "${CYAN}常用命令:${NC}"
echo "  查看日志: docker logs -f $CONTAINER_NAME"
echo "  进入容器: docker exec -it $CONTAINER_NAME sh"
echo "  停止服务: docker stop $CONTAINER_NAME"
echo "  删除服务: docker rm -f $CONTAINER_NAME"
