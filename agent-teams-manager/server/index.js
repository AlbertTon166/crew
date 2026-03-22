/**
 * Agent Teams Manager - Backend Server
 * 支持 PostgreSQL + Redis + ChromaDB 真实数据库连接
 */

import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import { 
  initAllDatabases, 
  getPgPool, 
  getRedis, 
  getChroma,
  cacheSet,
  cacheGet 
} from './databases.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

let dbReady = false

// Initialize Databases
async function initDB() {
  try {
    await initAllDatabases()
    dbReady = true
    console.log('✅ Database connection ready')
    
    // Insert demo data if empty
    await insertDemoData()
  } catch (error) {
    console.error('❌ Failed to initialize databases:', error)
    console.log('⚠️ Running in demo mode (in-memory)')
  }
}

// Insert demo data if tables are empty
async function insertDemoData() {
  const pool = getPgPool()
  
  // Check if demo data exists
  const result = await pool.query('SELECT COUNT(*) FROM agents')
  if (parseInt(result.rows[0].count) > 0) {
    console.log('📊 Demo data already exists')
    return
  }
  
  // Demo agents
  const agents = [
    { name: 'Planner Agent', role: 'planner', status: 'online', model_provider: 'openai', model_name: 'gpt-4', enabled: true },
    { name: 'Coder Agent', role: 'coder', status: 'online', model_provider: 'openai', model_name: 'gpt-4', enabled: true },
    { name: 'Review Agent', role: 'reviewer', status: 'idle', model_provider: 'openai', model_name: 'gpt-4', enabled: true },
    { name: 'Test Agent', role: 'tester', status: 'offline', model_provider: 'openai', model_name: 'gpt-4', enabled: false },
  ]
  
  for (const agent of agents) {
    await pool.query(
      'INSERT INTO agents (name, role, status, model_provider, model_name, enabled) VALUES ($1, $2, $3, $4, $5, $6)',
      [agent.name, agent.role, agent.status, agent.model_provider, agent.model_name, agent.enabled]
    )
  }
  
  // Demo projects
  const projects = [
    { name: 'E-commerce API', description: '电商后端API开发', status: 'in_progress' },
    { name: 'Data Pipeline', description: '数据清洗管道', status: 'pending' },
    { name: 'AI Chatbot', description: '智能客服机器人', status: 'completed' },
  ]
  
  for (const project of projects) {
    await pool.query(
      'INSERT INTO projects (name, description, status) VALUES ($1, $2, $3)',
      [project.name, project.description, project.status]
    )
  }
  
  console.log('✅ Demo data inserted')
}

// Health check
app.get('/api/health', async (req, res) => {
  let services = { postgres: 'down', redis: 'down', chromadb: 'down' }
  
  try {
    const pool = getPgPool()
    await pool.query('SELECT 1')
    services.postgres = 'ok'
  } catch (e) {}
  
  try {
    const redis = getRedis()
    await redis.ping()
    services.redis = 'ok'
  } catch (e) {}
  
  try {
    const chroma = getChroma()
    await chroma.heartbeat()
    services.chromadb = 'ok'
  } catch (e) {}
  
  const allOk = Object.values(services).every(s => s === 'ok')
  
  res.json({ 
    status: allOk ? 'ok' : 'degraded', 
    timestamp: new Date().toISOString(),
    services,
    mode: dbReady ? 'production' : 'demo'
  })
})

// Deploy mode status
app.get('/api/status', (req, res) => {
  res.json({
    connected: dbReady,
    mode: process.env.DEPLOY_MODE || 'cloud',
    version: '1.0.0',
    features: {
      auth: process.env.DEPLOY_MODE === 'cloud',
      database: dbReady,
      cache: dbReady,
      vector: dbReady,
    },
    timestamp: new Date().toISOString(),
  })
})

// ==================== Projects APIs ====================

