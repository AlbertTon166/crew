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
  requirements: [],
  knowledge: []
}

// Initialize with demo data
function initDemoData() {
  const now = new Date().toISOString()
  
  // Demo agents (new model)
  db.agents = [
    { id: uuidv4(), name: 'Product Manager Agent', role: 'pm', modelProvider: 'openai', modelName: 'gpt-4', status: 'online', userId: null, createdAt: now, updatedAt: now },
    { id: uuidv4(), name: 'Architect Agent', role: 'architect', modelProvider: 'openai', modelName: 'gpt-4', status: 'online', userId: null, createdAt: now, updatedAt: now },
    { id: uuidv4(), name: 'Code Agent', role: 'coder', modelProvider: 'openai', modelName: 'gpt-4', status: 'online', userId: null, createdAt: now, updatedAt: now },
    { id: uuidv4(), name: 'Review Agent', role: 'reviewer', modelProvider: 'openai', modelName: 'gpt-4', status: 'idle', userId: null, createdAt: now, updatedAt: now },
    { id: uuidv4(), name: 'Test Agent', role: 'tester', modelProvider: 'openai', modelName: 'gpt-4', status: 'offline', userId: null, createdAt: now, updatedAt: now },
  ]

  // Demo projects (new model)
  db.projects = [
    { id: uuidv4(), name: 'E-commerce API', description: '电商后端API开发', status: 'active', userId: null, createdAt: now, updatedAt: now },
    { id: uuidv4(), name: 'Data Pipeline', description: '数据清洗管道', status: 'active', userId: null, createdAt: now, updatedAt: now },
    { id: uuidv4(), name: 'AI Chatbot', description: '智能客服机器人', status: 'completed', userId: null, createdAt: now, updatedAt: now },
  ]

  // Demo tasks (new model)
  db.tasks = [
    { id: uuidv4(), projectId: db.projects[0].id, title: '设计RESTful API', description: '完成用户模块API设计', status: 'in_progress', priority: 'high', assigneeId: db.agents[1].id, createdAt: now, updatedAt: now },
    { id: uuidv4(), projectId: db.projects[0].id, title: '数据库建模', description: '设计商品表结构', status: 'completed', priority: 'high', assigneeId: db.agents[0].id, createdAt: now, updatedAt: now },
    { id: uuidv4(), projectId: db.projects[0].id, title: '单元测试', description: '编写API单元测试', status: 'pending', priority: 'medium', assigneeId: db.agents[3].id, createdAt: now, updatedAt: now },
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

// ==================== Projects APIs (Phase 1) ====================

// GET /api/projects - List all projects (legacy)
app.get('/api/projects', (req, res) => {
  res.json({ success: true, data: db.projects })
})

// POST /api/projects - Create a new project
app.post('/api/projects', (req, res) => {
  const { name, description, userId } = req.body
  
  if (!name) {
    return res.status(400).json({ success: false, error: 'Project name is required' })
  }
  
  const now = new Date().toISOString()
  const project = {
    id: uuidv4(),
    name,
    description: description || '',
    status: 'active',
    userId: userId || null,
    createdAt: now,
    updatedAt: now
  }
  
  db.projects.push(project)
  res.status(201).json({ success: true, data: project })
})

// GET /api/projects/:id - Get project details
app.get('/api/projects/:id', (req, res) => {
  const project = db.projects.find(p => p.id === req.params.id)
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' })
  }
  
  const tasks = db.tasks.filter(t => t.projectId === project.id)
  res.json({ success: true, data: { ...project, tasks } })
})

// PUT /api/projects/:id - Update project
app.put('/api/projects/:id', (req, res) => {
  const index = db.projects.findIndex(p => p.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Project not found' })
  }
  
  const { name, description, status, userId } = req.body
  const project = db.projects[index]
  
  if (name !== undefined) project.name = name
  if (description !== undefined) project.description = description
  if (status !== undefined) project.status = status
  if (userId !== undefined) project.userId = userId
  project.updatedAt = new Date().toISOString()
  
  res.json({ success: true, data: project })
})

// DELETE /api/projects/:id - Delete project
app.delete('/api/projects/:id', (req, res) => {
  const index = db.projects.findIndex(p => p.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Project not found' })
  }
  
  // Delete associated tasks
  db.tasks = db.tasks.filter(t => t.projectId !== req.params.id)
  db.projects.splice(index, 1)
  
  res.json({ success: true, data: { message: 'Project deleted successfully' } })
})

// GET /api/projects/:id/stats - Get project statistics
app.get('/api/projects/:id/stats', (req, res) => {
  const project = db.projects.find(p => p.id === req.params.id)
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' })
  }
  
  const tasks = db.tasks.filter(t => t.projectId === project.id)
  
  const stats = {
    projectId: project.id,
    projectName: project.name,
    totalTasks: tasks.length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    failedTasks: tasks.filter(t => t.status === 'failed').length,
    tasksByPriority: {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length,
      critical: tasks.filter(t => t.priority === 'critical').length
    }
  }
  
  res.json({ success: true, data: stats })
})

