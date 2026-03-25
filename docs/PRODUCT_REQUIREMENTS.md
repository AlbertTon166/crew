# Agent Teams Manager - 产品需求文档

> 版本：V2.1.0  
> 更新：2026-03-25  
> 负责人：马楼（PM + 技术文档工程师）

---

## 一、产品定位与愿景

**一句话描述**：可视化的 Agent Teams 工作流管理平台，让产品需求到软件工程成果验收的全流程可见、可控、可追踪。

**核心用户**：AI Agent 团队管理者（CEO/项目经理），需要同时管理多个 AI Agent、协调任务、追踪进度。

**核心价值**：
- 降低 AI Agent 协作的认知开销
- 让人类管理者清晰看到 Agent 团队在做什么、做到哪一步
- 将非结构化的 Agent 对话转化为结构化的项目任务

---

## 二、界面模块定义

### 2.1 控制台（Dashboard）

**功能**：系统总览，快速了解全局状态。

**组件**：

| 组件 | 内容 |
|------|------|
| 统计卡片 | 项目总数、进行中、已完成、问题数 |
| 资源监控 | CPU/内存/磁盘使用率（可 mock 数据） |
| 智能体状态面板 | 所有 Agent 的实时状态 + 动效 |
| 最近活动时间线 | 最近 10 条系统活动 |

**智能体状态设计**（优化版）：

| 状态 | 视觉 | 动效 |
|------|------|------|
| `idle` 空闲 | 灰色圆点 | 3s 一次微弱呼吸 |
| `online` 在线 | 绿色圆点 + 光晕 | 静态 |
| `busy` 工作 | 橙/蓝渐变 | 扫描线动画，模拟工作节奏 |
| `thinking` 思考 | 紫色脉冲 | 波纹扩散 |
| `error` 异常 | 红色 | 2Hz 警示闪烁 |
| `offline` 离线 | 深灰 | 静态，无存在感 |

**Agent 卡片增强**：
- 底部实时活动流（如："2分钟前完成代码审查"）
- 悬停展开：处理任务数、平均响应时长、当前负载
- 环形健康度指示器
- 个性标签（如 "🎯 专注前端" / "⚡ 快速响应"）

---

### 2.2 项目管理（Projects）

**功能**：项目的全生命周期管理，从需求到验收。

**当前问题**：
- 任务状态太少，无法反映真实工作流
- 没有时间线/甘特图
- 没有任务依赖管理
- Sprint/迭代周期不灵活

**优化后的任务状态流转**：

```
[🆕 新建] → [📋 待领取] → [⚙️ 进行中] → [🔍 待审查] → [✅ 完成]
                      ↓
                [🚫 阻塞中] → 解阻后继续
```

**页面布局**：

| 视图 | 内容 |
|------|------|
| 看板 | 当前迭代的任务卡片，拖拽切换状态 |
| 时间线 | 甘特图，展示任务起止时间和依赖 |
| 里程碑 | 关键节点标记 |
| 成员负载 | 各 Agent/成员的任务分布 |

**周期管理**：
- 支持 1周 / 2周 / 4周 迭代周期配置
- 支持"持续交付"模式（无固定 Sprint）
- 支持自定义工作日（5天/6天/弹性）

**任务属性**：
```
任务 = {
  id,
  title,
  description,
  status,
  assignee: AgentId,
  dependsOn: TaskId[],    // 依赖任务
  blockedBy: TaskId[],   // 阻塞此任务的任务
  estimatedHours,
  actualHours,
  priority: P0/P1/P2/P3,
  sprintId,
  milestoneId,
  executions: TaskExecution[],
  createdAt,
  updatedAt
}
```

**快捷操作**：
- `Ctrl+K`：快速创建任务
- 右键菜单：直接拖入相邻状态
- 批量选择：多选 → 批量分配/移动/删除

---

### 2.3 需求池（Requirements）

**功能**：接收、澄清、确认需求，对接 PM Agent。

**当前问题**：PM Agent 话术不严格，需求模糊时沟通成本高。

**优化后的 PM Agent 对话规则**：

#### 阶段1：需求接收（开放提问）