app.get('/api/projects', async (req, res) => {
  try {
    const pool = getPgPool()
    const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

app.post('/api/projects', async (req, res) => {
  try {
    const pool = getPgPool()
    const { name, description, github_repo } = req.body
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' })
    }
    
    const result = await pool.query(
      'INSERT INTO projects (name, description, github_repo, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description || '', github_repo || '', 'pending']
    )
    
    // Invalidate cache
    await cacheDelete('projects:all')
    
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' })
  }
})

app.get('/api/projects/:id', async (req, res) => {
  try {
    const pool = getPgPool()
    const { id } = req.params
    
    const projectResult = await pool.query('SELECT * FROM projects WHERE id = $1', [id])
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    const tasksResult = await pool.query(
      'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at',
      [id]
    )
    
    res.json({
      ...projectResult.rows[0],
      tasks: tasksResult.rows
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' })
  }
})

app.put('/api/projects/:id', async (req, res) => {
  try {
    const pool = getPgPool()
    const { id } = req.params
    const { name, description, status, github_repo } = req.body
    
    const result = await pool.query(
      `UPDATE projects 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           github_repo = COALESCE($4, github_repo),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, description, status, github_repo, id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    await cacheDelete('projects:all')
    
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' })
  }
})

// Project Status Transition with Validation
app.post('/api/projects/:id/transition', async (req, res) => {
  try {
    const pool = getPgPool()
    const { id } = req.params
    const { newStatus } = req.body
    
    if (!newStatus) {
      return res.status(400).json({ error: 'newStatus is required' })
    }
    
    // Get current project
    const current = await pool.query('SELECT * FROM projects WHERE id = $1', [id])
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    const project = current.rows[0]
    const oldStatus = project.status
    
    // Valid state transitions
    const validTransitions = {
      'pending': ['evaluating'],
      'evaluating': ['pending_dev', 'pending'],
      'pending_dev': ['in_progress'],
      'in_progress': ['testing', 'pending_dev'],
      'testing': ['completed', 'in_progress'],
      'completed': [],
      'error': ['pending_dev', 'pending']
    }
    
    if (!validTransitions[oldStatus]?.includes(newStatus)) {
      return res.status(400).json({ 
        error: 'Invalid status transition',
        current: oldStatus,
        requested: newStatus,
        allowed: validTransitions[oldStatus] || []
      })
    }
    
    // Update status
    const result = await pool.query(
      `UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [newStatus, id]
    )
    
    await cacheDelete('projects:all')
    
    // If transitioning to pending_dev, check if recommended_roles is set
    if (newStatus === 'pending_dev' && (!project.recommended_roles || project.recommended_roles.length === 0)) {
      return res.status(400).json({ 
        error: 'Cannot transition to pending_dev without recommended_roles',
        hint: 'Please communicate with PM Agent first to generate recommended team configuration'
      })
    }
    
    res.json({
      project: result.rows[0],
      previousStatus: oldStatus,
      newStatus: newStatus,
      transition: 'success'
    })
  } catch (error) {
    console.error('Status transition error:', error)
    res.status(500).json({ error: 'Failed to transition project status' })
  }
})

// Generate Tasks from Requirements
app.post('/api/projects/:id/generate-tasks', async (req, res) => {
  try {
    const pool = getPgPool()
    const { id } = req.params
    
    // Get project with recommended_roles
    const projectResult = await pool.query('SELECT * FROM projects WHERE id = $1', [id])
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    const project = projectResult.rows[0]
    
    if (!project.recommended_roles || project.recommended_roles.length === 0) {
      return res.status(400).json({ 
        error: 'No recommended_roles found',
        hint: 'Please ensure PM Agent has analyzed requirements first'
      })
    }
    
    // Generate tasks based on recommended roles
    const recommendedRoles = typeof project.recommended_roles === 'string' 
      ? JSON.parse(project.recommended_roles) 
      : project.recommended_roles
    
    const generatedTasks = []
    
    // Common development tasks template
    const taskTemplates = [
      { title: '项目初始化', titleZh: 'Project Initialization', description: '初始化项目结构、配置开发环境、创建基础架构', priority: 'high', estimatedHours: 4 },
      { title: '数据库设计', titleZh: 'Database Design', description: '设计数据库Schema、创建表结构、编写迁移脚本', priority: 'high', estimatedHours: 8 },
      { title: 'API接口开发', titleZh: 'API Development', description: '实现后端API接口，包括CRUD和业务逻辑', priority: 'high', estimatedHours: 16 },
      { title: '前端页面开发', titleZh: 'Frontend Development', description: '实现前端界面和交互功能', priority: 'medium', estimatedHours: 12 },
      { title: '集成测试', titleZh: 'Integration Testing', description: '编写并执行集成测试', priority: 'medium', estimatedHours: 8 },
      { title: '代码审查', titleZh: 'Code Review', description: '代码审查并修复发现的问题', priority: 'medium', estimatedHours: 4 },
      { title: '部署上线', titleZh: 'Deployment', description: '部署到生产环境并验证', priority: 'high', estimatedHours: 4 },
    ]
    
    // Create tasks based on roles
    for (const roleConfig of recommendedRoles) {
      const role = roleConfig.roleId
      const count = roleConfig.minCount || 1
      
      for (let i = 0; i < count; i++) {
        // Assign tasks based on role
        let task = null
        
        if (role === 'planner') {
          task = taskTemplates[0] // Project initialization
        } else if (role === 'frontend') {
          task = taskTemplates[3] // Frontend development
        } else if (role === 'backend') {
          task = taskTemplates[1] // Database design
          // Also add API task for backend
          const apiTask = taskTemplates[2]
          const apiResult = await pool.query(
            `INSERT INTO tasks (project_id, title, title_zh, description, status, priority, assigned_role, estimated_hours)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [id, apiTask.title, apiTask.titleZh, apiTask.description, 'pending', apiTask.priority, role, apiTask.estimatedHours]
          )
          generatedTasks.push(apiResult.rows[0])
        } else if (role === 'reviewer') {
          task = taskTemplates[5] // Code review
        } else if (role === 'tester') {
          task = taskTemplates[4] // Integration testing
        } else if (role === 'deployer') {
          task = taskTemplates[6] // Deployment
        }
        
        if (task) {
          const result = await pool.query(
            `INSERT INTO tasks (project_id, title, title_zh, description, status, priority, assigned_role, estimated_hours)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [id, task.title, task.titleZh, task.description, 'pending', task.priority, role, task.estimatedHours]
          )
          generatedTasks.push(result.rows[0])
        }
      }
    }
    
    res.json({
      project: project,
      generatedTasks: generatedTasks,
      totalTasks: generatedTasks.length,
      message: `Successfully generated ${generatedTasks.length} tasks based on PM recommendations`
    })
  } catch (error) {
    console.error('Generate tasks error:', error)
    res.status(500).json({ error: 'Failed to generate tasks' })
  }
})

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const pool = getPgPool()
    const { id } = req.params
    
    await pool.query('DELETE FROM projects WHERE id = $1', [id])
    
    await cacheDelete('projects:all')
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

// ==================== Tasks APIs ====================

app.get('/api/tasks', async (req, res) => {
  try {
    const pool = getPgPool()
    const { project_id, status } = req.query
    
    let query = 'SELECT * FROM tasks'
    const params = []
    const conditions = []
    
    if (project_id) {
      params.push(project_id)
      conditions.push(`project_id = $${params.length}`)
    }
    
    if (status) {
      params.push(status)
      conditions.push(`status = $${params.length}`)
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    query += ' ORDER BY created_at DESC'
    
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

app.post('/api/tasks', async (req, res) => {
  try {
    const pool = getPgPool()
    const { project_id, title, description, assigned_agent_id } = req.body
    
    if (!project_id || !title) {
      return res.status(400).json({ error: 'Project ID and title are required' })
    }
    
    const result = await pool.query(
      `INSERT INTO tasks (project_id, title, description, assigned_agent_id, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [project_id, title, description || '', assigned_agent_id || null]
    )
    
    await cacheDelete(`tasks:project:${project_id}`)
    
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' })
  }
})

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const pool = getPgPool()
    const { id } = req.params
    const { title, description, status, assigned_agent_id } = req.body
    
    const result = await pool.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           assigned_agent_id = COALESCE($4, assigned_agent_id),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, description, status, assigned_agent_id, id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    // Get project_id for cache invalidation
    const task = result.rows[0]
    await cacheDelete(`tasks:project:${task.project_id}`)
    
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' })
  }
})

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const pool = getPgPool()
    const { id } = req.params
    
    // Get project_id before delete
    const taskResult = await pool.query('SELECT project_id FROM tasks WHERE id = $1', [id])
    
    await pool.query('DELETE FROM tasks WHERE id = $1', [id])
    
    if (taskResult.rows.length > 0) {
      await cacheDelete(`tasks:project:${taskResult.rows[0].project_id}`)
    }
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

// ==================== Task Execution APIs (OpenClaw Integration) ====================

// Import OpenClaw integration (lazy import to avoid circular deps)
let openclawIntegration = null
async function getOpenClawIntegration() {
  if (!openclawIntegration) {
    openclawIntegration = await import('./openclaw-integration.js')
  }
  return openclawIntegration
}

// POST /api/tasks/:id/execute - Dispatch task to an agent
app.post('/api/tasks/:id/execute', async (req, res) => {
  try {
    const { id } = req.params
    const { agentId, agentRole, context } = req.body
    
    if (!agentId && !agentRole) {
      return res.status(400).json({ 
        error: 'Either agentId or agentRole is required' 
      })
    }
    
    const pool = getPgPool()
    
    // Get task details
    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    )
    
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    const task = taskResult.rows[0]
    
    // If no agentId provided, find an available agent by role
    let targetAgentId = agentId
    if (!targetAgentId && agentRole) {
      const agentResult = await pool.query(
        `SELECT id FROM agents WHERE role = $1 AND enabled = true AND status != 'offline' LIMIT 1`,
        [agentRole]
      )
      if (agentResult.rows.length === 0) {
        return res.status(400).json({ 
          error: `No available agent found for role: ${agentRole}` 
        })
      }
      targetAgentId = agentResult.rows[0].id
    }
    
    // Get agent info
    const agentInfoResult = await pool.query(
      'SELECT * FROM agents WHERE id = $1',
      [targetAgentId]
    )
    
    if (agentInfoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' })
    }
    
    const agentInfo = agentInfoResult.rows[0]
    
    // Build task description
    const taskDescription = `${task.title_zh || task.title}\n\n${task.description || ''}`
    
    // Dispatch task via OpenClaw
    const { dispatchTask } = await getOpenClawIntegration()
    const result = await dispatchTask({
      taskId: id,
      agentId: targetAgentId,
      agentRole: agentRole || agentInfo.role,
      task: taskDescription,
      context: context
    })
    
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to dispatch task',
        details: result.error
      })
    }
    
    res.json({
      success: true,
      taskId: id,
      sessionId: result.sessionId,
      agentId: targetAgentId,
      agentName: agentInfo.name,
      message: `Task dispatched to ${agentInfo.name}`
    })
  } catch (error) {
    console.error('Task execution error:', error)
    res.status(500).json({ error: 'Failed to execute task' })
  }
})

// GET /api/tasks/:id/status - Get task execution status
app.get('/api/tasks/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    
    const { getTaskExecutionStatus } = await getOpenClawIntegration()
    const status = await getTaskExecutionStatus(id)
    
    if (status.error) {
      return res.status(404).json({ error: status.error })
    }
    
    res.json(status)
  } catch (error) {
    console.error('Task status error:', error)
    res.status(500).json({ error: 'Failed to get task status' })
  }
})

// POST /api/tasks/:id/complete - Mark task as complete
app.post('/api/tasks/:id/complete', async (req, res) => {
  try {
    const { id } = req.params
    const { success, output, error } = req.body
    
    const { completeTaskExecution } = await getOpenClawIntegration()
    const result = await completeTaskExecution(id, {
      success: success !== false,
      output: output || '',
      error: error || null
    })
    
    if (result.error) {
      return res.status(404).json({ error: result.error })
    }
    
    res.json(result)
  } catch (error) {
    console.error('Task complete error:', error)
    res.status(500).json({ error: 'Failed to complete task' })
  }
})

// GET /api/agents/available - List available agents for dispatch
app.get('/api/agents/available', async (req, res) => {
  try {
    const { listAvailableAgents } = await getOpenClawIntegration()
    const agents = await listAvailableAgents()
    res.json(agents)
  } catch (error) {
    console.error('List available agents error:', error)
    res.status(500).json({ error: 'Failed to list available agents' })
  }
})

// ==================== Agents APIs ====================

app.get('/api/agents', async (req, res) => {
  try {
    const pool = getPgPool()
    const result = await pool.query('SELECT * FROM agents ORDER BY created_at')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agents' })
  }
})

app.post('/api/agents', async (req, res) => {
  try {
    const pool = getPgPool()
    const { name, role, model_provider, model_name, system_prompt, skills, enabled } = req.body
    
    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' })
    }
    
    const result = await pool.query(
      `INSERT INTO agents (name, role, model_provider, model_name, system_prompt, skills, enabled, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'offline') RETURNING *`,
      [name, role, model_provider || 'openai', model_name || 'gpt-4', system_prompt || '', skills || [], enabled !== false]
    )
    
    await cacheDelete('agents:all')
    
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to create agent' })
  }
})

app.put('/api/agents/:id', async (req, res) => {
  try {
    const pool = getPgPool()
    const { id } = req.params
    const { name, role, status, model_provider, model_name, system_prompt, skills, enabled } = req.body
    
    const result = await pool.query(
      `UPDATE agents 
       SET name = COALESCE($1, name),
           role = COALESCE($2, role),
           status = COALESCE($3, status),
           model_provider = COALESCE($4, model_provider),
           model_name = COALESCE($5, model_name),
           system_prompt = COALESCE($6, system_prompt),
           skills = COALESCE($7, skills),
           enabled = COALESCE($8, enabled)
       WHERE id = $9
       RETURNING *`,
      [name, role, status, model_provider, model_name, system_prompt, skills, enabled, id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' })
    }
    
    await cacheDelete('agents:all')
    
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to update agent' })
  }
})

app.delete('/api/agents/:id', async (req, res) => {
  try {
    const pool = getPgPool()
    const { id } = req.params
    
    await pool.query('DELETE FROM agents WHERE id = $1', [id])
    
    await cacheDelete('agents:all')
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete agent' })
  }
})

// ==================== Knowledge APIs ====================

app.get('/api/knowledge', async (req, res) => {
  try {
    // Try ChromaDB first, fallback to memory
    const chroma = getChroma()
    const collection = await chroma.getCollection({ name: 'knowledge_base' })
    const results = await collection.get()
    
    const knowledge = results.ids.map((id, index) => ({
      id,
      ...results.metadatas[index],
      content: results.documents[index]
    }))
    
    res.json(knowledge)
  } catch (error) {
    // Return empty if ChromaDB not available
    res.json([])
  }
})

app.post('/api/knowledge', async (req, res) => {
  try {
    const { title, content, metadata } = req.body
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' })
    }
    
    // Store in ChromaDB
    const chroma = getChroma()
    const collection = await chroma.getCollection({ name: 'knowledge_base' })
    
    const id = `kb-${Date.now()}`
    
    await collection.add({
      id,
      documents: [`${title}\n\n${content}`],
      metadatas: [{ title, ...metadata || {} }]
    })
    
    res.json({ id, title, content })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add knowledge' })
  }
})

// ==================== Dashboard Stats ====================

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const pool = getPgPool()
    
    const projectsResult = await pool.query('SELECT status, COUNT(*) as count FROM projects GROUP BY status')
    const tasksResult = await pool.query('SELECT status, COUNT(*) as count FROM tasks GROUP BY status')
    const agentsResult = await pool.query('SELECT status, COUNT(*) as count FROM agents GROUP BY status')
    
    const stats = {
      totalProjects: 0,
      inProgressProjects: 0,
      completedProjects: 0,
      errorProjects: 0,
      totalTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      totalAgents: 0,
      onlineAgents: 0,
      offlineAgents: 0,
    }
    
    // Calculate project stats
    for (const row of projectsResult.rows) {
      stats.totalProjects += parseInt(row.count)
      if (row.status === 'in_progress') stats.inProgressProjects = parseInt(row.count)
      if (row.status === 'completed') stats.completedProjects = parseInt(row.count)
      if (row.status === 'error') stats.errorProjects = parseInt(row.count)
    }
    
    // Calculate task stats
    for (const row of tasksResult.rows) {
      stats.totalTasks += parseInt(row.count)
      if (row.status === 'pending') stats.pendingTasks = parseInt(row.count)
      if (row.status === 'in_progress') stats.inProgressTasks = parseInt(row.count)
      if (row.status === 'completed') stats.completedTasks = parseInt(row.count)
    }
    
    // Calculate agent stats
    for (const row of agentsResult.rows) {
      stats.totalAgents += parseInt(row.count)
      if (row.status === 'online') stats.onlineAgents = parseInt(row.count)
      if (row.status === 'offline') stats.offlineAgents = parseInt(row.count)
    }
    
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// ==================== Team Templates APIs ====================

app.get('/api/team-templates', (req, res) => {
  res.json([
    { id: 1, name: '小团队', roles: ['coder', 'reviewer'], description: '2-3人敏捷团队' },
    { id: 2, name: '中团队', roles: ['architect', 'coder', 'reviewer', 'tester'], description: '4-5人完整团队' },
    { id: 3, name: '大团队', roles: ['architect', 'pm', 'coder', 'reviewer', 'tester', 'devops'], description: '6人以上专业团队' },
  ])
})

// ==================== Execution Logs APIs ====================

app.get('/api/execution-logs', async (req, res) => {
  try {
    const pool = getPgPool()
    const { task_id, agent_id, limit = 50 } = req.query
    
    let query = 'SELECT * FROM execution_logs'
    const params = []
    const conditions = []
    
    if (task_id) {
      params.push(task_id)
      conditions.push(`task_id = $${params.length}`)
    }
    
    if (agent_id) {
      params.push(agent_id)
      conditions.push(`agent_id = $${params.length}`)
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    query += ` ORDER BY started_at DESC LIMIT $${params.length + 1}`
    params.push(parseInt(limit))
    
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    res.json([])
  }
})

app.post('/api/execution-logs', async (req, res) => {
  try {
    const pool = getPgPool()
    const { task_id, agent_id, agent_name, status, input, output, error, token_used } = req.body
    
    const result = await pool.query(
      `INSERT INTO execution_logs (task_id, agent_id, agent_name, status, input, output, error, token_used, started_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
      [task_id, agent_id, agent_name, status, input, output, error, token_used]
    )
    
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to create execution log' })
  }
})

// ==================== Auth APIs ====================

// Simple password hashing (use bcrypt in production)
function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < 1000; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i % str.length)
    hash = hash & hash
  }
  return 'hash_' + Math.abs(hash).toString(16)
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const pool = getPgPool()
    const { username, email, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }
    
    // Check if user exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    )
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' })
    }
    
    const passwordHash = simpleHash(password)
    
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'user') RETURNING id, username, email, role, created_at`,
      [username, email || null, passwordHash]
    )
    
    res.json({ success: true, user: result.rows[0] })
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const pool = getPgPool()
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }
    
    const passwordHash = simpleHash(password)
    
    const result = await pool.query(
      `SELECT id, username, email, role, created_at FROM users 
       WHERE username = $1 AND password_hash = $2`,
      [username, passwordHash]
    )
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    // Generate simple session token
    const token = simpleHash(username + Date.now())
    
    res.json({
      success: true,
      token,
      user: result.rows[0]
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' })
  }
})

app.get('/api/auth/me', async (req, res) => {
  // Simple auth check - in production use JWT
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  
  try {
    const pool = getPgPool()
    // For demo, just return a mock user if token exists
    // In production, validate JWT token
    res.json({
      id: 'demo-user',
      username: 'admin',
      role: 'admin'
    })
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
})

// ==================== Project Export API ====================

app.get('/api/projects/:id/export', async (req, res) => {
  try {
    const pool = getPgPool()
    const { id } = req.params
    
    // Get project details
    const projectResult = await pool.query('SELECT * FROM projects WHERE id = $1', [id])
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    const project = projectResult.rows[0]
    
    // Get tasks
    const tasksResult = await pool.query(
      'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at',
      [id]
    )
    
    // Get requirements
    const requirementsResult = await pool.query(
      'SELECT * FROM project_requirements WHERE project_id = $1',
      [id]
    )
    
    // Get execution logs
    const logsResult = await pool.query(`
      SELECT el.* FROM execution_logs el
      JOIN tasks t ON el.task_id = t.id
      WHERE t.project_id = $1
      ORDER BY el.started_at DESC
      LIMIT 100
    `, [id])
    
    // Create export data
    const exportData = {
      project: {
        name: project.name,
        description: project.description,
        status: project.status,
        github_repo: project.github_repo,
        created_at: project.created_at,
        exported_at: new Date().toISOString()
      },
      tasks: tasksResult.rows,
      requirements: requirementsResult.rows,
      executionLogs: logsResult.rows
    }
    
    res.json(exportData)
  } catch (error) {
    res.status(500).json({ error: 'Failed to export project' })
  }
})

// ==================== Requirements Upload API ====================

// Max file size: 500KB (to avoid context overflow)
const MAX_FILE_SIZE = 500 * 1024

app.post('/api/projects/:id/requirements', async (req, res) => {
  try {
    const pool = getPgPool()
    const { id } = req.params
    const { title, content, file_name, file_size, file_type } = req.body
    
    // Validate project exists
    const projectResult = await pool.query('SELECT id FROM projects WHERE id = $1', [id])
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    // Check file size limit
    if (file_size && file_size > MAX_FILE_SIZE) {
      return res.status(400).json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB`,
        maxSize: MAX_FILE_SIZE
      })
    }
    
    // Truncate content if too long
    let truncatedContent = content
    if (content && content.length > 50000) {
      truncatedContent = content.substring(0, 50000) + '\n\n[Content truncated due to length...]'
    }
    
    const result = await pool.query(
      `INSERT INTO project_requirements (project_id, title, content, file_name, file_size, file_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, title, truncatedContent, file_name, file_size, file_type]
    )
    
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload requirement' })
  }
})

app.get('/api/projects/:id/requirements', async (req, res) => {
  try {
    const pool = getPgPool()
    const { id } = req.params
    
    const result = await pool.query(
      'SELECT * FROM project_requirements WHERE project_id = $1 ORDER BY created_at DESC',
      [id]
    )
    
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get requirements' })
  }
})

// ==================== PM Agent & Requirements ====================

// Get PM Agent info
app.get('/api/pm-agent', async (req, res) => {
  try {
    // Find or create a PM agent
    const pool = getPgPool()
    let pmAgent = await pool.query("SELECT * FROM agents WHERE role = 'pm' LIMIT 1")
    
    if (pmAgent.rows.length === 0) {
      // Create PM agent if doesn't exist
      const result = await pool.query(
        `INSERT INTO agents (name, role, status, model_provider, model_name, enabled) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        ['Product Manager Agent', 'pm', 'online', 'openai', 'gpt-4', true]
      )
      pmAgent = { rows: [result.rows[0]] }
    }
    
    res.json({
      id: pmAgent.rows[0].id,
      name: pmAgent.rows[0].name,
      role: pmAgent.rows[0].role,
      status: pmAgent.rows[0].status,
      model_provider: pmAgent.rows[0].model_provider,
      model_name: pmAgent.rows[0].model_name,
      enabled: pmAgent.rows[0].enabled
    })
  } catch (error) {
    console.error('PM Agent error:', error)
    res.status(500).json({ error: 'Failed to get PM agent' })
  }
})

