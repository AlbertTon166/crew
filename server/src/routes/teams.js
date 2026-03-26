/**
 * Teams API Routes
 * Team templates and management
 */

import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

/**
 * GET /api/teams - List team templates
 */
router.get('/', asyncHandler(async (req, res) => {
  const { type } = req.query;
  
  let sql = 'SELECT * FROM team_templates WHERE 1=1';
  const params = [];
  
  if (type) {
    sql += ' AND type = $1';
    params.push(type);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const result = await query(sql, params);
  
  res.json({
    success: true,
    data: result.rows,
  });
}));

/**
 * GET /api/teams/:id - Get team template by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await query(
    'SELECT * FROM team_templates WHERE id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Team template not found');
  }
  
  // Get agents in this team template
  const agentsResult = await query(
    `SELECT a.* FROM agents a
     INNER JOIN team_template_agents tta ON a.id = tta.agent_id
     WHERE tta.team_template_id = $1`,
    [id]
  );
  
  res.json({
    success: true,
    data: {
      ...result.rows[0],
      agents: agentsResult.rows,
    },
  });
}));

/**
 * POST /api/teams - Create team template
 */
router.post('/', asyncHandler(async (req, res) => {
  const {
    name,
    description,
    type = 'custom',
    agent_ids = [],
    workflow_config,
  } = req.body;
  
  if (!name || name.trim() === '') {
    throw new BadRequestError('Team name is required');
  }
  
  const result = await query(
    `INSERT INTO team_templates (name, description, type, workflow_config, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING *`,
    [name.trim(), description, type, JSON.stringify(workflow_config), req.userId]
  );
  
  const template = result.rows[0];
  
  // Add agents to template
  for (const agentId of agent_ids) {
    await query(
      'INSERT INTO team_template_agents (team_template_id, agent_id) VALUES ($1, $2)',
      [template.id, agentId]
    );
  }
  
  res.status(201).json({
    success: true,
    data: template,
  });
}));

/**
 * PUT /api/teams/:id - Update team template
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, type, agent_ids, workflow_config } = req.body;
  
  const check = await query('SELECT created_by FROM team_templates WHERE id = $1', [id]);
  if (check.rows.length === 0) {
    throw new NotFoundError('Team template not found');
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
  if (type !== undefined) {
    updates.push(`type = $${paramCount++}`);
    values.push(type);
  }
  if (workflow_config !== undefined) {
    updates.push(`workflow_config = $${paramCount++}`);
    values.push(JSON.stringify(workflow_config));
  }
  
  updates.push(`updated_at = NOW()`);
  values.push(id);
  
  await query(
    `UPDATE team_templates SET ${updates.join(', ')} WHERE id = $${paramCount}`,
    values
  );
  
  // Update agents if provided
  if (agent_ids !== undefined) {
    await query('DELETE FROM team_template_agents WHERE team_template_id = $1', [id]);
    
    for (const agentId of agent_ids) {
      await query(
        'INSERT INTO team_template_agents (team_template_id, agent_id) VALUES ($1, $2)',
        [id, agentId]
      );
    }
  }
  
  const result = await query('SELECT * FROM team_templates WHERE id = $1', [id]);
  
  res.json({
    success: true,
    data: result.rows[0],
  });
}));

/**
 * DELETE /api/teams/:id - Delete team template
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await query('DELETE FROM team_template_agents WHERE team_template_id = $1', [id]);
  const result = await query('DELETE FROM team_templates WHERE id = $1 RETURNING id', [id]);
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Team template not found');
  }
  
  res.json({
    success: true,
    message: 'Team template deleted successfully',
  });
}));

/**
 * POST /api/teams/:id/apply - Apply team template to create agents
 */
router.post('/:id/apply', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { project_id } = req.body;
  
  if (!project_id) {
    throw new BadRequestError('Project ID is required');
  }
  
  // Get template agents
  const agentsResult = await query(
    `SELECT a.* FROM agents a
     INNER JOIN team_template_agents tta ON a.id = tta.agent_id
     WHERE tta.team_template_id = $1`,
    [id]
  );
  
  // Add agents to project
  for (const agent of agentsResult.rows) {
    await query(
      'INSERT INTO project_agents (project_id, agent_id) VALUES ($1, $2)',
      [project_id, agent.id]
    );
  }
  
  res.json({
    success: true,
    message: `Applied team template with ${agentsResult.rows.length} agents`,
    data: agentsResult.rows,
  });
}));

export default router;
