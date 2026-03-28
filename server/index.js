/**
 * Agent Teams Manager - Simplified Backend Server (Demo)
 * Uses in-memory storage for demo purposes
 */

import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// In-memory storage
const db = {
  projects: [],
  tasks: [],
  agents: [],
  knowledge: []
}

// Initialize with demo data
function initDemoData() {
  // Demo agents
  db.agents = [
    { id: uuidv4(), name: 'Product Manager Agent', role: 'pm', status: 'online', model_provider: 'openai', model_name: 'gpt-4', enabled: true },
    { id: uuidv4(), name: 'Architect Agent', role: 'architect', status: 'online', model_provider: 'openai', model_name: 'gpt-4', enabled: true },
    { id: uuidv4(), name: 'Code Agent', role: 'coder', status: 'online', model_provider: 'openai', model_name: 'gpt-4', enabled: true },
    { id: uuidv4(), name: 'Review Agent', role: 'reviewer', status: 'idle', model_provider: 'openai', model_name: 'gpt-4', enabled: true },
    { id: uuidv4(), name: 'Test Agent', role: 'tester', status: 'offline', model_provider: 'openai', model_name: 'gpt-4', enabled: false },
  ]

  // Demo projects
  db.projects = [
    { id: uuidv4(), name: 'E-commerce API', description: '电商后端API开发', status: 'in_progress', github_repo: '', created_at: new Date().toISOString() },
    { id: uuidv4(), name: 'Data Pipeline', description: '数据清洗管道', status: 'pending', github_repo: '', created_at: new Date().toISOString() },
    { id: uuidv4(), name: 'AI Chatbot', description: '智能客服机器人', status: 'completed', github_repo: '', created_at: new Date().toISOString() },
  ]

  // Demo tasks
  db.tasks = [
    { id: uuidv4(), project_id: db.projects[0].id, title: '设计RESTful API', description: '完成用户模块API设计', status: 'in_progress', assigned_agent_id: db.agents[1].id },
    { id: uuidv4(), project_id: db.projects[0].id, title: '数据库建模', description: '设计商品表结构', status: 'completed', assigned_agent_id: db.agents[0].id },
    { id: uuidv4(), project_id: db.projects[0].id, title: '单元测试', description: '编写API单元测试', status: 'pending', assigned_agent_id: db.agents[3].id },
  ]

  // Demo knowledge
  db.knowledge = [
    { id: uuidv4(), title: '编码规范', content: '遵循PEP8规范，代码必须有注释' },
    { id: uuidv4(), title: 'Git工作流', content: '使用GitFlow分支模型' },
  ]

  console.log('✅ Demo data initialized')
}

initDemoData()

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      postgres: 'demo',
      redis: 'demo', 
      chromadb: 'demo'
    }
  })
})

// Deploy mode status
const DEPLOY_MODE = process.env.DEPLOY_MODE || 'cloud'

app.get('/api/status', (req, res) => {
  res.json({
    connected: true,
    mode: DEPLOY_MODE,
    version: '1.0.0',
    features: {
      auth: DEPLOY_MODE === 'cloud',
      frontend: DEPLOY_MODE === 'cloud',
      monitoring: DEPLOY_MODE === 'cloud',
      teamsSync: true,
    },
    timestamp: new Date().toISOString(),
  })
})

// ==================== Projects APIs ====================

app.get('/api/projects', (req, res) => {
  res.json(db.projects)
})

app.post('/api/projects', (req, res) => {
  const project = {
    id: uuidv4(),
    name: req.body.name,
    description: req.body.description || '',
    status: 'pending',
    github_repo: '',
    created_at: new Date().toISOString()
  }
  db.projects.push(project)
  res.json(project)
})

app.get('/api/projects/:id', (req, res) => {
  const project = db.projects.find(p => p.id === req.params.id)
  if (!project) return res.status(404).json({ error: 'Project not found' })
  
  const tasks = db.tasks.filter(t => t.project_id === project.id)
  res.json({ ...project, tasks })
})

