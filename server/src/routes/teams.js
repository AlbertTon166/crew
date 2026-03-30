/**
 * Teams API Routes
 * Agent team management using Prisma
 */

import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

/**
 * GET /api/teams - List teams
 */
router.get('/', asyncHandler(async (req, res) => {
  const { projectId, status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (projectId) where.projectId = projectId;
  if (status) where.status = status;
  if (req.user.role !== 'admin') {
    where.tenantId = req.tenantId || null;
  }

  const [teams, total] = await Promise.all([
    prisma.team.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.team.count({ where }),
  ]);

  res.json({
    success: true,
    data: teams,
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
  });
}));

/**
 * GET /api/teams/:id - Get team by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true } },
    },
  });

  if (!team) throw new NotFoundError('Team not found');

  res.json({ success: true, data: team });
}));

/**
 * POST /api/teams - Create team
 */
router.post('/', asyncHandler(async (req, res) => {
  const { name, description, projectId, agentIds = [], workflow, status = 'active' } = req.body;

  if (!name || name.trim() === '') {
    throw new BadRequestError('Team name is required');
  }

  const team = await prisma.team.create({
    data: {
      name: name.trim(),
      description: description || '',
      projectId: projectId || null,
      agentIds,
      workflow: workflow || {},
      status,
      tenantId: req.tenantId || null,
    },
  });

  res.status(201).json({ success: true, data: team });
}));

/**
 * PUT /api/teams/:id - Update team
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, agentIds, workflow, status } = req.body;

  const existing = await prisma.team.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Team not found');

  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined) updates.description = description;
  if (agentIds !== undefined) updates.agentIds = agentIds;
  if (workflow !== undefined) updates.workflow = workflow;
  if (status !== undefined) updates.status = status;

  const team = await prisma.team.update({ where: { id }, data: updates });

  res.json({ success: true, data: team });
}));

/**
 * DELETE /api/teams/:id - Delete team
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.team.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Team not found');

  await prisma.team.delete({ where: { id } });

  res.json({ success: true, message: 'Team deleted successfully' });
}));

export default router;