触发：用户描述需求时

```
"收到。请告诉我：
1. 这个需求是为了解决什么问题？
2. 涉及哪些角色/系统？
3. 有没有参考案例或约束条件？"
```

#### 阶段2：结构化澄清（封闭确认）

触发：收到初步需求后

```
"我的理解是：[复述需求]
- 目标：[确认目标]
- 范围：[确认范围]
- 优先级：[P0/P1/P2]
- 截止：[日期]

请确认或纠正。"
```

#### 阶段3：细节补全（信息收集）

触发：确认需求后

```
"还缺以下信息才能排期：
□ [缺失项1]
□ [缺失项2]

请补充，或告诉我哪些可以后补。"
```

#### 模糊需求处理

触发：需求缺少主语/动词/宾语

```
"这个描述我还没理解清楚。能否用一个完整的句子描述：
[谁] + [做什么] + [得到什么结果]？
例如：'让用户可以通过微信登录'"
```

#### 需求确认输出

确认后生成结构化确认单：

```
## 需求确认单
- ID: REQ-2026-XXXX
- 标题: [一句话描述]
- 目标: [解决什么问题]
- 范围: [做什么 / 不做什么]
- 优先级: P0/P1/P2
- 预计工时: [TBD/估算]
- 状态: ⏳ 待评审
```

#### 核心原则

**3轮内明确需求，否则升级**：如果3轮对话后需求仍不清晰，提示用户"需求过于模糊，已标记为草稿，可在补充信息后重新激活"。

**需求状态流转**：

```
[💬 用户输入] → [🔍 待澄清] → [⏳ 确认中] → [✅ 已确认] / [❌ 已拒绝]
                                    ↓
                              [📝 草稿]（3轮后仍模糊）
```

---

### 2.4 智能体管理（Agents）

**功能**：配置和管理团队中的 AI Agent。

**功能列表**：

| 功能 | 说明 |
|------|------|
| Agent 列表 | 卡片/表格视图，显示角色、状态、模型 |
| 新增 Agent | 创建新的 Agent 配置 |
| 编辑配置 | 修改 Agent 名称、角色、模型、System Prompt |
| 启用/禁用 | 开关控制，禁用后不参与任务分配 |
| 模型配置 | API Provider + Model 名称 |
| 角色配置 | System Prompt 编辑 |
| 技能绑定 | 将技能标签分配给 Agent |

**Agent 属性**：

```typescript
interface Agent {
  id: string
  name: string
  role: 'pm' | 'planner' | 'coder' | 'reviewer' | 'tester' | 'deployer'
  modelProvider: 'openai' | 'anthropic' | 'deepseek' | 'other'
  modelName: string
  systemPrompt: string
  skills: string[]
  status: 'online' | 'offline' | 'busy' | 'idle' | 'error'
  enabled: boolean
  personality?: string  // 个性标签
  avgResponseTime?: string
  taskCount?: number
  createdAt: string
}
```

---

### 2.5 知识库（Knowledge）

**功能**：职业能力资源市场 + 个人知识管理。

**重新定位**：不再是 hardcoded 模板，而是**团队共享的职业能力知识库**。

**用户反馈**：
- "知识库不合逻辑，需求是管理和改进和进化职业"
- "应该表示是用户对这部分是否有需求"
- "如果分析需求不大可以就改成可以看有哪些比较完善可用的职业消息展示"

**新的页面结构 - 3个Tab**：

| Tab | 功能 | 用户价值 |
|-----|------|---------|
| 📚 **发现** | 浏览团队已沉淀的职业知识库 | "有哪些可用的？" |
| ⭐ **我的订阅** | 用户关注/收藏的职业技能 | "我最相关的有哪些？" |
| ✏️ **贡献** | 用户贡献或编辑职业知识 | "我能帮团队沉淀什么？" |

**职业知识模型**：

