/**
 * Knowledge Base API Routes
 * Document management for RAG using Prisma
 */

import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

/**
 * GET /api/knowledge - List knowledge entries
 */
router.get('/', asyncHandler(async (req, res) => {
  const { projectId, type, search, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (projectId) where.projectId = projectId;
  if (type) where.type = type;

  // Note: Full-text search would require PostgreSQL full-text search or external search engine
  // For now, we return all matching records
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [entries, total] = await Promise.all([
    prisma.knowledge.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { updatedAt: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.knowledge.count({ where }),
  ]);

  res.json({
    success: true,
    data: entries,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
    },
  });
}));

/**
 * GET /api/knowledge/:id - Get knowledge entry
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const entry = await prisma.knowledge.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true } },
    },
  });

  if (!entry) {
    throw new NotFoundError('Knowledge entry not found');
  }

  res.json({
    success: true,
    data: entry,
  });
}));

/**
 * POST /api/knowledge - Create knowledge entry
 */
router.post('/', asyncHandler(async (req, res) => {
  const { projectId, title, content, type = 'documentation', metadata = {} } = req.body;

  if (!title || title.trim() === '') {
    throw new BadRequestError('Title is required');
  }
  if (!content || content.trim() === '') {
    throw new BadRequestError('Content is required');
  }

  const entry = await prisma.knowledge.create({
    data: {
      projectId: projectId || null,
      title: title.trim(),
      content: content.trim(),
      type,
      metadata,
      tenantId: req.tenantId || null,
    },
  });

  res.status(201).json({
    success: true,
    data: entry,
  });
}));

/**
 * PUT /api/knowledge/:id - Update knowledge entry
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, type, metadata } = req.body;

  const existing = await prisma.knowledge.findUnique({
    where: { id },
    select: { id: true, tenantId: true },
  });

  if (!existing) {
    throw new NotFoundError('Knowledge entry not found');
  }

  if (req.user.role !== 'admin' && existing.tenantId !== (req.tenantId || null)) {
    throw new NotFoundError('Knowledge entry not found');
  }

  const updates = {};
  if (title !== undefined) updates.title = title.trim();
  if (content !== undefined) updates.content = content.trim();
  if (type !== undefined) updates.type = type;
  if (metadata !== undefined) updates.metadata = metadata;

  const entry = await prisma.knowledge.update({
    where: { id },
    data: updates,
  });

  res.json({
    success: true,
    data: entry,
  });
}));

/**
 * DELETE /api/knowledge/:id - Delete knowledge entry
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.knowledge.findUnique({
    where: { id },
    select: { id: true, tenantId: true },
  });

  if (!existing) {
    throw new NotFoundError('Knowledge entry not found');
  }

  if (req.user.role !== 'admin' && existing.tenantId !== (req.tenantId || null)) {
    throw new NotFoundError('Knowledge entry not found');
  }

  await prisma.knowledge.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Knowledge entry deleted successfully',
  });
}));

export default router;