app.put('/api/projects/:id', (req, res) => {
  const index = db.projects.findIndex(p => p.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: 'Project not found' })
  
  db.projects[index] = { ...db.projects[index], ...req.body }
  res.json(db.projects[index])
})

// ==================== Tasks APIs ====================

app.get('/api/tasks', (req, res) => {
  const { project_id } = req.query
  if (project_id) {
    return res.json(db.tasks.filter(t => t.project_id === project_id))
  }
  res.json(db.tasks)
})

app.post('/api/tasks', (req, res) => {
  const task = {
    id: uuidv4(),
    project_id: req.body.project_id,
    title: req.body.title,
    description: req.body.description || '',
    status: 'pending',
    assigned_agent_id: req.body.assigned_agent_id || null,
    created_at: new Date().toISOString()
  }
  db.tasks.push(task)
  res.json(task)
})

app.put('/api/tasks/:id', (req, res) => {
  const index = db.tasks.findIndex(t => t.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: 'Task not found' })
  
  db.tasks[index] = { ...db.tasks[index], ...req.body }
  res.json(db.tasks[index])
})

// ==================== Agents APIs ====================

app.get('/api/agents', (req, res) => {
  res.json(db.agents)
})

app.post('/api/agents', (req, res) => {
  const agent = {
    id: uuidv4(),
    name: req.body.name,
    role: req.body.role || 'coder',
    status: 'offline',
    model_provider: req.body.model_provider || 'openai',
    model_name: req.body.model_name || 'gpt-4',
    enabled: true,
    created_at: new Date().toISOString()
  }
  db.agents.push(agent)
  res.json(agent)
})

app.put('/api/agents/:id', (req, res) => {
  const index = db.agents.findIndex(a => a.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: 'Agent not found' })
  
  db.agents[index] = { ...db.agents[index], ...req.body }
  res.json(db.agents[index])
})

// ==================== Knowledge APIs ====================

app.get('/api/knowledge', (req, res) => {
  res.json(db.knowledge)
})

app.post('/api/knowledge', (req, res) => {
  const item = {
    id: uuidv4(),
    title: req.body.title,
    content: req.body.content,
    created_at: new Date().toISOString()
  }
  db.knowledge.push(item)
  res.json(item)
})

// ==================== Requirements APIs (Routes to PM Agent) ====================

// Get PM agent
app.get('/api/pm-agent', (req, res) => {
  const pmAgent = db.agents.find(a => a.role === 'pm' && a.enabled)
  if (!pmAgent) {
    return res.status(404).json({ error: 'Product Manager agent not found or disabled' })
  }
  res.json(pmAgent)
})

// Send requirement to PM agent for processing
app.post('/api/requirements', (req, res) => {
  const { content, project_id } = req.body
  
  // Find enabled PM agent
  const pmAgent = db.agents.find(a => a.role === 'pm' && a.enabled)
  if (!pmAgent) {
    return res.status(503).json({ 
      error: 'Product Manager agent not available',
      message: '产品经理智能体未连接'
    })
  }
  
  // Create requirement record
  const requirement = {
    id: uuidv4(),
    content,
    project_id: project_id || null,
    status: 'pending',
    assigned_agent_id: pmAgent.id,
    created_at: new Date().toISOString()
  }
  
  // In a real implementation, this would queue the requirement for the PM agent to process
  // For now, we just acknowledge receipt
  res.json({
    requirement,
    pm_agent: pmAgent,
    message: `需求已发送给产品经理智能体: ${pmAgent.name}`
  })
})

// Get requirements for a project
app.get('/api/requirements', (req, res) => {
  const { project_id } = req.query
  // In a real implementation, this would fetch from a requirements table
  // For demo, return empty array
  res.json([])
})

// Update requirement status
app.put('/api/requirements/:id', (req, res) => {
  res.json({ message: 'Requirement updated' })
})

