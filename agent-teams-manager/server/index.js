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
