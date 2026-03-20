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

支持两种部署模式，通过 `DEPLOY_MODE` 环境变量切换：

### 云端模式 (Cloud)
```bash
DEPLOY_MODE=cloud docker-compose --profile cloud up -d
```
- 完整前端 Web UI
- 监控面板
- 用户管理 + 审计日志
- SSL/HTTPS 支持

### 本地模式 (Local)
```bash
DEPLOY_MODE=local docker-compose up -d
```
- 仅 Teams 核心服务
- 无前端（纯 API）
- 更轻量，适合内网部署

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18 + TypeScript + Vite + Tailwind CSS |
| **状态管理** | Zustand |
| **后端** | Node.js + Express |
| **数据库** | PostgreSQL 16 |
| **缓存** | Redis 7 |
| **向量库** | ChromaDB |
| **部署** | Docker + Docker Compose |

---

## 📦 快速开始

### 前置要求

- Node.js 22+
- Docker + Docker Compose
- PostgreSQL / Redis (或使用 Docker)

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

# 本地模式 (仅 API)
docker-compose up -d
```

---

## 🔐 安全功能

- **密码加盐 Hash** - 1000 轮混合加密
- **安全令牌** - crypto.getRandomValues 生成
- **会话过期** - 7 天自动过期
- **登录锁定** - 15 分钟内 5 次失败锁定
- **审计日志** - 记录所有操作
- **HTTPS** - Let's Encrypt 自动续期

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
├── docker-compose.yml         # Docker 编排
├── docker-compose.prod.yml    # 生产环境配置
├── monitoring/               # Prometheus 监控
└── scripts/                  # 部署脚本
```

---

## 🔧 配置选项

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DEPLOY_MODE` | `cloud` | 部署模式 (cloud/local) |
| `PG_PASSWORD` | `postgres` | PostgreSQL 密码 |
| `REDIS_PASSWORD` | - | Redis 密码 |
| `CORS_ORIGIN` | `*` | CORS 允许的源 |
| `DOMAIN` | - | 域名 (SSL 用) |

---

## 📚 相关文档

- [部署指南](./docs/docker-deployment.md) - 详细的 Docker 部署说明
- [执行流程](./EXECUTION_FLOW.md) - 系统执行流程
- [设计规格](./SPEC.md) - 技术设计规格

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

<p align="center">
  <strong>Made with ❤️ by 芽芽</strong>
</p>
