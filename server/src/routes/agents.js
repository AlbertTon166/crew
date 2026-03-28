/**
 * Agents API Routes
 * Agent registration and status management
 * 
 * Multi-Tenant Support: All routes enforce tenant isolation via req.tenantId.
 * - Admins (role='admin') can access all agents (tenantId = null → no filter)
 * - Regular users only see agents belonging to their tenant
 */

import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Valid agent statuses
const AGENT_STATUSES = ['online', 'offline', 'busy', 'idle', 'error', 'thinking'];

// Valid agent roles
const AGENT_ROLES = ['pm', 'planner', 'coder', 'reviewer', 'tester', 'deployer'];

/**
 * Build tenant filter clause for queries
 * Admin users (role=admin) bypass tenant filtering
 * @param {string|null} tenantId - Tenant ID from req.tenantId
 * @returns {{ clause: string, params: Array }}
 */
function buildTenantFilter(tenantId, alias = 'a') {
  // Admin users see all agents (no tenant filter)
  if (!tenantId) {
    return { clause: '', params: [] };
  }
  return {
    clause: ` AND ${alias}.tenant_id = $__tenant__`,
    params: [tenantId],
  };
}

/**
 * Substitute tenant placeholder in filter clause
 * @param {{ clause: string, params: Array }} filter
 * @param {number} nextParamIndex - Next $N index for params array
 */
function applyTenantParams(filter, nextParamIndex) {
  if (!filter.clause) return { clause: '', params: [] };
  const paramCount = filter.params.length;
  const substituted = filter.clause.replace('$__tenant__', `$${nextParamIndex}`);
  return { clause: substituted, params: filter.params };
}

