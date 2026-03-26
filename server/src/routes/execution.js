/**
 * Execution API Routes
 * Task execution endpoints
 */

import { Router } from 'express';
import { query, transaction } from '../config/db.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../config/logger.js';

const router = Router();

router.use(authenticate);

/**
 * GET /api/execution - List task executions
 */
router.get('/', asyncHandler(async (req, res) => {
  const { task_id, status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let sql = `
    SELECT te.*, t.title as task_title
    FROM task_executions te
    LEFT JOIN tasks t ON te.task_id = t.id
    WHERE 1=1
  `;
  const params = [];
  let paramCount = 1;
  
  if (task_id) {
    sql += ` AND te.task_id = $${paramCount++}`;
    params.push(task_id);
  }
  if (status) {
    sql += ` AND te.status = $${paramCount++}`;
    params.push(status);
  }
  
  sql += ` ORDER BY te.started_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
  params.push(parseInt(limit), offset);
  
  const result = await query(sql, params);
  
  res.json({
    success: true,
    data: result.rows,
  });
}));

/**
 * GET /api/execution/:id - Get execution by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await query(
    `SELECT te.*, t.title as task_title, t.project_id
     FROM task_executions te
     LEFT JOIN tasks t ON te.task_id = t.id
     WHERE te.id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Execution not found');
  }
  
  // Get execution logs
  const logsResult = await query(
    'SELECT * FROM execution_logs WHERE execution_id = $1 ORDER BY created_at ASC',
    [id]
  );
  
  res.json({
    success: true,
    data: {
      ...result.rows[0],
      logs: logsResult.rows,
    },
  });
}));

/**
 * POST /api/execution - Start new task execution
 */
router.post('/', asyncHandler(async (req, res) => {
  const { task_id, agent_id, input = {} } = req.body;
  
  if (!task_id) {
    throw new BadRequestError('Task ID is required');
  }
  
  // Verify task exists and get current status
  const taskResult = await query('SELECT * FROM tasks WHERE id = $1', [task_id]);
  if (taskResult.rows.length === 0) {
    throw new NotFoundError('Task not found');
  }
  
  const task = taskResult.rows[0];
  
  // Check if task can be executed
  if (!['pending', 'waiting_retry'].includes(task.status)) {
    throw new BadRequestError(`Task cannot be executed from status: ${task.status}`);
  }
  
  // Check dependencies
  const depsResult = await query(
    `SELECT td.depends_on_id, t.status
     FROM task_dependencies td
     JOIN tasks t ON td.depends_on_id = t.id
     WHERE td.task_id = $1`,
    [task_id]
  );
  
  const incompleteDeps = depsResult.rows.filter(d => d.status !== 'completed');
  if (incompleteDeps.length > 0) {
    throw new BadRequestError('Task has incomplete dependencies');
  }
  
  // Start execution in transaction
  const result = await transaction(async (client) => {
    // Create execution record
    const execResult = await client.query(
      `INSERT INTO task_executions (task_id, agent_id, status, input, started_at)
       VALUES ($1, $2, 'running', $3, NOW())
       RETURNING *`,
      [task_id, agent_id, JSON.stringify(input)]
    );
    
    // Update task status
    await client.query(
      `UPDATE tasks SET status = 'running', updated_at = NOW() WHERE id = $1`,
      [task_id]
    );
    
    return execResult.rows[0];
  });
  
  logger.info('Task execution started', { executionId: result.id, taskId: task_id });
  
  res.status(201).json({
    success: true,
    data: result,
  });
}));

/**
 * PATCH /api/execution/:id - Update execution (complete/fail)
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, output, error, metadata } = req.body;
  
  if (!status) {
    throw new BadRequestError('Status is required');
  }
  
  const validStatuses = ['running', 'completed', 'failed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new BadRequestError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }
  
  // Get current execution
  const execResult = await query('SELECT * FROM task_executions WHERE id = $1', [id]);
  if (execResult.rows.length === 0) {
    throw new NotFoundError('Execution not found');
  }
  
  const execution = execResult.rows[0];
  
  // Update execution and task in transaction
  await transaction(async (client) => {
    const updates = ['status = $1', 'updated_at = NOW()'];
    const params = [status];
    let paramCount = 2;
    
    if (output !== undefined) {
      updates.push(`output = $${paramCount++}`);
      params.push(JSON.stringify(output));
    }
    if (error !== undefined) {
      updates.push(`error = $${paramCount++}`);
      params.push(error);
    }
    if (metadata !== undefined) {
      updates.push(`metadata = $${paramCount++}`);
      params.push(JSON.stringify(metadata));
    }
    
    if (status === 'completed' || status === 'failed') {
      updates.push(`finished_at = NOW()`);
    }
    
    params.push(id);
    
    await client.query(
      `UPDATE task_executions SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      params
    );
    
    // Update task status based on execution result
    let taskStatus;
    if (status === 'completed') {
      taskStatus = 'completed';
    } else if (status === 'failed') {
      taskStatus = 'failed';
    } else {
      taskStatus = execution.task_status; // Keep current
    }
    
    await client.query(
      `UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2`,
      [taskStatus, execution.task_id]
    );
  });
  
  logger.info('Task execution updated', { executionId: id, status });
  
  const result = await query('SELECT * FROM task_executions WHERE id = $1', [id]);
  
  res.json({
    success: true,
    data: result.rows[0],
  });
}));

/**
 * POST /api/execution/:id/retry - Retry failed execution
 */
router.post('/:id/retry', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const execResult = await query('SELECT * FROM task_executions WHERE id = $1', [id]);
  if (execResult.rows.length === 0) {
    throw new NotFoundError('Execution not found');
  }
  
  const execution = execResult.rows[0];
  
  if (execution.status !== 'failed') {
    throw new BadRequestError('Can only retry failed executions');
  }
  
  // Create new execution
  const result = await transaction(async (client) => {
    // Update original execution
    await client.query(
      `UPDATE task_executions SET status = 'superseded' WHERE id = $1`,
      [id]
    );
    
    // Create new execution
    const newExec = await client.query(
      `INSERT INTO task_executions (task_id, agent_id, status, input, started_at, parent_execution_id)
       VALUES ($1, $2, 'running', $3, NOW(), $4)
       RETURNING *`,
      [execution.task_id, execution.agent_id, execution.input, id]
    );
    
    // Update task status
    await client.query(
      `UPDATE tasks SET status = 'running', updated_at = NOW() WHERE id = $1`,
      [execution.task_id]
    );
    
    return newExec.rows[0];
  });
  
  logger.info('Task execution retry started', { newExecutionId: result.id, parentExecutionId: id });
  
  res.status(201).json({
    success: true,
    data: result,
  });
}));

/**
 * DELETE /api/execution/:id - Cancel running execution
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await query(
    `UPDATE task_executions 
     SET status = 'cancelled', finished_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND status = 'running'
     RETURNING *`,
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Running execution not found');
  }
  
  // Update task status back to pending
  await query(
    `UPDATE tasks SET status = 'pending', updated_at = NOW() WHERE id = $1`,
    [result.rows[0].task_id]
  );
  
  logger.info('Task execution cancelled', { executionId: id });
  
  res.json({
    success: true,
    data: result.rows[0],
  });
}));

export default router;
