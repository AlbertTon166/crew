/**
 * Demo API Routes
 * Public endpoints for demo data (no authentication required)
 */

import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();

/**
 * GET /api/demo/overview - Get demo data overview
 * Public endpoint - no auth required
 */
router.get('/overview', asyncHandler(async (req, res) => {
  // Get demo agents
  const agentsResult = await query(`
    SELECT id, name, role, model_provider, model_name, status, 
           avg_response_time, task_count, current_load, personality
    FROM agents 
    ORDER BY role
  `);
  
  // Get demo projects with stats
  const projectsResult = await query(`
    SELECT p.id, p.name, p.description, p.status,
           COUNT(t.id) as task_count,
           COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);
  
  // Get demo tasks with assignee info
  const tasksResult = await query(`
    SELECT t.id, t.title, t.description, t.status, t.priority,
           t.workflow_position, t.node_type,
           p.name as project_name,
           a.name as assignee_name, a.role as assignee_role
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    LEFT JOIN agents a ON a.id = t.assignee_id
    ORDER BY t.created_at DESC
    LIMIT 20
  `);
  
  // Get requirements
  const requirementsResult = await query(`
    SELECT r.id, r.title, r.description, r.status, r.priority,
           p.name as project_name
    FROM requirements r
    JOIN projects p ON p.id = r.project_id
    ORDER BY r.priority, r.created_at DESC
  `);
  
  // Get agent roles summary
  const rolesSummary = await query(`
    SELECT role, COUNT(*) as count, 
           AVG(task_count)::integer as avg_tasks,
           AVG(current_load)::float as avg_load
    FROM agents
    GROUP BY role
    ORDER BY role
  `);
  
  res.json({
    success: true,
    data: {
      agents: agentsResult.rows,
      projects: projectsResult.rows,
      tasks: tasksResult.rows,
      requirements: requirementsResult.rows,
      stats: {
        totalAgents: agentsResult.rows.length,
        totalProjects: projectsResult.rows.length,
        totalTasks: tasksResult.rows.length,
        completedTasks: tasksResult.rows.filter(t => t.status === 'completed').length,
        runningTasks: tasksResult.rows.filter(t => t.status === 'running').length,
      },
      rolesSummary: rolesSummary.rows,
    }
  });
}));

/**
 * GET /api/demo/agents - Get demo agents only
 */
router.get('/agents', asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT id, name, role, model_provider, model_name, 
           system_prompt, skills, personality, status, 
           avg_response_time, task_count, current_load
    FROM agents 
    ORDER BY role
  `);
  
  res.json({
    success: true,
    data: result.rows
  });
}));

/**
 * GET /api/demo/projects - Get demo projects
 */
router.get('/projects', asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT p.id, p.name, p.description, p.status, p.owner_id,
           COUNT(t.id) as task_count,
           COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
           COUNT(CASE WHEN t.status = 'running' THEN 1 END) as running_tasks
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);
  
  res.json({
    success: true,
    data: result.rows
  });
}));

/**
 * GET /api/demo/tasks - Get demo tasks
 */
router.get('/tasks', asyncHandler(async (req, res) => {
  const { project_id, status } = req.query;
  
  let sql = `
    SELECT t.id, t.title, t.description, t.status, t.priority,
           t.workflow_position, t.node_type, t.project_id,
           p.name as project_name,
           a.name as assignee_name, a.role as assignee_role
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    LEFT JOIN agents a ON a.id = t.assignee_id
    WHERE 1=1
  `;
  const params = [];
  let paramCount = 1;
  
  if (project_id) {
    sql += ` AND t.project_id = $${paramCount++}`;
    params.push(project_id);
  }
  if (status) {
    sql += ` AND t.status = $${paramCount++}`;
    params.push(status);
  }
  
  sql += ' ORDER BY t.created_at DESC LIMIT 50';
  
  const result = await query(sql, params);
  
  res.json({
    success: true,
    data: result.rows
  });
}));

/**
 * GET /api/demo/roles - Get agent roles/positions
 */
router.get('/roles', asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT role, COUNT(*) as agent_count,
           STRING_AGG(name, ', ') as agents
    FROM agents
    GROUP BY role
    ORDER BY role
  `);
  
  res.json({
    success: true,
    data: result.rows
  });
}));

export default router;