```typescript
interface JobKnowledge {
  id: string
  title: string                    // "前端开发工程师"
  titleEn: string
  category: 'engineering' | 'product' | 'design' | 'operations'
  capabilities: string[]            // 核心能力
  tools: { name: string; link?: string }[]
  bestPractices: string[]
  resources: { title: string; link: string }[]
  completeness: number              // 完善度 0-100
  qualityScore: number              // 质量评分（使用者反馈）
  subscribers: number              // 订阅数
  lastUpdatedBy: string
  updatedAt: string
}
```

**关键交互**：
- **搜索优先**：顶部搜索栏支持模糊匹配职业/工具/技能
- **质量指标**：类似 npm 的 popularity + maintenance 指标
- **订阅制**：用户订阅职业后，首页高亮显示相关知识
- **完善度进度条**：显示"该职业知识完善程度"，鼓励贡献

---

### 2.6 API 文档（APIDoc）

**功能**：展示系统 API 接口文档。

**内容**：
- 基础 URL 配置
- 认证方式（Bearer Token）
- 接口列表（按模块分组）
- 每个接口：method、path、description、parameters、response example

---

## 三、技术架构（现状与改进）

### 3.1 当前问题

| 问题 | 影响 | 优先级 |
|------|------|--------|
| 后端三套数据层并存（内存/SQLite/PostgreSQL） | 生产数据不稳定 | P0 |
| 前端 API 调用层缺失（api/index.ts 404） | 前端无法正确对接后端 | P0 |
| ChromaDB unhealthy | RAG 功能不可用 | P1 |
| 后端无 TypeScript | 代码质量和可维护性差 | P1 |
| 无单元测试 | 重构风险高 | P1 |
| CORS 全开 | 安全风险 | P1 |
| Docker socket 挂载 | 安全风险 | P1 |
| 无 CI/CD | 部署效率低 | P2 |

### 3.2 建议的技术改进

**Phase 1（核心打通）**：
1. 统一数据层：选择 PostgreSQL 作为主力，删除/注释 demo 代码
2. 修复前后端字段映射
3. 补全 API 服务层
4. 修复 ChromaDB 健康检查

**Phase 2（质量提升）**：
5. 后端 TypeScript 迁移
6. 添加基础单元测试
7. 统一错误处理和日志
8. CORS 配置收紧

**Phase 3（功能完善）**：
9. TeamWizard 团队模板
10. WebSocket 实时状态
11. CI/CD 流水线
12. PM Agent 前端体验优化

---

## 四、非功能性需求

### 4.1 性能
- 页面首屏加载 < 2s
- API 响应 < 500ms
- 支持 100+ Agent 同时在线

### 4.2 安全
- 认证：JWT + 7天自动过期
- 密码：加盐 Hash
- 登录锁定：15分钟 5次失败
- HTTPS：Let's Encrypt 或 Cloudflare Tunnel

### 4.3 可用性
- Docker 一键部署
- 健康检查端点
- 优雅关闭

---

## 五、优先级排序（V2.1.0）

| 优先级 | 功能 | 说明 |
|--------|------|------|
| P0 | 前端能完整访问，数据不丢 | 先让 demo 可用 |
| P0 | Dashboard Agent 动效 | 提升视觉体验 |
| P1 | PM Agent 话术规则 | 提高需求确认质量 |
| P1 | 项目管理状态流转 + 看板 | 核心功能 |
| P2 | 知识库重构（发现/订阅/贡献） | 提升可用性 |
| P2 | 项目甘特图/时间线 | 增强管理能力 |
| P3 | CI/CD + 自动化测试 | 长期质量 |

---

## 六、竞品参考

- **Linear** — 极简项目管理，状态流转设计参考
- **GitHub Projects** — 看板实现参考
- **Jira** — 完整项目管理功能参考（但避免过度复杂）
- **CrewAI / AutoGen** — Multi-Agent 编排参考

---

## 七、待确认事项

1. **数据层选择**：SQLite（简单）还是 PostgreSQL（生产）？
2. **后端语言**：继续 JavaScript 还是迁移 TypeScript？
3. **部署场景**：内网使用还是对外服务？
4. **优先级确认**：上面的功能优先级排序是否合适？

---

*本文档由 Agent Teams Manager AI 助手（马楼）生成，仅供参考，实际以 CEO 确认为准。*
