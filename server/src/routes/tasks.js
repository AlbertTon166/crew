/**
 * Tasks API Routes
 * CRUD operations with status transitions using Prisma
 */

import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Valid task statuses
const TASK_STATUSES = ['pending', 'running', 'waiting_retry', 'waiting_human', 'fallback', 'failed', 'completed', 'skipped'];

// Valid status transitions
const STATUS_TRANSITIONS = {
  pending: ['running', 'skipped'],
  running: ['completed', 'failed', 'waiting_retry', 'waiting_human', 'fallback'],
  waiting_retry: ['running', 'failed'],
  waiting_human: ['running', 'skipped', 'failed'],
  fallback: ['completed', 'failed'],
  failed: ['pending', 'skipped'],
  completed: [],
  skipped: [],
};

/**
 * GET /api/tasks - List tasks
 */
router.get('/', asyncHandler(async (req, res) => {
  const { projectId, status, assigneeId, priority, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const where = {};
  
  if (projectId) where.projectId = projectId;
  if (status) where.status = status;
  if (assigneeId) where.assigneeId = assigneeId;
  if (priority) where.priority = priority;
  
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.task.count({ where }),
  ]);
  
  res.json({
    success: true,
    data: tasks,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
    },
  });
}));

/**
 * GET /api/tasks/:id - Get task by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  });
  
  if (!task) {
    throw new NotFoundError('Task not found');
  }
  
  res.json({
    success: true,
    data: task,
  });
}));

/**
 * POST /api/tasks - Create new task
 */
router.post('/', asyncHandler(async (req, res) => {
  const { projectId, title, description, priority = 'medium', assigneeId } = req.body;
  
  if (!title || title.trim() === '') {
    throw new BadRequestError('Task title is required');
  }
  
  const task = await prisma.task.create({
    data: {
      projectId: projectId || null,
      title: title.trim(),
      description: description || '',
      status: 'pending',
      priority,
      assigneeId: assigneeId || null,
    },
  });
  
  res.status(201).json({
    success: true,
    data: task,
  });
}));

/**
 * PUT /api/tasks/:id - Update task
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, assigneeId } = req.body;
  
  const existing = await prisma.task.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  
  if (!existing) {
    throw new NotFoundError('Task not found');
  }
  
  // Validate status transition
  if (status && status !== existing.status) {
    if (!STATUS_TRANSITIONS[existing.status]?.includes(status)) {
      throw new BadRequestError(`Cannot transition from ${existing.status} to ${status}`);
    }
  }
  
  const updates = {};
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (priority !== undefined) updates.priority = priority;
  if (assigneeId !== undefined) updates.assigneeId = assigneeId;
  
  const task = await prisma.task.update({
    where: { id },
    data: updates,
  });
  
  res.json({
    success: true,
    data: task,
  });
}));

/**
 * PATCH /api/tasks/:id/status - Update task status only
 */
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !TASK_STATUSES.includes(status)) {
    throw new BadRequestError(`Invalid status. Must be one of: ${TASK_STATUSES.join(', ')}`);
  }
  
  const existing = await prisma.task.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  
  if (!existing) {
    throw new NotFoundError('Task not found');
  }
  
  // Validate status transition
  if (status !== existing.status) {
    if (!STATUS_TRANSITIONS[existing.status]?.includes(status)) {
      throw new BadRequestError(`Cannot transition from ${existing.status} to ${status}`);
    }
  }
  
  const task = await prisma.task.update({
    where: { id },
    data: { status },
  });
  
  res.json({
    success: true,
    data: task,
  });
}));

/**
 * DELETE /api/tasks/:id - Delete task
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const existing = await prisma.task.findUnique({
    where: { id },
    select: { id: true },
  });
  
  if (!existing) {
    throw new NotFoundError('Task not found');
  }
  
  await prisma.task.delete({
    where: { id },
  });
  
  res.json({
    success: true,
    message: 'Task deleted successfully',
  });
}));

export default router;
