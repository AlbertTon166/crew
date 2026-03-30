/**
 * Agents API Routes
 * Agent registration and status management using Prisma
 */

import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Valid agent statuses
const AGENT_STATUSES = ['online', 'offline', 'busy', 'idle', 'error', 'thinking'];

// Valid agent roles
const AGENT_ROLES = ['pm', 'planner', 'coder', 'reviewer', 'tester', 'deployer'];

/**
 * GET /api/agents - List all agents (tenant-scoped)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { status, role, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const where = {};
  
  // Non-admin users only see their own agents
  if (req.user.role !== 'admin') {
    where.userId = req.user.id;
  }
  
  if (status) {
    where.status = status;
  }
  if (role) {
    where.role = role;
  }
  
  const [agents, total] = await Promise.all([
    prisma.agent.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.agent.count({ where }),
  ]);
  
  res.json({
    success: true,
    data: agents,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
    },
  });
}));

/**
 * GET /api/agents/:id - Get agent by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      projects: {
        select: { id: true, name: true },
      },
    },
  });
  
  if (!agent) {
    throw new NotFoundError('Agent not found');
  }
  
  // Non-admin can only see their own agents
  if (req.user.role !== 'admin' && agent.userId !== req.user.id) {
    throw new NotFoundError('Agent not found');
  }
  
  res.json({
    success: true,
    data: agent,
  });
}));

/**
 * POST /api/agents - Register new agent
 */
router.post('/', asyncHandler(async (req, res) => {
  const {
    name,
    role,
    model_provider = 'openai',
    model_name,
    system_prompt,
    skills = [],
    personality,
    enabled = true,
  } = req.body;
  
  if (!name || name.trim() === '') {
    throw new BadRequestError('Agent name is required');
  }
  
  if (!role || !AGENT_ROLES.includes(role)) {
    throw new BadRequestError(`Invalid role. Must be one of: ${AGENT_ROLES.join(', ')}`);
  }
  
  if (!model_name) {
    throw new BadRequestError('Model name is required');
  }
  
  const agent = await prisma.agent.create({
    data: {
      name: name.trim(),
      role,
      modelProvider: model_provider,
      modelName: model_name,
      systemPrompt: system_prompt || '',
      skills: skills || [],
      personality: personality || '',
      status: 'offline',
      enabled,
      userId: req.user.role === 'admin' ? null : req.user.id,
      tenantId: req.tenantId || null,
    },
  });
  
  res.status(201).json({
    success: true,
    data: agent,
  });
}));

/**
 * PUT /api/agents/:id - Update agent
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    role,
    model_provider,
    model_name,
    system_prompt,
    skills,
    personality,
    enabled,
  } = req.body;
  
  const existing = await prisma.agent.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  
  if (!existing) {
    throw new NotFoundError('Agent not found');
  }
  
  // Non-admin can only update their own agents
  if (req.user.role !== 'admin' && existing.userId !== req.user.id) {
    throw new NotFoundError('Agent not found');
  }
  
  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (role !== undefined) {
    if (!AGENT_ROLES.includes(role)) {
      throw new BadRequestError(`Invalid role. Must be one of: ${AGENT_ROLES.join(', ')}`);
    }
    updates.role = role;
  }
  if (model_provider !== undefined) updates.modelProvider = model_provider;
  if (model_name !== undefined) updates.modelName = model_name;
  if (system_prompt !== undefined) updates.systemPrompt = system_prompt;
  if (skills !== undefined) updates.skills = skills;
  if (personality !== undefined) updates.personality = personality;
  if (enabled !== undefined) updates.enabled = enabled;
  
  const agent = await prisma.agent.update({
    where: { id },
    data: updates,
  });
  
  res.json({
    success: true,
    data: agent,
  });
}));

/**
 * PATCH /api/agents/:id/status - Update agent status
 */
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !AGENT_STATUSES.includes(status)) {
    throw new BadRequestError(`Invalid status. Must be one of: ${AGENT_STATUSES.join(', ')}`);
  }
  
  const existing = await prisma.agent.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  
  if (!existing) {
    throw new NotFoundError('Agent not found');
  }
  
  if (req.user.role !== 'admin' && existing.userId !== req.user.id) {
    throw new NotFoundError('Agent not found');
  }
  
  const agent = await prisma.agent.update({
    where: { id },
    data: { status },
  });
  
  res.json({
    success: true,
    data: agent,
  });
}));

/**
 * DELETE /api/agents/:id - Delete agent
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const existing = await prisma.agent.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  
  if (!existing) {
    throw new NotFoundError('Agent not found');
  }
  
  if (req.user.role !== 'admin' && existing.userId !== req.user.id) {
    throw new NotFoundError('Agent not found');
  }
  
  await prisma.agent.delete({
    where: { id },
  });
  
  res.json({
    success: true,
    message: 'Agent deleted successfully',
  });
}));

export default router;
