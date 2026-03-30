/**
 * Executions API Routes
 * Task execution tracking using Prisma
 */

import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Valid execution statuses
const EXECUTION_STATUSES = ['pending', 'running', 'completed', 'failed'];

/**
 * GET /api/executions - List executions
 */
router.get('/', asyncHandler(async (req, res) => {
  const { taskId, agentId, status, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (taskId) where.taskId = taskId;
  if (agentId) where.agentId = agentId;
  if (status) where.status = status;

  const [executions, total] = await Promise.all([
    prisma.execution.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        task: { select: { id: true, title: true } },
        agent: { select: { id: true, name: true } },
      },
    }),
    prisma.execution.count({ where }),
  ]);

  res.json({
    success: true,
    data: executions,
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
  });
}));

/**
 * GET /api/executions/:id - Get execution by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const execution = await prisma.execution.findUnique({
    where: { id },
    include: {
      task: { select: { id: true, title: true, description: true } },
      agent: { select: { id: true, name: true, role: true } },
    },
  });

  if (!execution) throw new NotFoundError('Execution not found');

  res.json({ success: true, data: execution });
}));

/**
 * POST /api/executions - Create execution record
 */
router.post('/', asyncHandler(async (req, res) => {
  const { taskId, agentId } = req.body;

  if (!taskId) throw new BadRequestError('Task ID is required');
  if (!agentId) throw new BadRequestError('Agent ID is required');

  const [task, agent] = await Promise.all([
    prisma.task.findUnique({ where: { id: taskId } }),
    prisma.agent.findUnique({ where: { agent_id: agentId } }),
  ]);

  if (!task) throw new NotFoundError('Task not found');
  if (!agent) throw new NotFoundError('Agent not found');

  const execution = await prisma.execution.create({
    data: {
      taskId,
      agentId,
      status: 'pending',
    },
  });

  res.status(201).json({ success: true, data: execution });
}));

/**
 * PATCH /api/executions/:id/status - Update execution status
 */
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, result, error } = req.body;

  if (!status || !EXECUTION_STATUSES.includes(status)) {
    throw new BadRequestError(`Invalid status. Must be one of: ${EXECUTION_STATUSES.join(', ')}`);
  }

  const existing = await prisma.execution.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Execution not found');

  const updates = { status };
  if (result !== undefined) updates.result = result;
  if (error !== undefined) updates.error = error;
  if (status === 'completed' || status === 'failed') {
    updates.completedAt = new Date();
  }

  const execution = await prisma.execution.update({ where: { id }, data: updates });

  res.json({ success: true, data: execution });
}));

/**
 * DELETE /api/executions/:id - Delete execution
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.execution.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Execution not found');

  await prisma.execution.delete({ where: { id } });

  res.json({ success: true, message: 'Execution deleted successfully' });
}));

export default router;