// ==================== Tasks APIs (Phase 1) ====================

// GET /api/tasks - List all tasks (legacy)
app.get('/api/tasks', (req, res) => {
  const { projectId } = req.query
  if (projectId) {
    return res.json({ success: true, data: db.tasks.filter(t => t.projectId === projectId) })
  }
  res.json({ success: true, data: db.tasks })
})

// POST /api/tasks - Create a new task
app.post('/api/tasks', (req, res) => {
  const { projectId, title, description, priority, assigneeId } = req.body
  
  if (!projectId || !title) {
    return res.status(400).json({ success: false, error: 'projectId and title are required' })
  }
  
  // Verify project exists
  const project = db.projects.find(p => p.id === projectId)
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' })
  }
  
  const now = new Date().toISOString()
  const task = {
    id: uuidv4(),
    projectId,
    title,
    description: description || '',
    status: 'pending',
    priority: priority || 'medium',
    assigneeId: assigneeId || null,
    createdAt: now,
    updatedAt: now
  }
  
  db.tasks.push(task)
  res.status(201).json({ success: true, data: task })
})

// GET /api/tasks/:id - Get task details
app.get('/api/tasks/:id', (req, res) => {
  const task = db.tasks.find(t => t.id === req.params.id)
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' })
  }
  
  res.json({ success: true, data: task })
})

// PUT /api/tasks/:id - Update task
app.put('/api/tasks/:id', (req, res) => {
  const index = db.tasks.findIndex(t => t.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Task not found' })
  }
  
  const { title, description, status, priority, assigneeId, projectId } = req.body
  const task = db.tasks[index]
  
  if (title !== undefined) task.title = title
  if (description !== undefined) task.description = description
  if (status !== undefined) task.status = status
  if (priority !== undefined) task.priority = priority
  if (assigneeId !== undefined) task.assigneeId = assigneeId
  if (projectId !== undefined) task.projectId = projectId
  task.updatedAt = new Date().toISOString()
  
  res.json({ success: true, data: task })
})

// DELETE /api/tasks/:id - Delete task
app.delete('/api/tasks/:id', (req, res) => {
  const index = db.tasks.findIndex(t => t.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Task not found' })
  }
  
  db.tasks.splice(index, 1)
  res.json({ success: true, data: { message: 'Task deleted successfully' } })
})

// PUT /api/tasks/:id/status - Update task status only
app.put('/api/tasks/:id/status', (req, res) => {
  const index = db.tasks.findIndex(t => t.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Task not found' })
  }
  
  const { status } = req.body
  const validStatuses = ['pending', 'in_progress', 'completed', 'failed']
  
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false, 
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
    })
  }
  
  db.tasks[index].status = status
  db.tasks[index].updatedAt = new Date().toISOString()
  
  res.json({ success: true, data: db.tasks[index] })
})

// ==================== Agents APIs (Phase 1) ====================

// GET /api/agents - List all agents (legacy)
app.get('/api/agents', (req, res) => {
  res.json({ success: true, data: db.agents })
})

// POST /api/agents - Create a new agent
app.post('/api/agents', (req, res) => {
  const { name, role, modelProvider, modelName, userId } = req.body
  
  if (!name || !role) {
    return res.status(400).json({ success: false, error: 'name and role are required' })
  }
  
  const validRoles = ['pm', 'architect', 'coder', 'reviewer', 'tester', 'deployer']
  if (!validRoles.includes(role)) {
    return res.status(400).json({ 
      success: false, 
      error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
    })
  }
  
  const now = new Date().toISOString()
  const agent = {
    id: uuidv4(),
    name,
    role,
    modelProvider: modelProvider || 'openai',
    modelName: modelName || 'gpt-4',
    status: 'offline',
    userId: userId || null,
    createdAt: now,
    updatedAt: now
  }
  
  db.agents.push(agent)
  res.status(201).json({ success: true, data: agent })
})

