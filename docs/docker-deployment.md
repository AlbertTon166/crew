# Docker 部署指南

## 快速开始

### 1. 复制环境配置

```bash
cp .env.example .env
# 编辑 .env 文件，设置密码
```

### 2. 一键启动所有服务

```bash
cd agent-teams-manager
./scripts/deploy/deploy.sh start
```

### 3. 查看服务状态

```bash
./scripts/deploy/deploy.sh status
```

## 服务架构

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │PostgreSQL│  │  Redis   │  │ ChromaDB │               │
│  │  :5432   │  │  :6379   │  │  :8000   │               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
│       │             │             │                      │
│       └─────────────┼─────────────┘                      │
│                     │                                    │
│              ┌──────┴──────┐                            │
│              │   Backend   │                            │
│              │   :3001     │                            │
│              └──────┬──────┘                            │
│                     │                                    │
│              ┌──────┴──────┐                            │
│              │  Frontend   │                            │
│              │  Nginx:80   │                            │
│              └─────────────┘                            │
└─────────────────────────────────────────────────────────┘
```

## 部署脚本说明

### deploy.sh - 主部署脚本

```bash
./scripts/deploy/deploy.sh <command>

Commands:
  start     - 启动所有服务
  stop      - 停止所有服务
  restart   - 重启所有服务
  rebuild   - 重新构建并启动
  logs      - 查看日志
  status    - 查看服务状态
  stats     - 查看资源使用
  pull      - 拉取最新镜像
  cleanup   - 清理未使用资源
```

### deploy-project.sh - 项目部署脚本

部署任意项目到 Docker：

```bash
./scripts/deploy/deploy-project.sh <项目名称> <项目路径>

# 示例
./scripts/deploy/deploy-project.sh my-app /path/to/my-app
```

自动检测项目类型并生成 Dockerfile：
- Node.js (React/Vue/Angular)
- Python
- Java (需要手动提供 Dockerfile)
- Go (需要手动提供 Dockerfile)

## Docker 命令行操作

### 查看日志

```bash
# 查看所有服务日志
docker compose logs -f

# 查看指定服务日志
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### 进入容器

```bash
# 进入后端容器
docker exec -it agent-teams-manager-backend sh

# 进入 PostgreSQL
docker exec -it agent-teams-manager-postgres psql -U postgres -d agent_teams

# 进入 Redis
docker exec -it agent-teams-manager-redis redis-cli
```

### 重建服务

```bash
# 重建后端
docker compose build backend
docker compose up -d backend

# 重建前端
docker compose build frontend
docker compose up -d frontend
```

## 环境变量

```env
# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=agent_teams
PG_USER=postgres
PG_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ChromaDB
CHROMA_HOST=localhost
CHROMA_PORT=8000

# 服务端口
SERVER_PORT=3001
FRONTEND_PORT=5173
```

## 数据持久化

Volumes:
- `postgres_data` - PostgreSQL 数据
- `redis_data` - Redis 数据
- `chroma_data` - ChromaDB 向量数据

备份:
```bash
# 备份 PostgreSQL
docker exec agent-teams-manager-postgres pg_dump -U postgres agent_teams > backup.sql

# 恢复 PostgreSQL
docker exec -i agent-teams-manager-postgres psql -U postgres agent_teams < backup.sql
```

## 常见问题

### 1. Docker daemon 未运行

```bash
# 启动 Docker
sudo systemctl start docker
# 或
sudo service docker start
```

### 2. 端口冲突

修改 `.env` 中的端口映射：
```env
SERVER_PORT=3002
FRONTEND_PORT=5174
```

### 3. 数据库连接失败

检查 PostgreSQL 是否健康：
```bash
docker compose ps postgres
docker compose logs postgres
```

### 4. 前端无法访问后端 API

检查 Nginx 配置的代理是否正确：
```bash
docker exec agent-teams-manager-frontend cat /etc/nginx/conf.d/default.conf
```

## 生产环境部署

### 1. 使用域名

修改 `docker-compose.yml` 中的 `nginx.conf`，添加域名配置：
```nginx
server_name your-domain.com;
```

### 2. HTTPS 配置

在 Nginx 前加一层 Nginx 或使用 Traefik：
```yaml
# 添加 Traefik
services:
  traefik:
    image: traefik:v2.10
    ports:
      - "80:80"
      - "443:443"
```

### 3. 资源限制

在 `docker-compose.yml` 中添加资源限制：
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

### 4. 日志管理

配置日志轮转：
```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```
