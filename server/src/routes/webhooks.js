/**
 * Webhooks API Routes
 * Webhook management for event notifications using Prisma
 */

import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

router.use(authenticate);

// Valid webhook events
const WEBHOOK_EVENTS = [
  'task.created',
  'task.updated',
  'task.completed',
  'task.failed',
  'task.status_changed',
  'project.created',
  'project.updated',
  'project.status_changed',
  'agent.created',
  'agent.updated',
  'agent.status_changed',
];

/**
 * POST /api/webhooks - Create webhook
 */
router.post('/', asyncHandler(async (req, res) => {
  const { name, url, events, active = true } = req.body;

  if (!name || name.trim() === '') {
    throw new BadRequestError('Webhook name is required');
  }
  if (!url || !url.startsWith('http')) {
    throw new BadRequestError('Valid URL is required');
  }
  if (!events || !Array.isArray(events) || events.length === 0) {
    throw new BadRequestError('At least one event is required');
  }

  // Validate events
  const invalidEvents = events.filter(e => !WEBHOOK_EVENTS.includes(e));
  if (invalidEvents.length > 0) {
    throw new BadRequestError(`Invalid events: ${invalidEvents.join(', ')}. Valid: ${WEBHOOK_EVENTS.join(', ')}`);
  }

  const secret = crypto.randomBytes(32).toString('hex');

  const webhook = await prisma.webhook.create({
    data: {
      name: name.trim(),
      url,
      events,
      secret,
      active,
      tenantId: req.tenantId || null,
    },
    select: {
      id: true,
      name: true,
      url: true,
      events: true,
      active: true,
      createdAt: true,
    },
  });

  res.status(201).json({
    success: true,
    data: {
      ...webhook,
      secret, // Only returned on creation
    },
  });
}));

/**
 * GET /api/webhooks - List webhooks
 */
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  // Tenant scoping
  if (req.user.role !== 'admin') {
    where.tenantId = req.tenantId || null;
  }

  const [webhooks, total] = await Promise.all([
    prisma.webhook.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        active: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.webhook.count({ where }),
  ]);

  res.json({
    success: true,
    data: webhooks,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
    },
  });
}));

/**
 * GET /api/webhooks/:id - Get webhook
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const webhook = await prisma.webhook.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      url: true,
      events: true,
      active: true,
      tenantId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!webhook) {
    throw new NotFoundError('Webhook not found');
  }

  // Tenant check
  if (req.user.role !== 'admin' && webhook.tenantId !== (req.tenantId || null)) {
    throw new NotFoundError('Webhook not found');
  }

  res.json({
    success: true,
    data: webhook,
  });
}));

/**
 * PUT /api/webhooks/:id - Update webhook
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, url, events, active } = req.body;

  const existing = await prisma.webhook.findUnique({
    where: { id },
    select: { id: true, tenantId: true },
  });

  if (!existing) {
    throw new NotFoundError('Webhook not found');
  }

  if (req.user.role !== 'admin' && existing.tenantId !== (req.tenantId || null)) {
    throw new NotFoundError('Webhook not found');
  }

  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (url !== undefined) {
    if (!url.startsWith('http')) {
      throw new BadRequestError('Valid URL is required');
    }
    updates.url = url;
  }
  if (events !== undefined) {
    if (!Array.isArray(events) || events.length === 0) {
      throw new BadRequestError('At least one event is required');
    }
    updates.events = events;
  }
  if (active !== undefined) updates.active = active;

  const webhook = await prisma.webhook.update({
    where: { id },
    data: updates,
    select: {
      id: true,
      name: true,
      url: true,
      events: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({
    success: true,
    data: webhook,
  });
}));

/**
 * POST /api/webhooks/:id/test - Test webhook
 */
router.post('/:id/test', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const webhook = await prisma.webhook.findUnique({
    where: { id },
  });

  if (!webhook) {
    throw new NotFoundError('Webhook not found');
  }

  if (req.user.role !== 'admin' && webhook.tenantId !== (req.tenantId || null)) {
    throw new NotFoundError('Webhook not found');
  }

  // Send test event
  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhook.secret,
        'X-Webhook-Event': 'test',
      },
      body: JSON.stringify({
        event: 'test',
        timestamp: new Date().toISOString(),
      }),
    });

    res.json({
      success: true,
      data: {
        delivered: response.ok,
        statusCode: response.status,
      },
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      data: {
        delivered: false,
        error: error.message,
      },
    });
  }
}));

/**
 * DELETE /api/webhooks/:id - Delete webhook
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.webhook.findUnique({
    where: { id },
    select: { id: true, tenantId: true },
  });

  if (!existing) {
    throw new NotFoundError('Webhook not found');
  }

  if (req.user.role !== 'admin' && existing.tenantId !== (req.tenantId || null)) {
    throw new NotFoundError('Webhook not found');
  }

  await prisma.webhook.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Webhook deleted successfully',
  });
}));

export default router;
