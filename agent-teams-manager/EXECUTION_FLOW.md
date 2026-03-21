# Agent Teams Manager - 核心执行流程设计

## 一、任务执行流程

```
用户提交任务
    ↓
[Planner Agent] 拆解任务 → 生成子任务列表
    ↓
[系统自动分配] 根据Agent角色/技能匹配子任务
    ↓
[各Agent执行] 通过 OpenClaw sessions_spawn 派发任务
    ↓
[结果收集] 存储执行日志、输出、状态
    ↓
[Dashboard展示] 实时显示执行轨迹
```

## 二、核心数据模型

### TaskExecution 任务执行记录
```typescript
interface TaskExecution {
  id: string
  taskId: string              // 关联项目任务
  parentTaskId?: string       // 父任务ID（用于拆解）
  agentId: string             // 执行Agent
  agentName: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  input: string               // 输入描述
  output?: string             // 执行结果
  error?: string              // 错误信息
  startedAt?: string
  completedAt?: string
  sessionId?: string          // OpenClaw session ID
}
```

### Agent 模型
```typescript
interface Agent {
  id: string
  name: string
  role: 'planner' | 'coder' | 'reviewer' | 'tester' | 'deployer'
  modelProvider: string
  modelName: string
  systemPrompt: string
  skills: string[]
  enabled: boolean
}
```

### ProjectTask 任务
```typescript
interface ProjectTask {
  id: string
  projectId: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'subtask_pending' | 'completed' | 'failed'
  assignedAgentId?: string
  executions: TaskExecution[]
  createdAt: string
  updatedAt: string
}
```

## 三、Agent角色定义

| 角色 | 职责 | 技能标签 |
|------|------|----------|
| **Planner** | 理解需求、拆解任务、制定计划 | planning, task-decomposition |
| **Coder** | 编写代码、实现功能 | coding, frontend, backend, fullstack |
| **Reviewer** | Code Review、安全检查 | code-review, security, best-practices |
| **Tester** | 编写测试、验证功能 | testing, qa, test-automation |
| **Deployer** | 部署、运维、监控 | devops, deployment, docker, kubernetes |

## 四、任务分配算法

```
1. 解析子任务描述，提取技能关键词
2. 遍历在线且enabled的Agent
3. 计算技能匹配度得分
4. 选择得分最高的Agent
5. 如无匹配，标记为"需要人工分配"
```

## 五、OpenClaw集成

### 派发任务到Agent
```javascript
// 使用 sessions_spawn 派发任务
const session = await sessions_spawn({
  runtime: 'subagent',
  agentId: 'coder-agent-1',  // 对应Agent配置
  task: `完成以下任务：${subtask.description}`,
  mode: 'session'
})
```

### 收集执行结果
- 通过 `sessions_history` 获取Agent执行日志
- 解析最后一条消息作为输出
- 更新 TaskExecution 状态

## 六、Dashboard 实时展示

- **任务看板**：Kanban风格查看每个项目任务状态
- **执行时间线**：每个任务的执行轨迹（Planner → Coder → Reviewer）
- **Agent状态**：实时显示在线/忙碌/离线
- **日志输出**：点击任务查看完整执行日志
