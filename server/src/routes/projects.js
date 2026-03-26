/**
 * Projects API Routes
 * CRUD operations for projects
 */

import { Router } from 'express';
import { query, transaction } from '../config/db.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all project routes
router.use(authenticate);

/**
 * GET /api/projects - List all projects
 */
router.get('/', asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let sql = `
    SELECT p.*, 
           u.username as owner_name,
           COUNT(t.id) as task_count,
           COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_task_count
    FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
    LEFT JOIN tasks t ON t.project_id = p.id
    WHERE p.owner_id = $1 OR $1 = ANY(p.team_members)
  `;
  const params = [req.userId];
  
  if (status) {
    sql += ` AND p.status = $${params.length + 1}`;
    params.push(status);
  }
  
  sql += ` GROUP BY p.id, u.username ORDER BY p.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(parseInt(limit), offset);
  
  const result = await query(sql, params);
  
  // Get total count
  const countResult = await query(
    'SELECT COUNT(*) FROM projects WHERE owner_id = $1',
    [req.userId]
  );
  
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

/**
 * GET /api/projects/:id - Get project by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await query(
    `SELECT p.*, u.username as owner_name
     FROM projects p
     LEFT JOIN users u ON p.owner_id = u.id
     WHERE p.id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Project not found');
  }
  
  // Get project tasks
  const tasksResult = await query(
    'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC',
    [id]
  );
  
  // Get project agents
  const agentsResult = await query(
    `SELECT a.* FROM agents a
     INNER JOIN project_agents pa ON a.id = pa.agent_id
     WHERE pa.project_id = $1`,
    [id]
  );
  
  res.json({
    success: true,
    data: {
      ...result.rows[0],
      tasks: tasksResult.rows,
      agents: agentsResult.rows,
    },
  });
}));

/**
 * POST /api/projects - Create new project
 */
router.post('/', asyncHandler(async (req, res) => {
  const { name, description, status = 'active', team_members = [] } = req.body;
  
  if (!name || name.trim() === '') {
    throw new BadRequestError('Project name is required');
  }
  
  const result = await query(
    `INSERT INTO projects (name, description, status, owner_id, team_members, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING *`,
    [name.trim(), description, status, req.userId, team_members]
  );
  
  res.status(201).json({
    success: true,
    data: result.rows[0],
  });
}));

/**
 * PUT /api/projects/:id - Update project
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, status, team_members } = req.body;
  
  // Check ownership
  const check = await query(
    'SELECT owner_id FROM projects WHERE id = $1',
    [id]
  );
  
  if (check.rows.length === 0) {
    throw new NotFoundError('Project not found');
  }
  
  if (check.rows[0].owner_id !== req.userId) {
    throw new BadRequestError('Only project owner can update');
  }
  
  const updates = [];
  const values = [];
  let paramCount = 1;
  
  if (name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(name.trim());
  }
  if (description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(description);
  }
  if (status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(status);
  }
  if (team_members !== undefined) {
    updates.push(`team_members = $${paramCount++}`);
    values.push(team_members);
  }
  
  updates.push(`updated_at = NOW()`);
  
  values.push(id);
  
  const result = await query(
    `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  
  res.json({
    success: true,
    data: result.rows[0],
  });
}));

/**
 * DELETE /api/projects/:id - Delete project
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check ownership
  const check = await query(
    'SELECT owner_id FROM projects WHERE id = $1',
    [id]
  );
  
  if (check.rows.length === 0) {
    throw new NotFoundError('Project not found');
  }
  
  if (check.rows[0].owner_id !== req.userId) {
    throw new BadRequestError('Only project owner can delete');
  }
  
  await query('DELETE FROM projects WHERE id = $1', [id]);
  
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
  
  const result = await query(
    `SELECT 
       COUNT(*) as total_tasks,
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
       COUNT(CASE WHEN status = 'running' THEN 1 END) as running_tasks,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
       COUNT(CASE WHEN status IN ('failed', 'waiting_retry', 'waiting_human') THEN 1 END) as blocked_tasks
     FROM tasks WHERE project_id = $1`,
    [id]
  );
  
  res.json({
    success: true,
    data: result.rows[0],
  });
}));

export default router;
