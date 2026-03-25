# Crew - 项目管理系统

## 1. Concept & Vision

一个可视化的 Agent Teams 工作流管理平台，让产品需求到软件工程成果验收的全流程可见、可控、可追踪。类似 Jira + GitLab 的体验，但专为 AI Agent 团队协作设计。

**核心理念**：让人类管理者清晰看到 AI Agent 团队在做什么、做到了哪一步、有什么问题需要介入。

## 2. Design Language

### Aesthetic Direction
- **风格**：现代 Dashboard 风格，深色主题，清晰的数据可视化
- **参考**：Linear、Vercel Dashboard、GitLab Runner

### Color Palette
```
Primary:     #6366F1 (Indigo - 主操作)
Secondary:   #8B5CF6 (Purple - Agent相关)
Success:    #10B981 (Green - 完成状态)
Warning:    #F59E0B (Amber - 进行中)
Error:      #EF4444 (Red - 错误状态)
Background: #0F172A (Slate 900)
Surface:    #1E293B (Slate 800)
Border:     #334155 (Slate 700)
Text:       #F8FAFC (Slate 50)
Text Muted: #94A3B8 (Slate 400)
```

### Typography
- **Primary**: Inter (Google Fonts) - 清晰的数据展示
- **Monospace**: JetBrains Mono - 代码、日志展示
- **Fallback**: system-ui, sans-serif

### Spatial System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px
- Border radius: 6px (small), 8px (medium), 12px (large)
- Card padding: 24px

### Motion Philosophy
- Micro-interactions: 150ms ease-out
- Page transitions: 200ms ease-in-out
- Data loading: skeleton shimmer animation
- Status changes: pulse animation for attention

## 3. Layout & Structure

