# Agent Teams Manager 🤖

可视化 Agent Teams 工作流管理平台，让产品需求到软件工程成果验收的全流程可见、可控、可追踪。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-22.x-green.svg)
![React](https://img.shields.io/badge/react-18.x-blue.svg)

---

## ✨ 功能特性

| 模块 | 功能 |
|------|------|
| **Dashboard** | 服务器资源监控、Agent 状态、项目统计 |
| **项目管理** | 需求→开发→验收全流程，项目进度状态管理 |
| **Agent 管理** | 模型 API 配置、角色增删、状态管理 |
| **需求池** | 用户故事地图，需求优先级排序 |
| **知识库** | 角色配置，专业知识、规则文档管理 |
| **API 文档** | 第三方 API 配置与管理 |

---

## 🚀 部署模式

### 模式 1: 全量云端部署 (推荐简单场景)

所有服务部署在同一台云服务器：

```bash
# 克隆项目
git clone https://github.com/AlbertTon166/agent-teams-manager.git
cd agent-teams-manager

# 配置环境
cp .env.example .env
# 编辑 .env 设置密码和域名

# 启动服务
docker-compose --profile cloud up -d
```

### 模式 2: 混合部署 (RAG 本地化)

```
┌─────────────────────────────────────────────────────────┐
│                    云端服务器                             │
│   Frontend (80)  │  Backend API (3001)  │  ChromaDB     │
│                                                          │
│   ┌─────────────────────────────────────────────┐        │
│   │  PostgreSQL  │  Redis  │  RAG Proxy         │        │
│   └─────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

---

## 🌉 Cloudflare Tunnel 内网穿透

本地部署 RAG + 云端管理界面，通过 Cloudflare Tunnel 互通：

```
本地机器                              Cloudflare              云端服务器
┌─────────────────┐                ┌───────────┐           ┌────────────────┐
│ ChromaDB :8000 │◄───────────────►│  免费隧道  │◄────────►│ Frontend :80  │
│ Backend :3001  │                │ (CDN加速)  │           │   HTTPS        │
└─────────────────┘                └───────────┘           └────────────────┘
     │
     │ cloudflared 隧道
     ▼
   公网可访问 (api.yourdomain.com, rag.yourdomain.com)
```

### 快速配置 Cloudflare Tunnel

```bash
# 1. 安装 cloudflared (Linux)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
  -o /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared

# 2. 登录 Cloudflare
cloudflared login

# 3. 创建 Tunnel
cloudflared tunnel create agent-teams

# 4. 配置 DNS (在 Cloudflare Dashboard)
# 添加 CNAME: api.yourdomain.com -> agent-teams.cfarg.net

# 5. 启动隧道
./scripts/tunnel-start.sh yourdomain.com
```

### 一键启动脚本

```bash
# 交互式配置 (首次)
./scripts/tunnel-start.sh yourdomain.com

# 直接运行 (后续)
./scripts/tunnel-start.sh
```

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18 + TypeScript + Vite + Tailwind CSS |
| **状态管理** | Zustand |
| **后端** | Node.js + Express |
| **数据库** | PostgreSQL 16 |
| **缓存** | Redis 7 |
| **向量库** | ChromaDB (RAG) |
| **隧道** | Cloudflare Tunnel |
| **部署** | Docker + Docker Compose |

---

## 📦 快速开始

### 前置要求

- Docker + Docker Compose
- PostgreSQL / Redis (Docker 自动启动)
- Cloudflare 账号 (内网穿透用，可选)

### 1. 克隆项目

```bash
git clone https://github.com/AlbertTon166/agent-teams-manager.git
cd agent-teams-manager
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 设置必要的配置
```

### 3. 启动服务

**开发模式：**
```bash
# 前端
cd client && npm install && npm run dev

# 后端
cd server && npm install && node index.js
```

**Docker 部署：**
```bash
# 云端模式 (完整)
docker-compose --profile cloud up -d

# 本地模式 (仅 API + RAG)
docker-compose up -d
```

---

## 🔐 安全功能

- **密码加盐 Hash** - 1000 轮混合加密
- **安全令牌** - crypto.getRandomValues 生成
- **会话过期** - 7 天自动过期
- **登录锁定** - 15 分钟内 5 次失败锁定
- **审计日志** - 记录所有操作
- **HTTPS** - Let's Encrypt 自动续期 / Cloudflare Tunnel

---

## 🌐 API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/status` | GET | 部署模式状态 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/projects` | GET/POST | 项目管理 |
| `/api/agents` | GET/POST | Agent 管理 |
| `/api/requirements` | GET/POST | 需求管理 |

---

## 📁 项目结构

```
agent-teams-manager/
├── client/                    # 前端应用
│   ├── src/
│   │   ├── components/        # React 组件
│   │   ├── pages/             # 页面
│   │   ├── context/           # Context 状态
│   │   ├── stores/            # Zustand 状态管理
│   │   └── types/             # TypeScript 类型
│   └── Dockerfile
├── server/                    # 后端服务
│   ├── index.js              # Express API
│   ├── db.js                 # 数据库操作
│   └── Dockerfile
├── cloudflared/              # Cloudflare Tunnel 配置
│   └── config.yml
├── docker-compose.yml         # Docker 编排
├── docker-compose.prod.yml    # 生产环境配置
├── monitoring/               # Prometheus 监控
└── scripts/
    ├── tunnel-start.sh       # 隧道启动脚本
    └── ssl-setup.sh          # SSL 证书脚本
```

---

## 🔧 内网穿透对比

| 方案 | 云端资源 | 免费 | 稳定性 | 推荐场景 |
|------|---------|------|--------|---------|
| **Cloudflare Tunnel** | 极低 | ✅ | ⭐⭐⭐⭐⭐ | 生产环境 |
| **Tailscale** | 极低 | ✅ | ⭐⭐⭐⭐ | 快速原型 |
| **FRP** | 需要 frps | ✅ | ⭐⭐⭐ | 有服务器 |
| **Ngrok** | 无 | 有限 | ⭐⭐⭐ | 开发测试 |

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License