/**
 * GET /api/agents - List all agents (tenant-scoped)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { status, role, enabled } = req.query;
  const tenantId = req.tenantId; // null for admin users
  const isAdmin = req.user?.role === 'admin';

  const filter = buildTenantFilter(tenantId);
  const tenantParams = filter.params;
  let paramIndex = tenantParams.length + 1;

  let sql = `SELECT * FROM agents WHERE 1=1`;
  const params = [...tenantParams];

  // Apply tenant filter (admin bypasses this)
  if (!isAdmin && tenantId) {
    sql += ` AND tenant_id = $${paramIndex++}`;
    params.push(tenantId);
  } else if (!isAdmin && !tenantId) {
    // Non-admin users without tenant get empty results
    // (this shouldn't normally happen if auth is set up correctly)
  }

  if (status) {
    sql += ` AND status = $${paramIndex++}`;
    params.push(status);
  }
  if (role) {
    sql += ` AND role = $${paramIndex++}`;
    params.push(role);
  }
  if (enabled !== undefined) {
    sql += ` AND enabled = $${paramIndex++}`;
    params.push(enabled === 'true');
  }

  sql += ' ORDER BY created_at DESC';

  const result = await query(sql, params);

  res.json({
    success: true,
    data: result.rows,
  });
}));

/**
 * GET /api/agents/:id - Get agent by ID (tenant-scoped)
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const isAdmin = req.user?.role === 'admin';

  let sql = 'SELECT * FROM agents WHERE id = $1';
  const params = [id];

  // Tenant isolation
  if (!isAdmin) {
    if (tenantId) {
      sql += ' AND tenant_id = $2';
      params.push(tenantId);
    } else {
      // No tenant and not admin - no access
      sql += ' AND 1=0';
    }
  }

  const result = await query(sql, params);

  if (result.rows.length === 0) {
    throw new NotFoundError('Agent not found');
  }

  // Get agent's tasks
  const tasksResult = await query(
    `SELECT t.*, p.name as project_name
     FROM tasks t
     LEFT JOIN projects p ON t.project_id = p.id
     WHERE t.assignee_id = $1
     ORDER BY t.created_at DESC
     LIMIT 10`,
    [id]
  );

  // Get agent stats
  const statsResult = await query(
    `SELECT 
       COUNT(*) as total_tasks,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
       COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tasks
     FROM tasks WHERE assignee_id = $1`,
    [id]
  );

  res.json({
    success: true,
    data: {
      ...result.rows[0],
      recent_tasks: tasksResult.rows,
      stats: statsResult.rows[0],
    },
  });
}));

/**
 * POST /api/agents - Register new agent
 * Assigns to current user's tenant
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

  const tenantId = req.tenantId;
  const isAdmin = req.user?.role === 'admin';

  // Non-admin users must have a tenant to create agents
  if (!isAdmin && !tenantId) {
    throw new BadRequestError('Tenant context required to create agent');
  }

  const result = await query(
    `INSERT INTO agents (
      name, role, model_provider, model_name, system_prompt, skills,
      personality, status, enabled, tenant_id, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'offline', $8, $9, NOW(), NOW())
    RETURNING *`,
    [
      name.trim(), role, model_provider, model_name, system_prompt,
      skills, personality, enabled, isAdmin ? null : tenantId,
    ]
  );

  res.status(201).json({
    success: true,
    data: result.rows[0],
  });
}));

/**
 * PUT /api/agents/:id - Update agent (tenant-scoped)
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

  const tenantId = req.tenantId;
  const isAdmin = req.user?.role === 'admin';

  // Build tenant-scoped query
  let checkSql = 'SELECT id FROM agents WHERE id = $1';
  const checkParams = [id];
  if (!isAdmin) {
    if (tenantId) {
      checkSql += ' AND tenant_id = $2';
      checkParams.push(tenantId);
    } else {
      checkSql += ' AND 1=0';
    }
  }

  const check = await query(checkSql, checkParams);
  if (check.rows.length === 0) {
    throw new NotFoundError('Agent not found');
  }

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(name.trim());
  }
  if (role !== undefined) {
    if (!AGENT_ROLES.includes(role)) {
      throw new BadRequestError(`Invalid role. Must be one of: ${AGENT_ROLES.join(', ')}`);
    }
    updates.push(`role = $${paramCount++}`);
    values.push(role);
  }
  if (model_provider !== undefined) {
    updates.push(`model_provider = $${paramCount++}`);
    values.push(model_provider);
  }
  if (model_name !== undefined) {
    updates.push(`model_name = $${paramCount++}`);
    values.push(model_name);
  }
  if (system_prompt !== undefined) {
    updates.push(`system_prompt = $${paramCount++}`);
    values.push(system_prompt);
  }
  if (skills !== undefined) {
    updates.push(`skills = $${paramCount++}`);
    values.push(skills);
  }
  if (personality !== undefined) {
    updates.push(`personality = $${paramCount++}`);
    values.push(personality);
  }
  if (enabled !== undefined) {
    updates.push(`enabled = $${paramCount++}`);
    values.push(enabled);
  }

  if (updates.length === 0) {
    throw new BadRequestError('No fields to update');
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  // Apply tenant filter for non-admin
  let updateSql = `UPDATE agents SET ${updates.join(', ')} WHERE id = $${paramCount}`;
  if (!isAdmin && tenantId) {
    updateSql += ` AND tenant_id = $${paramCount + 1}`;
    values.push(tenantId);
  } else if (!isAdmin && !tenantId) {
    updateSql += ' AND 1=0';
  }

  const result = await query(updateSql, values);

  res.json({
    success: true,
    data: result.rows[0],
  });
}));

/**
 * PATCH /api/agents/:id/status - Update agent status (tenant-scoped)
 */
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !AGENT_STATUSES.includes(status)) {
    throw new BadRequestError(`Invalid status. Must be one of: ${AGENT_STATUSES.join(', ')}`);
  }

  const tenantId = req.tenantId;
  const isAdmin = req.user?.role === 'admin';

  let updateSql = `UPDATE agents SET status = $1, updated_at = NOW() WHERE id = $2`;
  const params = [status, id];

  if (!isAdmin) {
    if (tenantId) {
      updateSql += ` AND tenant_id = $3`;
      params.push(tenantId);
    } else {
      updateSql += ' AND 1=0';
    }
  }

  const result = await query(updateSql, params);

  if (result.rows.length === 0) {
    throw new NotFoundError('Agent not found');
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
}));

/**
 * DELETE /api/agents/:id - Delete agent (tenant-scoped)
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const tenantId = req.tenantId;
  const isAdmin = req.user?.role === 'admin';

  let deleteSql = 'DELETE FROM agents WHERE id = $1';
  const params = [id];

  if (!isAdmin) {
    if (tenantId) {
      deleteSql += ' AND tenant_id = $2';
      params.push(tenantId);
    } else {
      deleteSql += ' AND 1=0';
    }
  }

  const result = await query(deleteSql + ' RETURNING id', params);

  if (result.rows.length === 0) {
    throw new NotFoundError('Agent not found');
  }

  res.json({
    success: true,
    message: 'Agent deleted successfully',
  });
}));

export default router;
