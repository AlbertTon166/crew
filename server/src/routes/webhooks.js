/**
 * Webhooks API Routes
 * Webhook management for event notifications
 */

import { Router } from 'express';
import { query, transaction } from '../config/db.js';
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';
import { triggerWebhook } from '../lib/webhook.js';
import crypto from 'crypto';

const router = Router();

router.use(authenticate);

// ============================================
// Webhook Events
// ============================================
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

// ============================================
// Helper: Build tenant filter
// ============================================
function tenantCondition(tenantId, alias = 'w') {
  if (!tenantId) return '';
  return ` AND ${alias}.tenant_id = '${tenantId}' `;
}

// ============================================
// POST /api/webhooks - Create webhook
// ============================================
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
  const tenantId = req.user.tenant_id || null;

  const result = await query(
    `INSERT INTO webhooks (name, url, events, secret, active, tenant_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING id, name, url, events, active, created_at`,
    [name.trim(), url, events, secret, active, tenantId]
  );

  res.status(201).json({
    success: true,
    data: {
      ...result.rows[0],
      secret, // Only returned on creation
    },
  });
}));

// ============================================
// GET /api/webhooks - List webhooks
// ============================================
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, active } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const tenantId = req.user.tenant_id || null;

  let sql = `SELECT id, name, url, events, active, created_at FROM webhooks WHERE 1=1`;
  const params = [];
  let p = 1;

  if (tenantId) {
    sql += ` AND tenant_id = $${p++}`;
    params.push(tenantId);
  }
  if (active !== undefined) {
    sql += ` AND active = $${p++}`;
    params.push(active === 'true');
  }

  sql += ` ORDER BY created_at DESC LIMIT $${p++} OFFSET $${p}`;
  params.push(parseInt(limit), offset);

  const result = await query(sql, params);

  let countSql = `SELECT COUNT(*) FROM webhooks WHERE 1=1`;
  const countParams = [];
  let cp = 1;
  if (tenantId) {
    countSql += ` AND tenant_id = $${cp++}`;
    countParams.push(tenantId);
  }
  if (active !== undefined) {
    countSql += ` AND active = $${cp++}`;
    countParams.push(active === 'true');
  }
  const countResult = await query(countSql, countParams);

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(countResult.rows[0].count),
    },
  });
}));

// ============================================
// GET /api/webhooks/:id - Get webhook
// ============================================
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenant_id || null;

  let sql = `SELECT * FROM webhooks WHERE id = $1`;
  const params = [id];

  if (tenantId) {
    sql += ` AND tenant_id = $2`;
    params.push(tenantId);
  }

  const result = await query(sql, params);

  if (result.rows.length === 0) {
    throw new NotFoundError('Webhook not found');
  }

  // Get recent deliveries
  const deliveriesResult = await query(
    `SELECT id, event, status_code, success, error, attempts, delivered_at
     FROM webhook_deliveries WHERE webhook_id = $1
     ORDER BY delivered_at DESC LIMIT 10`,
    [id]
  );

  res.json({
    success: true,
    data: {
      ...result.rows[0],
      recent_deliveries: deliveriesResult.rows,
    },
  });
}));

// ============================================
// PUT /api/webhooks/:id - Update webhook
// ============================================
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, url, events, active } = req.body;
  const tenantId = req.user.tenant_id || null;

  // Check ownership
  let checkSql = `SELECT id FROM webhooks WHERE id = $1`;
  const checkParams = [id];
  if (tenantId) {
    checkSql += ` AND tenant_id = $2`;
    checkParams.push(tenantId);
  }

  const check = await query(checkSql, checkParams);
  if (check.rows.length === 0) {
    throw new NotFoundError('Webhook not found');
  }

  const updates = [];
  const values = [];
  let p = 1;

  if (name !== undefined) {
    updates.push(`name = $${p++}`);
    values.push(name.trim());
  }
  if (url !== undefined) {
    if (!url.startsWith('http')) {
      throw new BadRequestError('Invalid URL');
    }
    updates.push(`url = $${p++}`);
    values.push(url);
  }
  if (events !== undefined) {
    if (!Array.isArray(events)) {
      throw new BadRequestError('Events must be an array');
    }
    const invalidEvents = events.filter(e => !WEBHOOK_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      throw new BadRequestError(`Invalid events: ${invalidEvents.join(', ')}`);
    }
    updates.push(`events = $${p++}`);
    values.push(events);
  }
  if (active !== undefined) {
    updates.push(`active = $${p++}`);
    values.push(active);
  }

  if (updates.length === 0) {
    throw new BadRequestError('No fields to update');
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE webhooks SET ${updates.join(', ')} WHERE id = $${p} RETURNING id, name, url, events, active, created_at, updated_at`,
    values
  );

  res.json({
    success: true,
    data: result.rows[0],
  });
}));

// ============================================
// DELETE /api/webhooks/:id - Delete webhook
// ============================================
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenant_id || null;

  let sql = `DELETE FROM webhooks WHERE id = $1`;
  const params = [id];

  if (tenantId) {
    sql += ` AND tenant_id = $2`;
    params.push(tenantId);
  }

  sql += ` RETURNING id`;

  const result = await query(sql, params);

  if (result.rows.length === 0) {
    throw new NotFoundError('Webhook not found');
  }

  res.json({
    success: true,
    message: 'Webhook deleted successfully',
  });
}));

// ============================================
// GET /api/webhooks/events - List available events
// ============================================
router.get('/meta/events', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: WEBHOOK_EVENTS,
  });
}));

// ============================================
// POST /api/webhooks/:id/test - Test webhook delivery
// ============================================
router.post('/:id/test', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenant_id || null;

  let sql = `SELECT * FROM webhooks WHERE id = $1`;
  const params = [id];
  if (tenantId) {
    sql += ` AND tenant_id = $2`;
    params.push(tenantId);
  }

  const result = await query(sql, params);
  if (result.rows.length === 0) {
    throw new NotFoundError('Webhook not found');
  }

  const webhook = result.rows[0];

  // Trigger a test event
  await triggerWebhook(webhook, 'test', {
    test: true,
    message: 'This is a test webhook delivery',
    triggered_at: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Test webhook triggered',
  });
}));

export default router;
