/**
 * Tasks API Routes
 * CRUD operations with status transitions
 */

import { Router } from 'express';
import { query, transaction } from '../config/db.js';
import { asyncHandler, NotFoundError, BadRequestError, ValidationError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Valid task statuses
const TASK_STATUSES = ['pending', 'running', 'waiting_retry', 'waiting_human', 'fallback', 'failed', 'completed', 'skipped'];

// Valid status transitions
const STATUS_TRANSITIONS = {
  pending: ['running', 'skipped'],
  running: ['completed', 'failed', 'waiting_retry', 'waiting_human', 'fallback'],
  waiting_retry: ['running', 'failed'],
  waiting_human: ['running', 'skipped', 'failed'],
  fallback: ['completed', 'failed'],
  failed: ['pending', 'skipped'],
  completed: [],
  skipped: [],
};

/**
 * Validate status transition
 * @param {string} from - Current status
 * @param {string} to - Target status
 */
function validateTransition(from, to) {
  if (!STATUS_TRANSITIONS[from]) {
    throw new ValidationError(`Invalid current status: ${from}`);
  }
  if (!STATUS_TRANSITIONS[from].includes(to)) {
    throw new ValidationError(`Cannot transition from ${from} to ${to}`);
  }
}

/**
 * GET /api/tasks - List tasks
 */
router.get('/', asyncHandler(async (req, res) => {
  const { project_id, status, assignee_id, priority, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let sql = `
    SELECT t.*, 
           p.name as project_name,
           u.username as assignee_name
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u ON t.assignee_id = u.id
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
  if (assignee_id) {
    sql += ` AND t.assignee_id = $${paramCount++}`;
    params.push(assignee_id);
  }
  if (priority) {
    sql += ` AND t.priority = $${paramCount++}`;
    params.push(priority);
  }
  
  sql += ` ORDER BY t.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
  params.push(parseInt(limit), offset);
  
  const result = await query(sql, params);
  
  res.json({
    success: true,
    data: result.rows,
  });
}));

/**
 * GET /api/tasks/:id - Get task by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await query(
    `SELECT t.*, 
            p.name as project_name,
            u.username as assignee_name
     FROM tasks t
     LEFT JOIN projects p ON t.project_id = p.id
     LEFT JOIN users u ON t.assignee_id = u.id
     WHERE t.id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Task not found');
  }
  
  // Get task executions
  const executionsResult = await query(
    'SELECT * FROM task_executions WHERE task_id = $1 ORDER BY started_at DESC',
    [id]
  );
  
  // Get task dependencies
  const depsResult = await query(
    `SELECT t.* FROM tasks t
     INNER JOIN task_dependencies td ON t.id = td.depends_on_id
     WHERE td.task_id = $1`,
    [id]
  );
  
  res.json({
    success: true,
    data: {
      ...result.rows[0],
      executions: executionsResult.rows,
      dependencies: depsResult.rows,
    },
  });
}));

/**
 * POST /api/tasks - Create new task
 */
router.post('/', asyncHandler(async (req, res) => {
  const {
    project_id,
    title,
    description,
    status = 'pending',
    assignee_id,
    priority = 'P2',
    depends_on = [],
    estimated_hours,
    timeout_seconds = 300,
    max_retries = 3,
    retry_interval = 1,
    timeout_strategy = 'retry',
    fallback_task_id,
    fallback_output,
    interrupt_on_failure = false,
    notification_users = [],
    is_human_interrupt_point = false,
  } = req.body;
  
  if (!title || title.trim() === '') {
    throw new BadRequestError('Task title is required');
  }
  
  if (!project_id) {
    throw new BadRequestError('Project ID is required');
  }
  
  const result = await transaction(async (client) => {
    // Create task
    const taskResult = await client.query(
      `INSERT INTO tasks (
        project_id, title, description, status, assignee_id, priority,
        estimated_hours, timeout_seconds, max_retries, retry_interval,
        timeout_strategy, fallback_task_id, fallback_output, interrupt_on_failure,
        notification_users, is_human_interrupt_point, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *`,
      [
        project_id, title.trim(), description, status, assignee_id, priority,
        estimated_hours, timeout_seconds, max_retries, retry_interval,
        timeout_strategy, fallback_task_id, fallback_output, interrupt_on_failure,
        notification_users, is_human_interrupt_point
      ]
    );
    
    const task = taskResult.rows[0];
    
    // Add dependencies
    if (depends_on.length > 0) {
      for (const depId of depends_on) {
        await client.query(
          'INSERT INTO task_dependencies (task_id, depends_on_id) VALUES ($1, $2)',
          [task.id, depId]
        );
      }
    }
    
    return task;
  });
  
  res.status(201).json({
    success: true,
    data: result,
  });
}));

/**
 * PUT /api/tasks/:id - Update task
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Check task exists
  const check = await query('SELECT status FROM tasks WHERE id = $1', [id]);
  if (check.rows.length === 0) {
    throw new NotFoundError('Task not found');
  }
  
  // Validate status transition if status is being changed
  if (updates.status && updates.status !== check.rows[0].status) {
    validateTransition(check.rows[0].status, updates.status);
  }
  
  const allowedFields = [
    'title', 'description', 'status', 'assignee_id', 'priority',
    'estimated_hours', 'depends_on', 'timeout_seconds', 'max_retries',
    'retry_interval', 'timeout_strategy', 'fallback_task_id', 'fallback_output',
    'interrupt_on_failure', 'notification_users', 'is_human_interrupt_point'
  ];
  
  const setClause = [];
  const values = [];
  let paramCount = 1;
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      // Convert camelCase to snake_case for DB
      const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
      setClause.push(`${dbField} = $${paramCount++}`);
      
      if (field === 'depends_on') {
        values.push(JSON.stringify(updates[field]));
      } else {
        values.push(updates[field]);
      }
    }
  }
  
  setClause.push(`updated_at = NOW()`);
  values.push(id);
  
  const result = await query(
    `UPDATE tasks SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  
  // Update dependencies if provided
  if (updates.depends_on !== undefined) {
    await query('DELETE FROM task_dependencies WHERE task_id = $1', [id]);
    
    for (const depId of updates.depends_on) {
      await query(
        'INSERT INTO task_dependencies (task_id, depends_on_id) VALUES ($1, $2)',
        [id, depId]
      );
    }
  }
  
  res.json({
    success: true,
    data: result.rows[0],
  });
}));

/**
 * PATCH /api/tasks/:id/status - Update task status only (for status transitions)
 */
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
    throw new BadRequestError('Status is required');
  }
  
  // Get current status
  const check = await query('SELECT status FROM tasks WHERE id = $1', [id]);
  if (check.rows.length === 0) {
    throw new NotFoundError('Task not found');
  }
  
  // Validate transition
  validateTransition(check.rows[0].status, status);
  
  const result = await query(
    `UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  
  res.json({
    success: true,
    data: result.rows[0],
  });
}));

/**
 * DELETE /api/tasks/:id - Delete task
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Task not found');
  }
  
  res.json({
    success: true,
    message: 'Task deleted successfully',
  });
}));

export default router;
