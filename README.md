# Crew 🤖

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

## 🚀 快速部署

```bash
# 克隆项目
git clone https://github.com/AlbertTon166/crew.git
cd crew

# 配置环境
cp .env.example .env
# 编辑 .env 设置密码和域名

# 启动服务（开发模式）
docker-compose up -d

# 生产模式
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📁 项目结构

```
crew/
├── client/                    # 前端 React 18 + TypeScript + Vite
│   ├── src/                   # React 组件和页面
│   └── Dockerfile             # 前端镜像构建
│
├── server/                    # 后端 Node.js + Express
│   ├── src/                   # 服务端代码
│   └── Dockerfile             # 后端镜像构建
│
├── multi-tenant/             # 多租户隔离基础设施
│   ├── docker-compose.multiTenant.yml
│   ├── namespace.sh           # 网络命名空间隔离脚本
│   ├── quota.json             # 资源配额配置
│   ├── deploy-tenant.sh      # 多租户部署脚本
│   └── quick-deploy.sh        # 快速部署
│
├── scripts/                   # 工具脚本
│   ├── deploy/               # 部署脚本集
│   ├── check-version.sh
│   ├── ssl-setup.sh
│   └── tunnel-start.sh
│
├── docs/                     # 项目文档
│   ├── nginx.conf            # Nginx 配置
│   ├── nginx.spa.conf        # Nginx SPA 配置
│   ├── DOCKER_SETUP.md
│   ├── docker-deployment.md
│   ├── PRODUCT_REQUIREMENTS.md
│   └── EXECUTION_FLOW.md
│
├── monitoring/               # 监控配置
│   └── prometheus.yml
│
├── cloudflared/             # Cloudflare Tunnel 配置
│   └── config.yml
│
├── docker-compose.yml        # 开发环境
├── docker-compose.prod.yml   # 生产环境
├── deploy.sh                 # 主部署脚本
│
├── README.md                 # 本文件
├── SPEC.md                   # 产品规格文档
├── PROJECT_SCHEDULE.md        # Sprint 排期表
└── PROJECT_DOCUMENTATION.md  # 完整项目文档
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

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License
