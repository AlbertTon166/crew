/**
 * Agent Teams Manager - Backend Server with PostgreSQL (Prisma ORM)
 */

import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import prisma from './src/lib/prisma.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Initialize demo data in database
async function initDemoData() {
  try {
    // Check if data already exists
    const existingAgents = await prisma.agent.count()
    if (existingAgents > 0) {
      console.log('✅ Database already initialized')
      return
    }

    const now = new Date()

    // Create demo agents
    const agents = await Promise.all([
      prisma.agent.create({
        data: {
          name: 'Product Manager Agent',
          role: 'pm',
          modelProvider: 'openai',
          modelName: 'gpt-4',
          status: 'online',
        }
      }),
      prisma.agent.create({
        data: {
          name: 'Architect Agent',
          role: 'architect',
          modelProvider: 'openai',
          modelName: 'gpt-4',
          status: 'online',
        }
      }),
      prisma.agent.create({
        data: {
          name: 'Code Agent',
          role: 'coder',
          modelProvider: 'openai',
          modelName: 'gpt-4',
          status: 'online',
        }
      }),
      prisma.agent.create({
        data: {
          name: 'Review Agent',
          role: 'reviewer',
          modelProvider: 'openai',
          modelName: 'gpt-4',
          status: 'idle',
        }
      }),
      prisma.agent.create({
        data: {
          name: 'Test Agent',
          role: 'tester',
          modelProvider: 'openai',
          modelName: 'gpt-4',
          status: 'offline',
        }
      }),
    ])

    // Create demo projects
    const projects = await Promise.all([
      prisma.project.create({
        data: {
          name: 'E-commerce API',
          description: '电商后端API开发',
          status: 'active',
        }
      }),
      prisma.project.create({
        data: {
          name: 'Data Pipeline',
          description: '数据清洗管道',
          status: 'active',
        }
      }),
      prisma.project.create({
        data: {
          name: 'AI Chatbot',
          description: '智能客服机器人',
          status: 'completed',
        }
      }),
    ])

    // Create demo tasks
    await Promise.all([
      prisma.task.create({
        data: {
          projectId: projects[0].id,
          title: '设计RESTful API',
          description: '完成用户模块API设计',
          status: 'in_progress',
          priority: 'high',
          assigneeId: agents[1].id,
        }
      }),
      prisma.task.create({
        data: {
          projectId: projects[0].id,
          title: '数据库建模',
          description: '设计商品表结构',
          status: 'completed',
          priority: 'high',
          assigneeId: agents[0].id,
        }
      }),
      prisma.task.create({
        data: {
          projectId: projects[0].id,
          title: '单元测试',
          description: '编写API单元测试',
          status: 'pending',
          priority: 'medium',
          assigneeId: agents[3].id,
        }
      }),
    ])

    // Create demo knowledge
    await Promise.all([
      prisma.knowledge.create({
        data: {
          title: '编码规范',
          content: '遵循PEP8规范，代码必须有注释',
          category: 'role',
          tags: ['编码', '规范'],
        }
      }),
      prisma.knowledge.create({
        data: {
          title: 'Git工作流',
          content: '使用GitFlow分支模型',
          category: 'workflow',
          tags: ['Git', '工作流'],
        }
      }),
    ])

    // Create demo API keys
    await Promise.all([
      prisma.apiKey.create({
        data: {
          name: 'Production OpenAI',
          key: 'sk-proj-' + uuidv4().replace(/-/g, '').substring(0, 32),
          prefix: 'sk-proj-xxx',
          provider: 'openai',
          model: 'gpt-4',
          status: 'active',
          lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
        }
      }),
      prisma.apiKey.create({
        data: {
          name: 'Development Anthropic',
          key: 'sk-ant-' + uuidv4().replace(/-/g, '').substring(0, 32),
          prefix: 'sk-ant-xxx',
          provider: 'anthropic',
          model: 'claude-3-opus',
          status: 'active',
          lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000),
        }
      }),
      prisma.apiKey.create({
        data: {
          name: 'DeepSeek API',
          key: 'sk-dd-' + uuidv4().replace(/-/g, '').substring(0, 32),
          prefix: 'sk-dd-xxx',
          provider: 'deepseek',
          model: 'deepseek-chat',
          status: 'revoked',
        }
      }),
    ])

    // Create usage records for the past 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const tokens = Math.floor(Math.random() * 100000) + 50000
      const cost = tokens * 0.00001

      await prisma.usageRecord.create({
        data: {
          date: dateStr,
          tokens,
          cost,
          agentId: agents[i % agents.length].id,
          projectId: projects[i % projects.length].id,
        }
      })
    }

    console.log('✅ Demo data initialized in database')
  } catch (error) {
    console.error('❌ Error initializing demo data:', error)
  }
}

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        postgres: 'connected',
        redis: 'demo',
        chromadb: 'demo'
      }
    })
  } catch (error) {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        postgres: 'disconnected',
        redis: 'demo',
        chromadb: 'demo'
      }
    })
  }
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