// GET /api/agents/:id - Get agent details
app.get('/api/agents/:id', (req, res) => {
  const agent = db.agents.find(a => a.id === req.params.id)
  if (!agent) {
    return res.status(404).json({ success: false, error: 'Agent not found' })
  }
  
  // Get tasks assigned to this agent
  const tasks = db.tasks.filter(t => t.assigneeId === agent.id)
  
  res.json({ success: true, data: { ...agent, tasks } })
})

// PUT /api/agents/:id - Update agent
app.put('/api/agents/:id', (req, res) => {
  const index = db.agents.findIndex(a => a.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Agent not found' })
  }
  
  const { name, role, modelProvider, modelName, status, userId } = req.body
  const agent = db.agents[index]
  
  if (name !== undefined) agent.name = name
  if (role !== undefined) agent.role = role
  if (modelProvider !== undefined) agent.modelProvider = modelProvider
  if (modelName !== undefined) agent.modelName = modelName
  if (status !== undefined) agent.status = status
  if (userId !== undefined) agent.userId = userId
  agent.updatedAt = new Date().toISOString()
  
  res.json({ success: true, data: agent })
})

// DELETE /api/agents/:id - Delete agent
app.delete('/api/agents/:id', (req, res) => {
  const index = db.agents.findIndex(a => a.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Agent not found' })
  }
  
  db.agents.splice(index, 1)
  res.json({ success: true, data: { message: 'Agent deleted successfully' } })
})

// PUT /api/agents/:id/status - Update agent status only
app.put('/api/agents/:id/status', (req, res) => {
  const index = db.agents.findIndex(a => a.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Agent not found' })
  }
  
  const { status } = req.body
  const validStatuses = ['online', 'busy', 'idle', 'offline']
  
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false, 
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
    })
  }
  
  db.agents[index].status = status
  db.agents[index].updatedAt = new Date().toISOString()
  
  res.json({ success: true, data: db.agents[index] })
})

// ==================== Knowledge APIs (Phase 1) ====================

// GET /api/knowledge - List all knowledge entries
app.get('/api/knowledge', (req, res) => {
  const { category } = req.query
  if (category) {
    return res.json({ success: true, data: db.knowledge.filter(k => k.category === category) })
  }
  res.json({ success: true, data: db.knowledge })
})

// POST /api/knowledge - Create a new knowledge entry
app.post('/api/knowledge', (req, res) => {
  const { title, content, category, tags } = req.body
  
  if (!title || !content) {
    return res.status(400).json({ success: false, error: 'title and content are required' })
  }
  
  const validCategories = ['role', 'skill', 'workflow', 'other']
  if (category && !validCategories.includes(category)) {
    return res.status(400).json({ 
      success: false, 
      error: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
    })
  }
  
  const now = new Date().toISOString()
  const knowledge = {
    id: uuidv4(),
    title,
    content,
    category: category || 'other',
    tags: tags || [],
    createdAt: now,
    updatedAt: now
  }
  
  db.knowledge.push(knowledge)
  res.status(201).json({ success: true, data: knowledge })
})

// GET /api/knowledge/:id - Get knowledge details
app.get('/api/knowledge/:id', (req, res) => {
  const knowledge = db.knowledge.find(k => k.id === req.params.id)
  if (!knowledge) {
    return res.status(404).json({ success: false, error: 'Knowledge not found' })
  }
  
  res.json({ success: true, data: knowledge })
})

// PUT /api/knowledge/:id - Update knowledge
app.put('/api/knowledge/:id', (req, res) => {
  const index = db.knowledge.findIndex(k => k.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Knowledge not found' })
  }
  
  const { title, content, category, tags } = req.body
  const knowledge = db.knowledge[index]
  
  if (title !== undefined) knowledge.title = title
  if (content !== undefined) knowledge.content = content
  if (category !== undefined) knowledge.category = category
  if (tags !== undefined) knowledge.tags = tags
  knowledge.updatedAt = new Date().toISOString()
  
  res.json({ success: true, data: knowledge })
})

// DELETE /api/knowledge/:id - Delete knowledge
app.delete('/api/knowledge/:id', (req, res) => {
  const index = db.knowledge.findIndex(k => k.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Knowledge not found' })
  }
  
  db.knowledge.splice(index, 1)
  res.json({ success: true, data: { message: 'Knowledge deleted successfully' } })
})

