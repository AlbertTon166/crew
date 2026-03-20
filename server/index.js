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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Agent Teams Manager running on http://localhost:${PORT}`)
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard/stats`)
  console.log(`📁 Projects: http://localhost:${PORT}/api/projects`)
  console.log(`🤖 Agents: http://localhost:${PORT}/api/agents`)
})