// ==================== Dashboard Stats ====================

app.get('/api/dashboard/stats', (req, res) => {
  const stats = {
    totalProjects: db.projects.length,
    inProgressProjects: db.projects.filter(p => p.status === 'in_progress').length,
    completedProjects: db.projects.filter(p => p.status === 'completed').length,
    errorProjects: db.projects.filter(p => p.status === 'error').length,
    totalTasks: db.tasks.length,
    pendingTasks: db.tasks.filter(t => t.status === 'pending').length,
    inProgressTasks: db.tasks.filter(t => t.status === 'in_progress').length,
    completedTasks: db.tasks.filter(t => t.status === 'completed').length,
    totalAgents: db.agents.length,
    onlineAgents: db.agents.filter(a => a.status === 'online').length,
    offlineAgents: db.agents.filter(a => a.status === 'offline').length,
  }
  res.json(stats)
})

// ==================== Team Templates APIs ====================

app.get('/api/team-templates', (req, res) => {
  res.json([
    { id: 1, name: '小团队', roles: ['coder', 'reviewer'], description: '2-3人敏捷团队' },
    { id: 2, name: '中团队', roles: ['architect', 'coder', 'reviewer', 'tester'], description: '4-5人完整团队' },
    { id: 3, name: '大团队', roles: ['architect', 'pm', 'coder', 'reviewer', 'tester', 'devops'], description: '6人以上专业团队' },
  ])
})

// ==================== Demo APIs ====================

// ==================== Demo API (Static Data - No DB) ====================

