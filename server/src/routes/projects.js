/**
 * Projects API Routes
 * CRUD operations for projects using Prisma
 */

import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

/**
 * GET /api/projects - List all projects for current user
 */
router.get('/', asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const where = {
    OR: [
      { userId: req.user.id },
    ],
  };
  
  if (status) {
    where.status = status;
  }
  
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);
  
  res.json({
    success: true,
    data: projects,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
    },
  });
}));

/**
 * GET /api/projects/:id - Get project by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        orderBy: { createdAt: 'desc' },
      },
      agents: true,
      requirements: true,
    },
  });
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  res.json({
    success: true,
    data: project,
  });
}));

/**
 * POST /api/projects - Create new project
 */
router.post('/', asyncHandler(async (req, res) => {
  const { name, description, status = 'active' } = req.body;
  
  if (!name || name.trim() === '') {
    throw new BadRequestError('Project name is required');
  }
  
  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description || '',
      status,
      userId: req.user.id,
    },
  });
  
  res.status(201).json({
    success: true,
    data: project,
  });
}));

/**
 * PUT /api/projects/:id - Update project
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;
  
  const existing = await prisma.project.findUnique({
    where: { id },
    select: { userId: true },
  });
  
  if (!existing) {
    throw new NotFoundError('Project not found');
  }
  
  if (existing.userId !== req.user.id) {
    throw new BadRequestError('Only project owner can update');
  }
  
  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  
  const project = await prisma.project.update({
    where: { id },
    data: updates,
  });
  
  res.json({
    success: true,
    data: project,
  });
}));

/**
 * DELETE /api/projects/:id - Delete project
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const existing = await prisma.project.findUnique({
    where: { id },
    select: { userId: true },
  });
  
  if (!existing) {
    throw new NotFoundError('Project not found');
  }
  
  if (existing.userId !== req.user.id) {
    throw new BadRequestError('Only project owner can delete');
  }
  
  await prisma.project.delete({
    where: { id },
  });
  
  res.json({
    success: true,
    message: 'Project deleted successfully',
  });
}));

/**
 * GET /api/projects/:id/stats - Get project statistics
 */
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const [total, pending, running, completed, blocked] = await Promise.all([
    prisma.task.count({ where: { projectId: id } }),
    prisma.task.count({ where: { projectId: id, status: 'pending' } }),
    prisma.task.count({ where: { projectId: id, status: 'running' } }),
    prisma.task.count({ where: { projectId: id, status: 'completed' } }),
    prisma.task.count({ where: { projectId: id, status: { in: ['failed', 'waiting_retry', 'waiting_human'] } } }),
  ]);
  
  res.json({
    success: true,
    data: {
      total_tasks: total,
      pending_tasks: pending,
      running_tasks: running,
      completed_tasks: completed,
      blocked_tasks: blocked,
    },
  });
}));

export default router;
