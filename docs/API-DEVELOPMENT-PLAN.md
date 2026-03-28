# CrewForce API 开发计划

## 当前状态

### 已完成的后端API
- `/api/health` - 健康检查
- `/api/users/register` - 用户注册
- `/api/users/login` - 用户登录
- `/api/users/me` - 获取当前用户
- `/api/projects` - 项目列表
- `/api/agents` - Agent列表
- `/api/tasks` - 任务列表
- `/api/team-templates` - 团队模板

### 需要开发的API

## 第一阶段：核心CRUD API

### 1. Users API
| 方法 | 路径 | 功能 | 优先级 |
|------|------|------|--------|
| GET | /api/users | 获取用户列表 | P1 |
| GET | /api/users/:id | 获取用户详情 | P1 |
| PUT | /api/users/:id | 更新用户信息 | P1 |
| DELETE | /api/users/:id | 删除用户 | P2 |
| PUT | /api/users/:id/password | 修改密码 | P1 |

### 2. Projects API
| 方法 | 路径 | 功能 | 优先级 |
|------|------|------|--------|
| POST | /api/projects | 创建项目 | P0 |
| GET | /api/projects/:id | 获取项目详情 | P0 |
| PUT | /api/projects/:id | 更新项目 | P0 |
| DELETE | /api/projects/:id | 删除项目 | P1 |
| GET | /api/projects/:id/stats | 获取项目统计 | P1 |

### 3. Agents API
| 方法 | 路径 | 功能 | 优先级 |
|------|------|------|--------|
| POST | /api/agents | 创建Agent | P0 |
| GET | /api/agents/:id | 获取Agent详情 | P0 |
| PUT | /api/agents/:id | 更新Agent | P0 |
| DELETE | /api/agents/:id | 删除Agent | P1 |
| POST | /api/agents/:id/status | 更新Agent状态 | P0 |

### 4. Tasks API
| 方法 | 路径 | 功能 | 优先级 |
|------|------|------|--------|
| POST | /api/tasks | 创建任务 | P0 |
| GET | /api/tasks/:id | 获取任务详情 | P0 |
| PUT | /api/tasks/:id | 更新任务 | P0 |
| DELETE | /api/tasks/:id | 删除任务 | P1 |
| PUT | /api/tasks/:id/status | 更新任务状态 | P0 |
| POST | /api/tasks/:id/execute | 执行任务 | P0 |

### 5. Requirements API
| 方法 | 路径 | 功能 | 优先级 |
|------|------|------|--------|
| POST | /api/requirements | 创建需求 | P0 |
| GET | /api/requirements/:id | 获取需求详情 | P0 |
| PUT | /api/requirements/:id | 更新需求 | P0 |
| DELETE | /api/requirements/:id | 删除需求 | P1 |
| POST | /api/requirements/:id/analyze | AI分析需求 | P0 |

### 6. Knowledge API
| 方法 | 路径 | 功能 | 优先级 |
|------|------|------|--------|
| POST | /api/knowledge | 创建知识条目 | P1 |
| GET | /api/knowledge/:id | 获取知识详情 | P1 |
| PUT | /api/knowledge/:id | 更新知识 | P1 |
| DELETE | /api/knowledge/:id | 删除知识 | P2 |
| GET | /api/knowledge/search | 搜索知识 | P1 |

### 7. API Keys API
| 方法 | 路径 | 功能 | 优先级 |
|------|------|------|--------|
| POST | /api/api-keys | 创建API Key | P1 |
| GET | /api/api-keys | 获取Key列表 | P1 |
| DELETE | /api/api-keys/:id | 删除Key | P1 |

### 8. Usage Stats API
| 方法 | 路径 | 功能 | 优先级 |
|------|------|------|--------|
| GET | /api/usage/stats | 获取使用统计 | P1 |
| GET | /api/usage/agents | Agent使用统计 | P1 |
| GET | /api/usage/costs | 成本统计 | P1 |

### 9. Execution API
| 方法 | 路径 | 功能 | 优先级 |
|------|------|------|--------|
| POST | /api/execution/start | 启动执行 | P0 |
| GET | /api/execution/:id | 获取执行状态 | P0 |
| POST | /api/execution/:id/stop | 停止执行 | P1 |
| GET | /api/execution/:id/logs | 获取执行日志 | P0 |

---

## 第二阶段：高级功能

### 10. Workflow API
| 方法 | 路径 | 功能 | 优先级 |
|------|------|------|--------|
| POST | /api/workflows | 创建工作流 | P2 |
| GET | /api/workflows/:id | 获取工作流 | P2 |
| PUT | /api/workflows/:id | 更新工作流 | P2 |
| POST | /api/workflows/:id/execute | 执行工作流 | P2 |

### 11. RAG API
| 方法 | 路径 | 功能 | 优先级 |
|------|------|------|--------|
| POST | /api/rag/query | RAG查询 | P2 |
| POST | /api/rag/index | 添加到索引 | P2 |

### 12. Multi-tenancy API
| 方法 | 路径 | 功能 | 优先级 |
|------|------|------|--------|
| POST | /api/tenants | 创建租户 | P2 |
| GET | /api/tenants/:id | 获取租户 | P2 |
| PUT | /api/tenants/:id | 更新租户 | P2 |

---

## 开发顺序建议

```
Week 1 (P0 核心):
1. Projects CRUD
2. Tasks CRUD + Status
3. Agents CRUD + Status
4. Requirements CRUD + Analyze

Week 2 (P1 重要):
5. Usage Stats
6. API Keys
7. Knowledge
8. Execution Logs

Week 3 (P2 高级):
9. Workflow
10. RAG
11. Multi-tenancy
```

---

## 数据库模型建议

### 核心表
- users
- projects
- agents
- tasks
- requirements
- knowledge
- api_keys
- execution_logs
- usage_logs

### 关系
- project has many tasks
- project has many agents (through project_agents)
- task belongs to project
- requirement belongs to project
- agent has many executions
