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

app.get('/api/demo/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      agents: db.agents.map(a => ({
        id: a.id,
        name: a.name,
        role: a.role,
        model_provider: a.model_provider,
        model_name: a.model_name,
        status: a.status,
        avg_response_time: '1.2s',
        task_count: db.tasks.filter(t => t.assigned_agent_id === a.id).length,
        current_load: a.status === 'online' ? 0.3 : 0,
        personality: '专业高效',
        skills: ['代码开发', '代码审查', '问题解决']
      })),
      projects: db.projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        task_count: db.tasks.filter(t => t.project_id === p.id).length,
        completed_tasks: db.tasks.filter(t => t.project_id === p.id && t.status === 'completed').length
      })),
      tasks: db.tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: 'medium',
        workflow_position: { x: 100, y: 200 },
        node_type: 'task',
        project_name: db.projects.find(p => p.id === t.project_id)?.name || '',
        assignee_name: db.agents.find(a => a.id === t.assigned_agent_id)?.name || null,
        assignee_role: db.agents.find(a => a.id === t.assigned_agent_id)?.role || null
      })),
      requirements: [
        {
          id: 'req-1',
          title: '用户登录功能',
          description: '实现邮箱密码登录，支持记住登录状态',
          status: 'analyzed',
          priority: 'high',
          project_name: 'E-commerce API'
        },
        {
          id: 'req-2',
          title: '商品列表展示',
          description: '分页展示商品列表，支持筛选和搜索',
          status: 'pending',
          priority: 'medium',
          project_name: 'E-commerce API'
        },
        {
          id: 'req-3',
          title: '购物车功能',
          description: '添加商品到购物车，修改数量，删除商品',
          status: 'pending',
          priority: 'high',
          project_name: 'E-commerce API'
        }
      ],
      stats: {
        totalAgents: db.agents.length,
        totalProjects: db.projects.length,
        totalTasks: db.tasks.length,
        completedTasks: db.tasks.filter(t => t.status === 'completed').length,
        runningTasks: db.tasks.filter(t => t.status === 'in_progress').length,
      },
      rolesSummary: [
        { role: 'pm', count: 1, avg_tasks: 0, avg_load: 0.2 },
        { role: 'architect', count: 1, avg_tasks: 1, avg_load: 0.5 },
        { role: 'coder', count: 1, avg_tasks: 1, avg_load: 0.8 },
        { role: 'reviewer', count: 1, avg_tasks: 0, avg_load: 0.1 },
        { role: 'tester', count: 1, avg_tasks: 0, avg_load: 0 },
      ]
    }
  })
})

app.get('/api/demo/agents', (req, res) => {
  res.json({
    success: true,
    data: db.agents
  })
})

app.get('/api/demo/projects', (req, res) => {
  res.json({
    success: true,
    data: db.projects
  })
})

app.get('/api/demo/tasks', (req, res) => {
  res.json({
    success: true,
    data: db.tasks
  })
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Agent Teams Manager running on http://localhost:${PORT}`)
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard/stats`)
  console.log(`📁 Projects: http://localhost:${PORT}/api/projects`)
  console.log(`🤖 Agents: http://localhost:${PORT}/api/agents`)
})
