# Agent Teams Manager 项目构建文档

> 版本: V2.0.0  
> 更新日期: 2026-03-21  
> 项目描述: 智能体团队协作管理系统

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术架构](#2-技术架构)
3. [前端架构](#3-前端架构)
4. [后端架构](#4-后端架构)
5. [数据模型](#5-数据模型)
6. [API 接口](#6-api-接口)
7. [核心功能模块](#7-核心功能模块)
8. [业务流程](#8-业务流程)
9. [部署架构](#9-部署架构)
10. [项目结构](#10-项目结构)

---

## 1. 项目概述

### 1.1 项目简介

Agent Teams Manager 是一个智能体团队协作管理平台，用于协调和管理多个 AI 智能体（Agent）完成软件项目开发任务。

### 1.2 核心价值

- **多智能体协作**: 支持产品经理、架构师、前端、后端、测试等多种角色的智能体
- **任务管理**: 项目和任务的创建、分配、跟踪
- **知识库配置**: 为不同岗位配置技能、知识库和工具
- **实时状态监控**: 监控智能体在线状态和任务进度

### 1.3 版本历史

| 版本 | 日期 | 描述 |
|------|------|------|
| V1.0.0 | 2026-03-20 | 初始版本，包含基础框架 |
| V2.0.0 | 2026-03-21 | 重构项目，大幅更新前端UI和功能 |

---

## 2. 技术架构

### 2.1 技术栈概览

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Client)                          │
│  React 19 + TypeScript + Vite + Zustand + Tailwind CSS       │
│  React Router + Lucide Icons + Recharts                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Nginx (反向代理)                          │
│              HTTP-only (80/443)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      后端 (Server)                            │
│  Node.js + Express + Express (REST API)                      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   PostgreSQL  │    │     Redis     │    │   ChromaDB    │
│   (数据存储)   │    │   (缓存/会话)  │    │   (RAG知识库)  │
└───────────────┘    └───────────────┘    └───────────────┘
```

### 2.2 技术选型理由

| 组件 | 技术 | 理由 |
|------|------|------|
| 前端框架 | React 19 | 成熟的组件化架构，生态丰富 |
| 构建工具 | Vite | 快速的开发服务器和构建速度 |
| 状态管理 | Zustand | 轻量级、简洁的 React 状态管理 |
| UI 样式 | Tailwind CSS | 原子化 CSS，快速开发 |
| 后端框架 | Express | 轻量、灵活的 Node.js 框架 |
| 数据存储 | PostgreSQL | 关系型数据，ACID 支持 |
| 缓存 | Redis | 高性能缓存和会话存储 |
| 向量数据库 | ChromaDB | RAG 场景优化的向量数据库 |

---

## 3. 前端架构

### 3.1 项目结构

```
client/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── AgentConfigModal.tsx    # 智能体配置弹窗
│   │   ├── Layout.tsx              # 主布局
│   │   ├── Sidebar.tsx             # 侧边导航栏
│   │   ├── LoginModal.tsx          # 登录弹窗
│   │   ├── StatCard.tsx            # 统计卡片
│   │   └── ui/                     # UI 基础组件
│   ├── pages/                # 页面组件
│   │   ├── Dashboard.tsx           # 控制台首页
│   │   ├── Projects.tsx           # 项目管理
│   │   ├── Agents.tsx              # 智能体管理
│   │   ├── Knowledge.tsx           # 知识库配置
│   │   ├── Requirements.tsx        # 需求池
│   │   └── APIDoc.tsx              # API 文档
│   ├── stores/               # Zustand 状态库
│   │   └── dashboardStore.ts       # 全局状态管理
│   ├── context/              # React Context
│   │   ├── LanguageContext.tsx     # 多语言支持
│   │   ├── DeployModeContext.tsx   # 部署模式
│   │   └── AuthContext.tsx         # 认证
│   ├── config/               # 配置文件
│   │   └── team-templates.ts       # 团队模板配置
│   ├── types/                # TypeScript 类型
│   │   ├── deploy.ts               # 部署相关类型
│   │   └── auth.ts                 # 认证相关类型
│   ├── App.tsx               # 根组件
│   └── main.tsx              # 入口文件
├── public/                   # 静态资源
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### 3.2 前端路由

| 路径 | 页面 | 描述 |
|------|------|------|
| `/` | Dashboard | 控制台首页，展示统计数据和智能体状态 |
| `/projects` | Projects | 项目管理列表 |
| `/agents` | Agents | 智能体管理 |
| `/knowledge` | Knowledge | 知识库配置（岗位模板管理） |
| `/requirements` | Requirements | 需求池，发送需求给 PM 智能体 |
| `/api-doc` | APIDoc | API 文档页面 |

### 3.3 状态管理 (Zustand Store)

```typescript
// dashboardStore.ts 主要状态
interface DashboardStore {
  // 数据
  agents: Agent[]           // 智能体列表
  projects: Project[]        // 项目列表
  tasks: Record<string, Task[]>  // 任务映射
  knowledge: Knowledge[]     // 知识库
  stats: DashboardStats      // 统计数据
  resources: ResourceUsage   // 资源使用
  
  // 操作方法
  setAgents(agents)         // 设置智能体
  addAgent(agent)            // 添加智能体
  updateAgent(id, updates)   // 更新智能体
  deleteAgent(id)            // 删除智能体
  setProjects(projects)      // 设置项目
  // ... 其他方法
}
```

### 3.4 多语言支持

使用 React Context 实现中英文切换：
- 中文模式 (`zh`)
- 英文模式 (`en`)

---

## 4. 后端架构

### 4.1 项目结构

```
server/
├── index.js            # 主入口，Express 服务器
├── package.json
├── db.js               # 数据库连接（PostgreSQL）
├── databases.js        # 数据库初始化脚本
├── docker.js           # Docker 操作接口
├── feishu.js           # 飞书集成
├── github.js           # GitHub 集成
├── team-templates.js   # 团队模板配置
└── openclaw-version.js # 版本信息
```

### 4.2 服务器配置

```javascript
// Express 服务器配置
const PORT = process.env.PORT || 3001
const DEPLOY_MODE = process.env.DEPLOY_MODE || 'cloud'

// 中间件
app.use(cors())           // 跨域资源共享
app.use(express.json())   // JSON 解析
```

### 4.3 API 路由结构

```
/api/
├── health                 # 健康检查
├── status                 # 部署状态
├── projects               # 项目 CRUD
│   ├── GET    /api/projects        # 获取所有项目
│   ├── POST   /api/projects        # 创建项目
│   ├── GET    /api/projects/:id    # 获取单个项目
│   └── PUT    /api/projects/:id    # 更新项目
├── tasks                  # 任务 CRUD
│   ├── GET    /api/tasks            # 获取任务
│   ├── POST   /api/tasks            # 创建任务
│   └── PUT    /api/tasks/:id        # 更新任务
├── agents                 # 智能体 CRUD
│   ├── GET    /api/agents            # 获取所有智能体
│   ├── POST   /api/agents            # 创建智能体
│   └── PUT    /api/agents/:id        # 更新智能体
├── knowledge              # 知识库
│   ├── GET    /api/knowledge         # 获取知识
│   └── POST   /api/knowledge         # 添加知识
├── pm-agent               # PM 智能体
│   ├── GET    /api/pm-agent          # 获取 PM 智能体
│   └── POST   /api/requirements      # 发送需求
├── requirements           # 需求管理
│   ├── GET    /api/requirements      # 获取需求列表
│   └── PUT    /api/requirements/:id # 更新需求状态
├── dashboard/
│   └── stats    GET    /api/dashboard/stats  # 仪表盘统计
└── team-templates        # 团队模板
     └── GET    /api/team-templates           # 获取模板列表
```

---

## 5. 数据模型

### 5.1 智能体 (Agent)

```typescript
interface Agent {
  id: string                    // UUID
  name: string                  // 名称，如 "Product Manager Agent"
  role: 'pm' | 'planner' | 'frontend' | 'backend' | 'reviewer' | 'tester' | 'deployer'
  status: 'online' | 'offline' | 'busy' | 'error'
  model_provider: string        // 模型提供商，如 "openai"
  model_name: string            // 模型名称，如 "gpt-4"
  enabled: boolean              // 是否启用
  created_at?: string          // 创建时间
}
```

### 5.2 项目 (Project)

```typescript
interface Project {
  id: string                    // UUID
  name: string                  // 项目名称
  description: string           // 项目描述
  status: 'pending' | 'in_progress' | 'testing' | 'completed' | 'error' | 'deleted'
  github_repo?: string          // GitHub 仓库 URL
  created_at: string            // 创建时间
}
```

### 5.3 任务 (Task)

```typescript
interface Task {
  id: string                    // UUID
  project_id: string            // 所属项目 ID
  title: string                 // 任务标题
  description: string           // 任务描述
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  assigned_agent_id: string     // 分配的智能体 ID
  created_at: string            // 创建时间
}
```

### 5.4 知识库 (Knowledge)

```typescript
interface Knowledge {
  id: string                    // UUID
  title: string                 // 标题
  content: string               // 内容
  created_at: string            // 创建时间
}
```

### 5.5 岗位模板 (JobTemplate)

```typescript
interface JobTemplate {
  id: string                    // 模板 ID，如 "frontend-dev"
  title: string                 // 英文名称
  titleZh: string               // 中文名称
  industry: string              // 行业
  industryZh: string            // 中文行业
  role: {                       // 角色配置
    title: string
    titleZh: string
    content: string
    contentZh: string
  }
  skills: {                     // 技能配置
    title: string
    titleZh: string
    content: string
    contentZh: string
  }
  knowledge: {                  // 知识库配置
    title: string
    titleZh: string
    content: string
    contentZh: string
  }
  tools?: {                     // 工具配置（可选）
    title: string
    titleZh: string
    content: string
    contentZh: string
    links?: string[]            // 工具链接
  }
}
```

### 5.6 团队模板 (TeamTemplate)

```typescript
interface TeamTemplate {
  id: string                    // 模板 ID
  name: string                  // 模板名称
  description: string           // 描述
  icon: string                  // 图标 emoji
  tags: string[]                // 标签
  agents: AgentRole[]           // 智能体配置
  estimatedCost: string         // 预估成本 ($ ~ $$$$)
  complexity: 'simple' | 'medium' | 'complex'
}

interface AgentRole {
  role: 'pm' | 'planner' | 'frontend' | 'backend' | 'reviewer' | 'tester' | 'deployer' | 'game-dev'
  count: number                 // 数量
  skills?: string[]             // 技能要求
}
```

---

## 6. API 接口

### 6.1 健康检查

```
GET /api/health

Response:
{
  "status": "ok",
  "timestamp": "2026-03-21T16:00:00.000Z",
  "services": {
    "postgres": "demo",
    "redis": "demo",
    "chromadb": "demo"
  }
}
```

### 6.2 状态检查

```
GET /api/status

Response:
{
  "connected": true,
  "mode": "cloud",
  "version": "1.0.0",
  "features": {
    "auth": true,
    "frontend": true,
    "monitoring": true,
    "teamsSync": true
  }
}
```

### 6.3 智能体 API

```
GET /api/agents

Response:
[
  {
    "id": "uuid",
    "name": "Product Manager Agent",
    "role": "pm",
    "status": "online",
    "model_provider": "openai",
    "model_name": "gpt-4",
    "enabled": true
  }
]

POST /api/agents
Body: { "name": "New Agent", "role": "coder" }

PUT /api/agents/:id
Body: { "status": "busy", "enabled": false }
```

### 6.4 项目 API

```
GET /api/projects

POST /api/projects
Body: { "name": "New Project", "description": "Description" }

GET /api/projects/:id
Response: { ...project, tasks: [...] }

PUT /api/projects/:id
Body: { "status": "in_progress" }
```

### 6.5 PM 智能体 / 需求 API

```
GET /api/pm-agent
# 获取 PM 智能体信息

POST /api/requirements
Body: { "content": "需求内容", "project_id": "可选" }
Response: {
  "requirement": { ... },
  "pm_agent": { ... },
  "message": "需求已发送给产品经理智能体"
}
```

### 6.6 仪表盘统计

```
GET /api/dashboard/stats

Response:
{
  "totalProjects": 3,
  "inProgressProjects": 1,
  "completedProjects": 1,
  "errorProjects": 0,
  "totalTasks": 3,
  "pendingTasks": 1,
  "inProgressTasks": 1,
  "completedTasks": 1,
  "totalAgents": 5,
  "onlineAgents": 3,
  "offlineAgents": 2
}
```

---

## 7. 核心功能模块

### 7.1 控制台首页 (Dashboard)

**功能描述:**
- 展示项目统计、任务统计、智能体状态
- 显示最近活动

**组件结构:**
```
Dashboard
├── Header (标题 + 快捷操作)
├── Stats Grid (统计数据卡片)
│   ├── 项目总数
│   ├── 进行中
│   ├── 已完成
│   └── 错误数
├── Main Content
│   ├── Recent Projects (最近项目)
│   └── Activity Chart (活动图表)
└── Right Sidebar
    ├── Agent Status Card (智能体状态)
    │   ├── 在线状态指示器
    │   └── 智能体列表
    └── Recent Activity Card (最近活动)
```

**状态显示:**
- `isConnected = true` 且有在线智能体 → 显示正常智能体列表
- `isConnected = false` 或无在线智能体 → 显示红色呼吸动画"未连接到teams服务器"

### 7.2 项目管理 (Projects)

**功能描述:**
- 创建、编辑、删除项目
- 查看项目详情和任务
- 分配任务给智能体

**UI 布局:**
- 顶部: 标题 + 新建按钮
- 筛选栏: 状态筛选
- 卡片网格: 项目卡片列表
- 项目详情侧边栏: 任务列表

### 7.3 智能体管理 (Agents)

**功能描述:**
- 查看所有智能体
- 配置智能体参数
- 查看智能体状态

**智能体角色:**
| 角色 | 英文 | 描述 |
|------|------|------|
| 产品经理 | PM | 需求分析和规划 |
| 架构师 | Architect | 系统设计和技术选型 |
| 前端开发 | Frontend | UI/UX 开发 |
| 后端开发 | Backend | API 和业务逻辑 |
| 代码审查 | Reviewer | 代码审查 |
| 测试工程师 | Tester | 测试和质量保证 |
| 部署工程师 | Deployer | CI/CD 和部署 |

### 7.4 知识库配置 (Knowledge)

**功能描述:**
- 管理岗位模板（前端、后端、测试等）
- 配置每个岗位的技能、知识库、工具
- 重置/保存配置

**岗位卡片字段:**
```typescript
{
  id: 'frontend-dev',
  title: 'Frontend Developer',
  titleZh: '前端开发工程师',
  role: { content, contentZh },      // 角色定义（只读）
  skills: { content, contentZh },     // 技能清单（可编辑）
  knowledge: { content, contentZh },  // 知识库（可编辑）
  tools: { content, contentZh, links } // 工具（可编辑链接）
}
```

**三卡片布局:**
- 技能卡片 (蓝色 `#3B82F6`)
- 知识库卡片 (绿色 `#10B981`)
- 工具卡片 (黄色 `#FBBF24`)

### 7.5 需求池 (Requirements)

**功能描述:**
- 输入需求并发送给 PM 智能体
- 查看需求处理状态

**UI 行为:**
- PM 智能体未连接 → 输入框禁用 + 红色警告提示
- PM 智能体在线 → 可正常输入需求

---

## 8. 业务流程

### 8.1 需求处理流程

```
用户输入需求
     │
     ▼
前端 POST /api/requirements
     │
     ▼
后端查找 PM 智能体
     │
     ├─── PM 存在且启用 ────► 创建需求记录
     │                              │
     │                              ▼
     │                       返回成功响应
     │                              │
     ▼                              ▼
返回错误 (PM 不可用)
```

### 8.2 智能体状态检测流程

```
页面加载
     │
     ▼
Dashboard 调用 useDeployMode()
     │
     ▼
fetch('/api/status')
     │
     ├─── connected: true ────► 显示正常内容
     │                              │
     │                              ▼
     │                       fetch('/api/agents')
     │                              │
     │                              ▼
     │                       有在线智能体 ────► 显示智能体列表
     │                              │
     │                              ▼
     │                       无在线智能体 ────► 红色呼吸效果
     │
     └─── connected: false ────► 红色呼吸效果
```

### 8.3 知识库配置流程

```
用户选择岗位
     │
     ▼
显示岗位详情 (技能/知识库/工具 三卡片)
     │
     ▼
用户点击"编辑"
     │
     ├─── 技能 ────► 编辑技能内容 ────► 保存
     ├─── 知识库 ──► 编辑知识内容 ────► 保存
     └─── 工具 ────► 编辑链接列表 ────► 保存
     
用户点击"重置"
     │
     ▼
恢复该岗位默认配置
```

---

## 9. 部署架构

### 9.1 Docker Compose 生产环境

```yaml
services:
  # 数据服务
  postgres:        # PostgreSQL 16
  redis:           # Redis 7
  chromadb:        # ChromaDB (向量数据库)
  
  # 应用服务
  backend:         # Node.js Express API
  frontend:        # Nginx (静态文件)
```

### 9.2 网络配置

- 网络名: `agent-network` (bridge driver)
- 容器通信: 通过服务名访问
  - `backend:3001`
  - `postgres:5432`
  - `redis:6379`
  - `chromadb:8000`

### 9.3 前端 Nginx 配置

```nginx
server {
    listen 80;
    server_name _;
    
    # API 代理
    location /api/ {
        proxy_pass http://backend:3001;
    }
    
    # 静态文件
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

### 9.4 环境变量

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `PROJECT_NAME` | `agent-teams` | 项目名称 |
| `PORT` | `3001` | 后端端口 |
| `NODE_ENV` | `production` | 运行环境 |
| `DEPLOY_MODE` | `cloud` | 部署模式 |
| `PG_USER` | `postgres` | PostgreSQL 用户 |
| `PG_PASSWORD` | `postgres` | PostgreSQL 密码 |
| `CORS_ORIGIN` | - | CORS 允许的源 |

---

## 10. 项目结构

### 10.1 完整目录结构

```
/root/.openclaw/workspace/
├── docker-compose.prod.yml    # 生产环境 Docker Compose
├── docker-compose.yml          # 开发环境 Docker Compose
├── README.md                   # 项目说明
│
├── server/                    # 后端服务
│   ├── index.js               # Express 服务器入口
│   ├── package.json
│   ├── db.js                  # 数据库连接
│   ├── databases.js           # 数据库初始化
│   ├── docker.js             # Docker 操作
│   ├── feishu.js             # 飞书集成
│   ├── github.js             # GitHub 集成
│   ├── team-templates.js     # 团队模板
│   └── openclaw-version.js   # 版本信息
│
├── client/                    # 前端应用
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── index.html
│   ├── nginx.conf            # Nginx 配置
│   ├── Dockerfile
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── AgentConfigModal.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── LoginModal.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── StatusIndicator.tsx
│   │   │   └── ui/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── Agents.tsx
│   │   │   ├── Knowledge.tsx
│   │   │   ├── Requirements.tsx
│   │   │   └── APIDoc.tsx
│   │   ├── stores/
│   │   │   └── dashboardStore.ts
│   │   ├── context/
│   │   │   ├── LanguageContext.tsx
│   │   │   ├── DeployModeContext.tsx
│   │   │   └── AuthContext.tsx
│   │   ├── config/
│   │   │   └── team-templates.ts
│   │   ├── types/
│   │   │   ├── deploy.ts
│   │   │   └── auth.ts
│   │   └── lib/
│   │       └── utils.ts
│   └── public/
│
└── memory/                    # 记忆文件
    └── 2026-03-21.md
```

### 10.2 关键文件说明

| 文件 | 行数 | 功能 |
|------|------|------|
| `client/src/pages/Dashboard.tsx` | ~400 | 控制台首页 |
| `client/src/pages/Knowledge.tsx` | ~900 | 知识库配置（最大页面） |
| `client/src/pages/Projects.tsx` | ~650 | 项目管理 |
| `client/src/pages/Agents.tsx` | ~550 | 智能体管理 |
| `client/src/stores/dashboardStore.ts` | ~200 | 全局状态管理 |
| `server/index.js` | ~300 | 后端 API 路由 |
| `client/src/config/team-templates.ts` | ~250 | 团队模板配置 |

---

## 附录 A: 依赖版本

### 前端依赖

| 包 | 版本 |
|----|------|
| react | ^19.2.4 |
| react-dom | ^19.2.4 |
| react-router-dom | ^7.13.1 |
| zustand | ^5.0.12 |
| tailwindcss | ^4.2.2 |
| vite | ^8.0.0 |
| typescript | ~5.9.3 |
| lucide-react | ^0.577.0 |
| recharts | ^3.8.0 |
| axios | ^1.13.6 |

### 后端依赖

| 包 | 版本 |
|----|------|
| express | ^4.21.0 |
| cors | ^2.8.5 |
| uuid | ^10.0.0 |
| pg | ^8.13.0 |
| redis | ^4.7.0 |
| chromadb | ^1.8.1 |

---

## 附录 B: 颜色主题

| 用途 | 色值 |
|------|------|
| 技能卡片 | `#3B82F6` (蓝色) |
| 知识库卡片 | `#10B981` (绿色) |
| 工具卡片 | `#FBBF24` (黄色) |
| 角色标签 | `#8B5CF6` (紫色) |
| 在线状态 | `#34D399` (绿色) |
| 忙碌状态 | `#FBBF24` (黄色) |
| 错误状态 | `#F87171` (红色) |
| 离线状态 | `#475569` (灰色) |

---

*文档生成时间: 2026-03-21*