// GET /api/projects - List all projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, data: projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/projects - Create a new project
app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, userId } = req.body

    if (!name) {
      return res.status(400).json({ success: false, error: 'Project name is required' })
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || '',
        status: 'active',
        userId: userId || null,
      }
    })

    res.status(201).json({ success: true, data: project })
  } catch (error) {
    console.error('Error creating project:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/projects/:id - Get project details
app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        tasks: true,
        requirements: true
      }
    })

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' })
    }

    res.json({ success: true, data: project })
  } catch (error) {
    console.error('Error fetching project:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /api/projects/:id - Update project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { name, description, status, userId } = req.body

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(userId !== undefined && { userId }),
      }
    })

    res.json({ success: true, data: project })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Project not found' })
    }
    console.error('Error updating project:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /api/projects/:id - Delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    await prisma.project.delete({
      where: { id: req.params.id }
    })

    res.json({ success: true, data: { message: 'Project deleted successfully' } })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Project not found' })
    }
    console.error('Error deleting project:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/projects/:id/stats - Get project statistics
app.get('/api/projects/:id/stats', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { tasks: true }
    })

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' })
    }

    const tasks = project.tasks

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
  } catch (error) {
    console.error('Error fetching project stats:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ==================== Tasks APIs (Phase 1) ====================

// GET /api/tasks - List all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const { projectId } = req.query

    const tasks = projectId
      ? await prisma.task.findMany({ where: { projectId } })
      : await prisma.task.findMany()

    res.json({ success: true, data: tasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/tasks - Create a new task
app.post('/api/tasks', async (req, res) => {
  try {
    const { projectId, title, description, priority, assigneeId } = req.body

    if (!projectId || !title) {
      return res.status(400).json({ success: false, error: 'projectId and title are required' })
    }

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' })
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description: description || '',
        status: 'pending',
        priority: priority || 'medium',
        assigneeId: assigneeId || null,
      }
    })

    res.status(201).json({ success: true, data: task })
  } catch (error) {
    console.error('Error creating task:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/tasks/:id - Get task details
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id }
    })

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' })
    }

    res.json({ success: true, data: task })
  } catch (error) {
    console.error('Error fetching task:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /api/tasks/:id - Update task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { title, description, status, priority, assigneeId, projectId } = req.body

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(projectId !== undefined && { projectId }),
      }
    })

    res.json({ success: true, data: task })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Task not found' })
    }
    console.error('Error updating task:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /api/tasks/:id - Delete task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await prisma.task.delete({
      where: { id: req.params.id }
    })

    res.json({ success: true, data: { message: 'Task deleted successfully' } })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Task not found' })
    }
    console.error('Error deleting task:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /api/tasks/:id/status - Update task status only
app.put('/api/tasks/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['pending', 'in_progress', 'completed', 'failed']

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      })
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { status }
    })

    res.json({ success: true, data: task })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Task not found' })
    }
    console.error('Error updating task status:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ==================== Agents APIs (Phase 1) ====================

// GET /api/agents - List all agents
app.get('/api/agents', async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, data: agents })
  } catch (error) {
    console.error('Error fetching agents:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/agents - Create a new agent
app.post('/api/agents', async (req, res) => {
  try {
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

    const agent = await prisma.agent.create({
      data: {
        name,
        role,
        modelProvider: modelProvider || 'openai',
        modelName: modelName || 'gpt-4',
        status: 'offline',
        userId: userId || null,
      }
    })

    res.status(201).json({ success: true, data: agent })
  } catch (error) {
    console.error('Error creating agent:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/agents/:id - Get agent details
app.get('/api/agents/:id', async (req, res) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.id },
      include: {
        tasks: { where: { assigneeId: req.params.id } }
      }
    })

    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' })
    }

    res.json({ success: true, data: agent })
  } catch (error) {
    console.error('Error fetching agent:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /api/agents/:id - Update agent
app.put('/api/agents/:id', async (req, res) => {
  try {
    const { name, role, modelProvider, modelName, status, userId } = req.body

    const agent = await prisma.agent.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(modelProvider !== undefined && { modelProvider }),
        ...(modelName !== undefined && { modelName }),
        ...(status !== undefined && { status }),
        ...(userId !== undefined && { userId }),
      }
    })

    res.json({ success: true, data: agent })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Agent not found' })
    }
    console.error('Error updating agent:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /api/agents/:id - Delete agent
app.delete('/api/agents/:id', async (req, res) => {
  try {
    await prisma.agent.delete({
      where: { id: req.params.id }
    })

    res.json({ success: true, data: { message: 'Agent deleted successfully' } })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Agent not found' })
    }
    console.error('Error deleting agent:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /api/agents/:id/status - Update agent status only
app.put('/api/agents/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['online', 'busy', 'idle', 'offline']

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      })
    }

    const agent = await prisma.agent.update({
      where: { id: req.params.id },
      data: { status }
    })

    res.json({ success: true, data: agent })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Agent not found' })
    }
    console.error('Error updating agent status:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ==================== Knowledge APIs (Phase 1) ====================

// GET /api/knowledge - List all knowledge entries
app.get('/api/knowledge', async (req, res) => {
  try {
    const { category } = req.query

    const knowledge = category
      ? await prisma.knowledge.findMany({ where: { category } })
      : await prisma.knowledge.findMany()

    res.json({ success: true, data: knowledge })
  } catch (error) {
    console.error('Error fetching knowledge:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/knowledge - Create a new knowledge entry
app.post('/api/knowledge', async (req, res) => {
  try {
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

    const knowledge = await prisma.knowledge.create({
      data: {
        title,
        content,
        category: category || 'other',
        tags: tags || [],
      }
    })

    res.status(201).json({ success: true, data: knowledge })
  } catch (error) {
    console.error('Error creating knowledge:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/knowledge/:id - Get knowledge details
app.get('/api/knowledge/:id', async (req, res) => {
  try {
    const knowledge = await prisma.knowledge.findUnique({
      where: { id: req.params.id }
    })

    if (!knowledge) {
      return res.status(404).json({ success: false, error: 'Knowledge not found' })
    }

    res.json({ success: true, data: knowledge })
  } catch (error) {
    console.error('Error fetching knowledge:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /api/knowledge/:id - Update knowledge
app.put('/api/knowledge/:id', async (req, res) => {
  try {
    const { title, content, category, tags } = req.body

    const knowledge = await prisma.knowledge.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
      }
    })

    res.json({ success: true, data: knowledge })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Knowledge not found' })
    }
    console.error('Error updating knowledge:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /api/knowledge/:id - Delete knowledge
app.delete('/api/knowledge/:id', async (req, res) => {
  try {
    await prisma.knowledge.delete({
      where: { id: req.params.id }
    })

    res.json({ success: true, data: { message: 'Knowledge deleted successfully' } })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Knowledge not found' })
    }
    console.error('Error deleting knowledge:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/knowledge/search?q= - Search knowledge
app.get('/api/knowledge/search', async (req, res) => {
  try {
    const { q, category } = req.query

    if (!q) {
      return res.status(400).json({ success: false, error: 'Search query q is required' })
    }

    const knowledgeEntries = await prisma.knowledge.findMany()

    let results = knowledgeEntries.filter(k =>
      k.title.toLowerCase().includes(q.toLowerCase()) ||
      k.content.toLowerCase().includes(q.toLowerCase()) ||
      k.tags.some(tag => tag.toLowerCase().includes(q.toLowerCase()))
    )

    if (category) {
      results = results.filter(k => k.category === category)
    }

    res.json({ success: true, data: results })
  } catch (error) {
    console.error('Error searching knowledge:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ==================== Requirements APIs (Phase 1) ====================

// GET /api/requirements - List all requirements
app.get('/api/requirements', async (req, res) => {
  try {
    const { projectId, status } = req.query

    const where = {}
    if (projectId) where.projectId = projectId
    if (status) where.status = status

    const requirements = await prisma.requirement.findMany({ where })

    res.json({ success: true, data: requirements })
  } catch (error) {
    console.error('Error fetching requirements:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/requirements - Create a new requirement
app.post('/api/requirements', async (req, res) => {
  try {
    const { projectId, title, description, priority } = req.body

    if (!projectId || !title) {
      return res.status(400).json({ success: false, error: 'projectId and title are required' })
    }

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' })
    }

    const requirement = await prisma.requirement.create({
      data: {
        projectId,
        title,
        description: description || '',
        status: 'pending',
        priority: priority || 'medium',
      }
    })

    res.status(201).json({ success: true, data: requirement })
  } catch (error) {
    console.error('Error creating requirement:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/requirements/:id - Get requirement details
app.get('/api/requirements/:id', async (req, res) => {
  try {
    const requirement = await prisma.requirement.findUnique({
      where: { id: req.params.id }
    })

    if (!requirement) {
      return res.status(404).json({ success: false, error: 'Requirement not found' })
    }

    res.json({ success: true, data: requirement })
  } catch (error) {
    console.error('Error fetching requirement:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /api/requirements/:id - Update requirement
app.put('/api/requirements/:id', async (req, res) => {
  try {
    const { title, description, status, priority, projectId } = req.body

    const requirement = await prisma.requirement.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(projectId !== undefined && { projectId }),
      }
    })

    res.json({ success: true, data: requirement })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Requirement not found' })
    }
    console.error('Error updating requirement:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /api/requirements/:id - Delete requirement
app.delete('/api/requirements/:id', async (req, res) => {
  try {
    await prisma.requirement.delete({
      where: { id: req.params.id }
    })

    res.json({ success: true, data: { message: 'Requirement deleted successfully' } })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Requirement not found' })
    }
    console.error('Error deleting requirement:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/requirements/:id/analyze - AI analyze requirement (mock)
app.post('/api/requirements/:id/analyze', async (req, res) => {
  try {
    const requirement = await prisma.requirement.findUnique({
      where: { id: req.params.id }
    })

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
    await prisma.requirement.update({
      where: { id: req.params.id },
      data: { status: 'analyzed' }
    })

    res.json({ success: true, data: analysisResult })
  } catch (error) {
    console.error('Error analyzing requirement:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ==================== Workflow APIs (Phase 5) ====================

// Helper to generate random embedding vector
function generateRandomEmbedding(dimensions = 1536) {
  const embedding = []
  for (let i = 0; i < dimensions; i++) {
    embedding.push(Math.random() * 2 - 1)
  }
  return embedding
}

// POST /api/workflows - Create a workflow
app.post('/api/workflows', async (req, res) => {
  try {
    const { name, description, steps } = req.body

    if (!name) {
      return res.status(400).json({ success: false, error: 'Workflow name is required' })
    }

    const workflow = await prisma.workflow.create({
      data: {
        name,
        description: description || '',
        steps: steps || [],
        status: 'draft',
      }
    })

    res.status(201).json({ success: true, data: workflow })
  } catch (error) {
    console.error('Error creating workflow:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/workflows - List all workflows
app.get('/api/workflows', async (req, res) => {
  try {
    const { status } = req.query

    const where = status ? { status } : {}

    const workflows = await prisma.workflow.findMany({ where })

    res.json({ success: true, data: workflows })
  } catch (error) {
    console.error('Error fetching workflows:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/workflows/:id - Get workflow details
app.get('/api/workflows/:id', async (req, res) => {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: req.params.id }
    })

    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' })
    }

    res.json({ success: true, data: workflow })
  } catch (error) {
    console.error('Error fetching workflow:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /api/workflows/:id - Update workflow
app.put('/api/workflows/:id', async (req, res) => {
  try {
    const { name, description, steps, status } = req.body

    const workflow = await prisma.workflow.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(steps !== undefined && { steps }),
        ...(status !== undefined && { status }),
      }
    })

    res.json({ success: true, data: workflow })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Workflow not found' })
    }
    console.error('Error updating workflow:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /api/workflows/:id - Delete workflow
app.delete('/api/workflows/:id', async (req, res) => {
  try {
    await prisma.workflow.delete({
      where: { id: req.params.id }
    })

    res.json({ success: true, data: { message: 'Workflow deleted successfully' } })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Workflow not found' })
    }
    console.error('Error deleting workflow:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/workflows/:id/execute - Execute workflow
app.post('/api/workflows/:id/execute', async (req, res) => {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: req.params.id }
    })

    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' })
    }

    if (workflow.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Workflow must be active to execute' })
    }

    const { input } = req.body || {}
    const executionId = uuidv4()
    const now = new Date().toISOString()

    // Simulate execution
    const executionLog = []

    for (const step of workflow.steps) {
      executionLog.push({
        stepId: step.id,
        stepName: step.name,
        stepType: step.type,
        status: 'completed',
        startedAt: new Date(Date.now() - 1000).toISOString(),
        completedAt: now,
        output: { result: `Mock execution of step: ${step.name}` }
      })
    }

    const executionResult = {
      executionId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      status: 'completed',
      startedAt: new Date(Date.now() - workflow.steps.length * 1000).toISOString(),
      completedAt: now,
      input,
      stepsExecuted: workflow.steps.length,
      executionLog,
      finalOutput: { result: 'Workflow execution completed successfully' }
    }

    res.json({ success: true, data: executionResult })
  } catch (error) {
    console.error('Error executing workflow:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ==================== RAG APIs (Phase 5) ====================

// POST /api/rag/index - Add document to index
app.post('/api/rag/index', async (req, res) => {
  try {
    const { content, metadata } = req.body

    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' })
    }

    const document = await prisma.ragDocument.create({
      data: {
        content,
        metadata: {
          source: metadata?.source || 'unknown',
          category: metadata?.category || 'general',
          tags: metadata?.tags || []
        },
        embedding: JSON.stringify(generateRandomEmbedding(1536)),
      }
    })

    res.status(201).json({
      success: true,
      data: {
        id: document.id,
        indexed: true,
        embeddingSize: 1536
      }
    })
  } catch (error) {
    console.error('Error indexing document:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/rag/query - Query documents
app.post('/api/rag/query', async (req, res) => {
  try {
    const { query, topK = 5, filters } = req.body

    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required' })
    }

    // Simple keyword matching simulation
    const queryTerms = query.toLowerCase().split(/\s+/)

    const allDocs = await prisma.ragDocument.findMany()

    let scoredDocs = allDocs.map(doc => {
      let score = 0
      const contentLower = doc.content.toLowerCase()
      const docMetadata = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata

      // Calculate relevance score
      for (const term of queryTerms) {
        if (contentLower.includes(term)) {
          score += 1
          if (contentLower.includes(query.toLowerCase())) {
            score += 2
          }
        }
      }

      // Check tags match
      if (docMetadata.tags) {
        for (const tag of docMetadata.tags) {
          if (queryTerms.some(term => tag.toLowerCase().includes(term))) {
            score += 0.5
          }
        }
      }

      // Check category match
      if (filters?.category && docMetadata.category === filters.category) {
        score += 1
      }

      return { ...doc, relevanceScore: score, metadata: docMetadata }
    })

    let results = scoredDocs
      .filter(doc => doc.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, topK)
      .map(doc => ({
        id: doc.id,
        content: doc.content,
        metadata: doc.metadata,
        relevanceScore: doc.relevanceScore,
        createdAt: doc.createdAt
      }))

    res.json({
      success: true,
      data: {
        query,
        results,
        totalIndexed: allDocs.length,
        returned: results.length
      }
    })
  } catch (error) {
    console.error('Error querying documents:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ==================== Dashboard Stats ====================

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [projects, tasks, agents] = await Promise.all([
      prisma.project.findMany(),
      prisma.task.findMany(),
      prisma.agent.findMany()
    ])

    const stats = {
      totalProjects: projects.length,
      inProgressProjects: projects.filter(p => p.status === 'in_progress').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      errorProjects: projects.filter(p => p.status === 'error').length,
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      totalAgents: agents.length,
      onlineAgents: agents.filter(a => a.status === 'online').length,
      offlineAgents: agents.filter(a => a.status === 'offline').length,
    }

    res.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({ success: false, error: error.message })
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

// ==================== Usage Stats APIs (Phase 4) ====================

// GET /api/usage/stats - Get total usage statistics
app.get('/api/usage/stats', async (req, res) => {
  try {
    const [usageRecords, projects, agents] = await Promise.all([
      prisma.usageRecord.findMany(),
      prisma.project.findMany(),
      prisma.agent.findMany()
    ])

    const totalTokens = usageRecords.reduce((sum, r) => sum + r.tokens, 0)
    const totalCost = usageRecords.reduce((sum, r) => sum + r.cost, 0)

    // Calculate daily usage
    const dailyMap = new Map()
    usageRecords.forEach(r => {
      const existing = dailyMap.get(r.date) || { date: r.date, tokens: 0, cost: 0 }
      existing.tokens += r.tokens
      existing.cost += r.cost
      dailyMap.set(r.date, existing)
    })
    const dailyUsage = Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date))

    // Calculate project stats
    const projectMap = new Map()
    usageRecords.forEach(r => {
      if (!r.projectId) return
      const project = projects.find(p => p.id === r.projectId)
      if (!project) return
      const existing = projectMap.get(r.projectId) || {
        projectId: r.projectId,
        projectName: project.name,
        tasks: 0,
        tokens: 0,
        cost: 0
      }
      existing.tokens += r.tokens
      existing.cost += r.cost
      existing.tasks += 1
      projectMap.set(r.projectId, existing)
    })
    const projectStats = Array.from(projectMap.values())

    res.json({
      success: true,
      data: {
        totalTokens,
        totalCost,
        agentUsage: [],
        dailyUsage,
        projectStats,
      }
    })
  } catch (error) {
    console.error('Error fetching usage stats:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/usage/agents - Get agent usage statistics
app.get('/api/usage/agents', async (req, res) => {
  try {
    const [usageRecords, agents] = await Promise.all([
      prisma.usageRecord.findMany(),
      prisma.agent.findMany()
    ])

    const agentMap = new Map()

    usageRecords.forEach(r => {
      if (!r.agentId) return
      const agent = agents.find(a => a.id === r.agentId)
      if (!agent) return
      const existing = agentMap.get(r.agentId) || {
        agentId: r.agentId,
        agentName: agent.name,
        tokenUsage: 0,
        cost: 0,
      }
      existing.tokenUsage += r.tokens
      existing.cost += r.cost
      agentMap.set(r.agentId, existing)
    })

    const agentUsage = Array.from(agentMap.values())

    res.json({ success: true, data: agentUsage })
  } catch (error) {
    console.error('Error fetching agent usage:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/usage/costs - Get cost statistics
app.get('/api/usage/costs', async (req, res) => {
  try {
    const [usageRecords, apiKeys] = await Promise.all([
      prisma.usageRecord.findMany(),
      prisma.apiKey.findMany()
    ])

    const totalCost = usageRecords.reduce((sum, r) => sum + r.cost, 0)

    // Cost by provider
    const providerMap = new Map()
    apiKeys.forEach(key => {
      if (key.status !== 'active') return
      const existing = providerMap.get(key.provider) || { provider: key.provider, cost: 0, keys: 0 }
      existing.keys += 1
      const randomCost = Math.random() * 10
      existing.cost += randomCost
      providerMap.set(key.provider, existing)
    })

    // Cost by day
    const dailyMap = new Map()
    usageRecords.forEach(r => {
      const existing = dailyMap.get(r.date) || { date: r.date, cost: 0 }
      existing.cost += r.cost
      dailyMap.set(r.date, existing)
    })

    const costsByDay = Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date))
    const costsByProvider = Array.from(providerMap.values())

    res.json({
      success: true,
      data: {
        totalCost,
        costsByDay,
        costsByProvider,
      }
    })
  } catch (error) {
    console.error('Error fetching costs:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ==================== API Keys APIs (Phase 4) ====================

// POST /api/api-keys - Create a new API key
app.post('/api/api-keys', async (req, res) => {
  try {
    const { name, provider, model } = req.body

    if (!name || !provider) {
      return res.status(400).json({ success: false, error: 'name and provider are required' })
    }

    const validProviders = ['openai', 'anthropic', 'deepseek']
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        error: `Invalid provider. Must be one of: ${validProviders.join(', ')}`
      })
    }

    const prefix = `sk-${provider.substring(0, 3)}-`
    const randomPart = uuidv4().replace(/-/g, '').substring(0, 24)
    const fullKey = prefix + randomPart

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key: fullKey,
        prefix: prefix + 'xxx',
        provider,
        model: model || 'default',
        status: 'active',
      }
    })

    res.status(201).json({ success: true, data: apiKey })
  } catch (error) {
    console.error('Error creating API key:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/api-keys - Get API key list
app.get('/api/api-keys', async (req, res) => {
  try {
    const apiKeys = await prisma.apiKey.findMany()

    res.json({ success: true, data: apiKeys })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /api/api-keys/:id - Delete an API key
app.delete('/api/api-keys/:id', async (req, res) => {
  try {
    await prisma.apiKey.delete({
      where: { id: req.params.id }
    })

    res.json({ success: true, data: { message: 'API key deleted successfully' } })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'API key not found' })
    }
    console.error('Error deleting API key:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ==================== Demo APIs ====================

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

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Agent Teams Manager running on http://localhost:${PORT}`)
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard/stats`)
  console.log(`📁 Projects: http://localhost:${PORT}/api/projects`)
  console.log(`🤖 Agents: http://localhost:${PORT}/api/agents`)

  // Initialize demo data
  await initDemoData()
})