// GET /api/knowledge/search?q= - Search knowledge
app.get('/api/knowledge/search', (req, res) => {
  const { q, category } = req.query
  
  if (!q) {
    return res.status(400).json({ success: false, error: 'Search query q is required' })
  }
  
  let results = db.knowledge.filter(k => 
    k.title.toLowerCase().includes(q.toLowerCase()) ||
    k.content.toLowerCase().includes(q.toLowerCase()) ||
    k.tags.some(tag => tag.toLowerCase().includes(q.toLowerCase()))
  )
  
  if (category) {
    results = results.filter(k => k.category === category)
  }
  
  res.json({ success: true, data: results })
})

// ==================== Requirements APIs (Phase 1) ====================

// GET /api/requirements - List all requirements
app.get('/api/requirements', (req, res) => {
  const { projectId, status } = req.query
  let results = db.requirements
  
  if (projectId) {
    results = results.filter(r => r.projectId === projectId)
  }
  if (status) {
    results = results.filter(r => r.status === status)
  }
  
  res.json({ success: true, data: results })
})

// POST /api/requirements - Create a new requirement
app.post('/api/requirements', (req, res) => {
  const { projectId, title, description, priority } = req.body
  
  if (!projectId || !title) {
    return res.status(400).json({ success: false, error: 'projectId and title are required' })
  }
  
  // Verify project exists
  const project = db.projects.find(p => p.id === projectId)
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' })
  }
  
  const now = new Date().toISOString()
  const requirement = {
    id: uuidv4(),
    projectId,
    title,
    description: description || '',
    status: 'pending',
    priority: priority || 'medium',
    createdAt: now,
    updatedAt: now
  }
  
  db.requirements.push(requirement)
  res.status(201).json({ success: true, data: requirement })
})

// GET /api/requirements/:id - Get requirement details
app.get('/api/requirements/:id', (req, res) => {
  const requirement = db.requirements.find(r => r.id === req.params.id)
  if (!requirement) {
    return res.status(404).json({ success: false, error: 'Requirement not found' })
  }
  
  res.json({ success: true, data: requirement })
})

// PUT /api/requirements/:id - Update requirement
app.put('/api/requirements/:id', (req, res) => {
  const index = db.requirements.findIndex(r => r.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Requirement not found' })
  }
  
  const { title, description, status, priority, projectId } = req.body
  const requirement = db.requirements[index]
  
  if (title !== undefined) requirement.title = title
  if (description !== undefined) requirement.description = description
  if (status !== undefined) requirement.status = status
  if (priority !== undefined) requirement.priority = priority
  if (projectId !== undefined) requirement.projectId = projectId
  requirement.updatedAt = new Date().toISOString()
  
  res.json({ success: true, data: requirement })
})

// DELETE /api/requirements/:id - Delete requirement
app.delete('/api/requirements/:id', (req, res) => {
  const index = db.requirements.findIndex(r => r.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Requirement not found' })
  }
  
  db.requirements.splice(index, 1)
  res.json({ success: true, data: { message: 'Requirement deleted successfully' } })
})

// POST /api/requirements/:id/analyze - AI analyze requirement (mock)
app.post('/api/requirements/:id/analyze', (req, res) => {
  const requirement = db.requirements.find(r => r.id === req.params.id)
  if (!requirement) {
    return res.status(404).json({ success: false, error: 'Requirement not found' })
  }
  
  // Mock AI analysis result
  const analysisResult = {
    requirementId: requirement.id,
    summary: `需求「${requirement.title}」分析完成`,
    suggestedTasks: [
      { title: '技术方案设计', description: '为该需求设计技术实现方案', priority: 'high' },
      { title: '功能开发', description: '实现需求核心功能', priority: 'high' },
      { title: '测试验证', description: '编写测试用例并验证', priority: 'medium' }
    ],
    estimatedComplexity: 'medium',
    suggestedAgents: ['architect', 'coder'],
    risks: ['可能涉及多方系统对接', '需要考虑性能优化'],
    recommendations: [
      '建议先完成技术方案评审',
      '注意与现有系统的兼容性',
      '建议分阶段交付'
    ],
    analyzedAt: new Date().toISOString()
  }
  
  // Update requirement status to analyzed
  const index = db.requirements.findIndex(r => r.id === req.params.id)
  db.requirements[index].status = 'analyzed'
  db.requirements[index].updatedAt = new Date().toISOString()
  
  res.json({ success: true, data: analysisResult })
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Agent Teams Manager running on http://localhost:${PORT}`)
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard/stats`)
  console.log(`📁 Projects: http://localhost:${PORT}/api/projects`)
  console.log(`🤖 Agents: http://localhost:${PORT}/api/agents`)
})
