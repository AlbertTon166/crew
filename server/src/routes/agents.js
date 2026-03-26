/**
 * Agents API Routes
 * Agent registration and status management
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
 * GET /api/agents - List all agents
 */
router.get('/', asyncHandler(async (req, res) => {
  const { status, role, enabled } = req.query;
  
  let sql = 'SELECT * FROM agents WHERE 1=1';
  const params = [];
  let paramCount = 1;
  
  if (status) {
    sql += ` AND status = $${paramCount++}`;
    params.push(status);
  }
  if (role) {
    sql += ` AND role = $${paramCount++}`;
    params.push(role);
  }
  if (enabled !== undefined) {
    sql += ` AND enabled = $${paramCount++}`;
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
 * GET /api/agents/:id - Get agent by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await query('SELECT * FROM agents WHERE id = $1', [id]);
  
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
  
  const result = await query(
    `INSERT INTO agents (
      name, role, model_provider, model_name, system_prompt, skills,
      personality, status, enabled, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'offline', $8, NOW(), NOW())
    RETURNING *`,
    [name.trim(), role, model_provider, model_name, system_prompt, skills, personality, enabled]
  );
  
  res.status(201).json({
    success: true,
    data: result.rows[0],
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
  
  const check = await query('SELECT id FROM agents WHERE id = $1', [id]);
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
  
  updates.push(`updated_at = NOW()`);
  values.push(id);
  
  const result = await query(
    `UPDATE agents SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  
  res.json({
    success: true,
    data: result.rows[0],
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
  
  const result = await query(
    `UPDATE agents SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Agent not found');
  }
  
  res.json({
    success: true,
    data: result.rows[0],
  });
}));

/**
 * DELETE /api/agents/:id - Delete agent
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await query('DELETE FROM agents WHERE id = $1 RETURNING id', [id]);
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Agent not found');
  }
  
  res.json({
    success: true,
    message: 'Agent deleted successfully',
  });
}));

export default router;