// Analyze requirement and generate recommended roles
function analyzeRequirement(content) {
  const text = content.toLowerCase()
  const recommendations = []
  
  // Always include planner
  recommendations.push({
    roleId: 'planner',
    roleName: '规划智能体',
    roleNameEn: 'Planner',
    minCount: 1,
    description: '需求分析、任务分解'
  })
  
  // Analyze keywords for frontend
  if (text.includes('前端') || text.includes('界面') || text.includes('UI') || 
      text.includes('页面') || text.includes('前端开发') || text.includes('react') ||
      text.includes('vue') || text.includes('angular') || text.includes('html') ||
      text.includes('css') || text.includes('javascript') || text.includes('移动端') ||
      text.includes('mobile') || text.includes('web')) {
    recommendations.push({
      roleId: 'frontend',
      roleName: '前端开发',
      roleNameEn: 'Frontend Dev',
      minCount: 1,
      description: '负责界面和交互开发'
    })
  }
  
  // Analyze keywords for backend
  if (text.includes('后端') || text.includes('API') || text.includes('接口') ||
      text.includes('数据库') || text.includes('server') || text.includes('后端开发') ||
      text.includes('node') || text.includes('python') || text.includes('java') ||
      text.includes('golang') || text.includes('微服务') || text.includes('云函数')) {
    recommendations.push({
      roleId: 'backend',
      roleName: '后端开发',
      roleNameEn: 'Backend Dev',
      minCount: 1,
      description: '负责API和数据库开发'
    })
  }
  
  // Analyze keywords for reviewer
  if (text.includes('代码审查') || text.includes('review') || text.includes('审核') ||
      text.includes('质量') || text.includes('安全') || text.includes('性能')) {
    recommendations.push({
      roleId: 'reviewer',
      roleName: '审核智能体',
      roleNameEn: 'Reviewer',
      minCount: 1,
      description: '代码审查和质量把控'
    })
  }
  
  // Analyze keywords for tester
  if (text.includes('测试') || text.includes('test') || text.includes('自动化') ||
      text.includes('单元测试') || text.includes('集成测试') || text.includes('QA')) {
    recommendations.push({
      roleId: 'tester',
      roleName: '测试智能体',
      roleNameEn: 'Tester',
      minCount: 1,
      description: '自动化测试和Bug追踪'
    })
  }
  
  // Default to at least frontend + backend if no specific keywords
  if (recommendations.length <= 1) {
    recommendations.push({
      roleId: 'frontend',
      roleName: '前端开发',
      roleNameEn: 'Frontend Dev',
      minCount: 1,
      description: '负责界面和交互开发'
    })
    recommendations.push({
      roleId: 'backend',
      roleName: '后端开发',
      roleNameEn: 'Backend Dev',
      minCount: 1,
      description: '负责API和数据库开发'
    })
  }
  
  return recommendations
}