### 整体布局
```
┌─────────────────────────────────────────────────────────┐
│  Sidebar (240px)  │  Main Content Area                  │
│                   │                                      │
│  ┌─────────────┐  │  ┌────────────────────────────────┐  │
│  │ Logo        │  │  │ Header: Page Title + Actions   │  │
│  ├─────────────┤  │  ├────────────────────────────────┤  │
│  │ Navigation  │  │  │                                │  │
│  │ - Dashboard │  │  │  Page Content                  │  │
│  │ - Projects  │  │  │                                │  │
│  │ - Agents    │  │  │                                │  │
│  │ - Knowledge │  │  │                                │  │
│  ├─────────────┤  │  │                                │  │
│  │ Agent Status│  │  │                                │  │
│  │ (Live)      │  │  │                                │  │
│  └─────────────┘  │  └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 页面结构

#### Dashboard 首页
- 统计卡片：进行中 / 报错 / 已完成 项目数量
- 服务器资源监控：CPU、内存、磁盘使用率
- Agent 实时状态列表
- 最近活动时间线

#### Projects 项目管理页
- 项目列表（支持筛选：全部/进行中/完成/报错）
- 项目详情页：
  - 需求描述
  - 任务看板（待办/进行中/测试/完成）
  - Agent 执行日志
  - 验收状态

#### Agents Agent管理页
- Agent 列表（卡片/表格视图切换）
- 新增/编辑 Agent 弹窗
- 配置项：
  - 模型选择（API Provider + Model）
  - 角色定义（System Prompt）
  - 技能绑定
  - 状态启用/禁用

#### Knowledge 技能知识库页
- 角色配置管理
- 专业知识库（文档、规则）
- 技能模板

## 4. Features & Interactions

### Dashboard 首页
| 功能 | 描述 | 交互 |
|-----|------|-----|
| 统计卡片 | 显示项目数量统计 | 点击跳转对应筛选的项目列表 |
| 资源监控 | CPU/内存/磁盘实时数据 | 仪表盘可视化，hover 显示详情 |
| Agent状态 | 在线/离线/忙碌状态的 Agent | 点击跳转 Agent 详情 |
| 活动时间线 | 最近 10 条系统活动 | 显示时间戳、类型、描述 |

### Projects 项目管理
| 功能 | 描述 | 交互 |
|-----|------|-----|
| 创建项目 | 填写需求描述 | 弹窗表单，提交后创建项目 |
| 项目列表 | 展示所有项目 | 支持状态筛选、搜索 |
| 项目看板 | 任务状态流转 | 拖拽卡片切换状态 |
| 任务详情 | 查看任务执行情况 | 点击展开详情 |
| 日志查看 | Agent 执行日志 | 实时滚动，可展开查看完整日志 |

### Agents Agent管理
| 功能 | 描述 | 交互 |
|-----|------|-----|
| 新增 Agent | 创建新的 Agent 配置 | 弹窗表单，必填：名称、模型、角色 |
| 编辑配置 | 修改现有 Agent | 点击编辑图标，弹窗编辑 |
| 删除 Agent | 移除 Agent | 确认弹窗，删除后不可恢复 |
| 模型配置 | 设置 API Provider 和模型 | 下拉选择或手动输入 |
| 角色配置 | 定义 Agent 的 System Prompt | 多行文本输入 |
| 状态切换 | 启用/禁用 Agent | 开关控件 |

### Knowledge 技能知识库
| 功能 | 描述 | 交互 |
|-----|------|-----|
| 角色管理 | 创建/编辑角色模板 | 树形结构组织 |
| 知识库 | 添加/编辑知识文档 | Markdown 编辑器 |
| 技能绑定 | 将技能分配给 Agent | 多选下拉 |

## 5. Component Inventory

### StatCard 统计卡片
- Default: 显示图标、标题、数值、趋势箭头
- Hover: 轻微上浮阴影
- Click: 跳转对应列表

### AgentStatusBadge Agent状态徽章
- Online: 绿色圆点 + "在线"
- Offline: 灰色圆点 + "离线"
- Busy: 黄色圆点 + "忙碌"
- Error: 红色圆点 + "错误"

### ProjectCard 项目卡片
- Default: 显示项目名称、进度条、状态标签
- Hover: 边框高亮
- Click: 跳转项目详情

### ResourceGauge 资源仪表
- 环形进度条 + 中心数值
- 颜色根据阈值变化（绿→黄→红）
- Hover: tooltip 显示详情

### Modal 弹窗
- 默认居中，背景遮罩
- 进入：fade + scale up
- 退出：fade + scale down
- 支持 ESC 关闭

### Form 表单
- 输入框：聚焦时边框变 Primary 色
- 下拉选择：自定义样式，搜索功能
- 开关：平滑过渡动画
- 按钮：Primary / Secondary / Ghost 三种

### Table 表格
- 表头：固定，背景 Surface 色
- 行 Hover：高亮背景
- 支持排序、筛选、分页
- 空状态：插画 + 提示文案

### Toast 提示
- 位置：右下角
- 类型：success / error / warning / info
- 自动消失：3秒

## 6. Technical Approach

### 技术栈
- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand (全局状态)
- **Routing**: React Router v6
- **HTTP**: Axios
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Charts**: Recharts (资源监控图表)

### 项目结构
```
crew/
├── client/                 # 前端
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── stores/        # Zustand stores
│   │   ├── api/           # API 调用
│   │   └── utils/         # 工具函数
│   ├── index.html
│   └── vite.config.ts
├── server/                 # 后端
│   ├── routes/            # API 路由
│   ├── db/                # 数据库
│   └── index.ts
├── SPEC.md
└── README.md
```

### 数据模型

#### Project 项目
```typescript
{
  id: string
  name: string
  description: string
  status: 'pending' | 'in_progress' | 'testing' | 'completed' | 'error'
  createdAt: Date
  updatedAt: Date
}
```

#### Task 任务
```typescript
{
  id: string
  projectId: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  assignedAgentId?: string
  logs: LogEntry[]
  createdAt: Date
  updatedAt: Date
}
```

#### Agent Agent配置
```typescript
{
  id: string
  name: string
  modelProvider: string
  modelName: string
  systemPrompt: string
  skills: string[]
  status: 'enabled' | 'disabled'
  createdAt: Date
}
```

#### Knowledge 知识库
```typescript
{
  id: string
  title: string
  content: string
  category: 'role' | 'document' | 'rule'
  parentId?: string
}
```

#### Log 日志
```typescript
{
  id: string
  taskId: string
  agentId: string
  level: 'info' | 'warn' | 'error'
  message: string
  timestamp: Date
}
```

### API 设计

#### Projects
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目
- `GET /api/projects/:id` - 获取项目详情
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目

#### Tasks
- `GET /api/projects/:id/tasks` - 获取任务列表
- `POST /api/projects/:id/tasks` - 创建任务
- `PUT /api/tasks/:id` - 更新任务
- `DELETE /api/tasks/:id` - 删除任务

#### Agents
- `GET /api/agents` - 获取 Agent 列表
- `POST /api/agents` - 创建 Agent
- `PUT /api/agents/:id` - 更新 Agent
- `DELETE /api/agents/:id` - 删除 Agent

#### Knowledge
- `GET /api/knowledge` - 获取知识库列表
- `POST /api/knowledge` - 创建知识条目
- `PUT /api/knowledge/:id` - 更新知识条目
- `DELETE /api/knowledge/:id` - 删除知识条目

#### Dashboard
- `GET /api/dashboard/stats` - 获取统计数据
- `GET /api/dashboard/resources` - 获取资源监控数据
- `GET /api/dashboard/activities` - 获取活动时间线

## 7. Implementation Phases

### Phase 1: 基础框架搭建
- [ ] 项目初始化（Vite + React + TypeScript）
- [ ] Tailwind CSS 配置
- [ ] 路由配置
- [ ] 基础组件开发（Layout, Sidebar, Header）
- [ ] 后端 Express + SQLite 初始化

### Phase 2: Dashboard 首页
- [ ] 统计卡片组件
- [ ] 资源监控图表
- [ ] Agent 状态列表
- [ ] 活动时间线

### Phase 3: Projects 项目管理
- [ ] 项目列表页
- [ ] 项目详情页
- [ ] 任务看板
- [ ] 日志查看

### Phase 4: Agents Agent管理
- [ ] Agent 列表页
- [ ] 新增/编辑 Agent 弹窗
- [ ] 模型配置
- [ ] 角色配置

### Phase 5: Knowledge 技能知识库
- [ ] 知识库列表
- [ ] 角色配置管理
- [ ] 文档编辑