const demoData = {
  agents: [
    { id: 'demo-agent-1', name: 'Product Manager Agent', role: 'pm', model_provider: 'openai', model_name: 'gpt-4', status: 'online', avg_response_time: '1.2s', task_count: 2, current_load: 0.3, personality: '专业高效', skills: ['需求分析', '任务分解', '进度追踪'] },
    { id: 'demo-agent-2', name: 'Architect Agent', role: 'architect', model_provider: 'openai', model_name: 'gpt-4', status: 'online', avg_response_time: '1.5s', task_count: 3, current_load: 0.5, personality: '严谨架构', skills: ['系统设计', '技术选型', '性能优化'] },
    { id: 'demo-agent-3', name: 'Code Agent', role: 'coder', model_provider: 'openai', model_name: 'gpt-4', status: 'online', avg_response_time: '2.1s', task_count: 5, current_load: 0.8, personality: '高效编码', skills: ['前端开发', '后端开发', 'API设计'] },
    { id: 'demo-agent-4', name: 'Review Agent', role: 'reviewer', model_provider: 'openai', model_name: 'gpt-4', status: 'idle', avg_response_time: '1.8s', task_count: 1, current_load: 0.1, personality: '严格把关', skills: ['代码审查', '质量把控', 'Bug定位'] },
    { id: 'demo-agent-5', name: 'Test Agent', role: 'tester', model_provider: 'openai', model_name: 'gpt-4', status: 'offline', avg_response_time: '2.5s', task_count: 0, current_load: 0, personality: '测试专家', skills: ['单元测试', '集成测试', '自动化测试'] },
  ],
  projects: [
    { id: 'demo-project-1', name: 'E-commerce API', description: '电商后端API开发', status: 'in_progress', task_count: 8, completed_tasks: 3 },
    { id: 'demo-project-2', name: 'Data Pipeline', description: '数据清洗管道', status: 'pending', task_count: 5, completed_tasks: 0 },
    { id: 'demo-project-3', name: 'AI Chatbot', description: '智能客服机器人', status: 'completed', task_count: 12, completed_tasks: 12 },
  ],
  tasks: [
    { id: 'demo-task-1', title: '设计RESTful API', description: '完成用户模块API设计', status: 'in_progress', priority: 'high', workflow_position: { x: 100, y: 200 }, node_type: 'task', project_name: 'E-commerce API', assignee_name: 'Architect Agent', assignee_role: 'architect' },
    { id: 'demo-task-2', title: '数据库建模', description: '设计商品表结构', status: 'completed', priority: 'high', workflow_position: { x: 200, y: 200 }, node_type: 'task', project_name: 'E-commerce API', assignee_name: 'Architect Agent', assignee_role: 'architect' },
    { id: 'demo-task-3', title: '实现用户注册接口', description: 'POST /api/users/register', status: 'in_progress', priority: 'high', workflow_position: { x: 300, y: 200 }, node_type: 'task', project_name: 'E-commerce API', assignee_name: 'Code Agent', assignee_role: 'coder' },
    { id: 'demo-task-4', title: '编写单元测试', description: '为用户模块编写Jest测试', status: 'pending', priority: 'medium', workflow_position: { x: 400, y: 200 }, node_type: 'task', project_name: 'E-commerce API', assignee_name: 'Test Agent', assignee_role: 'tester' },
    { id: 'demo-task-5', title: '代码审查', description: '审查用户注册代码', status: 'pending', priority: 'medium', workflow_position: { x: 500, y: 200 }, node_type: 'task', project_name: 'E-commerce API', assignee_name: 'Review Agent', assignee_role: 'reviewer' },
  ],
  requirements: [
    { id: 'req-1', title: '用户登录功能', description: '实现邮箱密码登录，支持记住登录状态', status: 'analyzed', priority: 'high', project_name: 'E-commerce API' },
    { id: 'req-2', title: '商品列表展示', description: '分页展示商品列表，支持筛选和搜索', status: 'pending', priority: 'medium', project_name: 'E-commerce API' },
    { id: 'req-3', title: '购物车功能', description: '添加商品到购物车，修改数量，删除商品', status: 'pending', priority: 'high', project_name: 'E-commerce API' },
  ],
  stats: {
    totalAgents: 5,
    totalProjects: 3,
    totalTasks: 15,
    completedTasks: 8,
    runningTasks: 3,
  },
  rolesSummary: [
    { role: 'pm', count: 1, avg_tasks: 2, avg_load: 0.2 },
    { role: 'architect', count: 1, avg_tasks: 3, avg_load: 0.5 },
    { role: 'coder', count: 1, avg_tasks: 5, avg_load: 0.8 },
    { role: 'reviewer', count: 1, avg_tasks: 1, avg_load: 0.1 },
    { role: 'tester', count: 1, avg_tasks: 0, avg_load: 0 },
  ]
}

app.get('/api/demo/overview', (req, res) => {
  res.json({ success: true, data: demoData })
})

app.get('/api/demo/agents', (req, res) => {
  res.json({ success: true, data: demoData.agents })
})

app.get('/api/demo/projects', (req, res) => {
  res.json({ success: true, data: demoData.projects })
})

app.get('/api/demo/tasks', (req, res) => {
  res.json({ success: true, data: demoData.tasks })
})

app.get('/api/demo/roles', (req, res) => {
  res.json({
    success: true,
    data: [
      { role: 'pm', agent_count: 1, agents: 'Product Manager Agent' },
      { role: 'architect', agent_count: 1, agents: 'Architect Agent' },
      { role: 'coder', agent_count: 1, agents: 'Code Agent' },
      { role: 'reviewer', agent_count: 1, agents: 'Review Agent' },
      { role: 'tester', agent_count: 1, agents: 'Test Agent' },
    ]
  })
})
      { role: 'reviewer', agent_count: 1, agents: 'Review Agent' },
      { role: 'tester', agent_count: 1, agents: 'Test Agent' },
    ]
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Agent Teams Manager running on http://localhost:${PORT}`)
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard/stats`)
  console.log(`📁 Projects: http://localhost:${PORT}/api/projects`)
  console.log(`🤖 Agents: http://localhost:${PORT}/api/agents`)
})