// Send requirement to PM Agent
app.post('/api/requirements', async (req, res) => {
  try {
    const { project_id, content } = req.body
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' })
    }
    
    // Simulate PM agent processing
    const pool = getPgPool()
    const pmAgent = await pool.query("SELECT * FROM agents WHERE role = 'pm' LIMIT 1")
    
    if (pmAgent.rows.length === 0) {
      return res.status(404).json({ error: 'PM agent not found' })
    }
    
    // Create requirement record
    const requirementResult = await pool.query(
      `INSERT INTO project_requirements (project_id, title, content, file_name, file_size, file_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [project_id || 'default', 'Requirement', content, 'direct-input', content.length, 'text']
    )
    
    // Analyze requirement and generate recommendations
    const recommendedRoles = analyzeRequirement(content)
    const minTotalAgents = recommendedRoles.reduce((sum, r) => sum + r.minCount, 0)
    
    // Update project's recommended_roles if project exists
    if (project_id && project_id !== 'default') {
      await pool.query(
        'UPDATE projects SET recommended_roles = $1 WHERE id = $2',
        [JSON.stringify(recommendedRoles), project_id]
      )
    }
    
    // Generate PM response with recommendations
    const roleListZh = recommendedRoles.map(r => `${r.minCount}个${r.roleName}`).join('、')
    const pmResponse = {
      id: uuidv4(),
      content: `我已收到您的需求。

经过分析，该项目需要以下智能体配置：

${recommendedRoles.map(r => `• ${r.roleName}：${r.description}（最少${r.minCount}人）`).join('\n')}

**总计：至少 ${minTotalAgents} 个智能体**

您可以在需求确认后，进入"待开"状态配置具体的智能体数量。`,
      contentZh: `我已收到您的需求。

经过分析，该项目需要以下智能体配置：

${recommendedRoles.map(r => `• ${r.roleName}：${r.description}（最少${r.minCount}人）`).join('\n')}

**总计：至少 ${minTotalAgents} 个智能体**

您可以在需求确认后，进入"待开"状态配置具体的智能体数量。`,
      status: 'clarifying',
      source: 'pm',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    res.json({
      requirement: requirementResult.rows[0],
      pm_agent: pmAgent.rows[0],
      message: pmResponse,
      response: pmResponse.contentZh,
      recommended_roles: recommendedRoles,
      min_total_agents: minTotalAgents
    })
  } catch (error) {
    console.error('Requirements error:', error)
    res.status(500).json({ error: 'Failed to process requirement' })
  }
})

// ==================== Initialize and start server ====================
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Agent Teams Manager running on http://localhost:${PORT}`)
    console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard/stats`)
    console.log(`📁 Projects: http://localhost:${PORT}/api/projects`)
    console.log(`🤖 Agents: http://localhost:${PORT}/api/agents`)
  })
}).catch((error) => {
  console.error('❌ Failed to start server:', error)
  process.exit(1)
})
