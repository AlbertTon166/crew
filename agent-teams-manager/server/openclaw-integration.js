/**
 * OpenClaw Integration Layer
 * 
 * Provides task dispatch functionality via OpenClaw sessions.
 * Uses the OpenClaw gateway CLI for session management.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { cacheSet, cacheGet, getPgPool } from './databases.js';

const execAsync = promisify(exec);

// OpenClaw gateway configuration
const OPENCLAW_CMD = 'openclaw';
const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';

// Session polling interval in ms
const POLL_INTERVAL = 5000;

/**
 * Spawn a subagent session via OpenClaw gateway
 * 
 * @param {Object} params - Spawn parameters
 * @param {string} params.agentId - Target agent ID
 * @param {string} params.task - Task description
 * @param {string} [params.runtime='subagent'] - Runtime type (subagent, acp, etc.)
 * @param {string} [params.mode='session'] - Spawn mode
 * @returns {Promise<{sessionId: string, sessionKey: string}>}
 */
export async function spawnSession({ agentId, task, runtime = 'subagent', mode = 'session' }) {
  try {
    // Use gateway CLI to spawn session
    const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN || '';
    const authHeader = gatewayToken ? `Authorization: Bearer ${gatewayToken}` : '';
    
    // Call OpenClaw gateway API to spawn session
    const response = await fetch(`${GATEWAY_URL}/api/sessions/spawn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': `Bearer ${gatewayToken}` })
      },
      body: JSON.stringify({
        runtime,
        agentId,
        task,
        mode
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to spawn session: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return {
      sessionId: data.sessionId || data.id,
      sessionKey: data.sessionKey
    };
  } catch (error) {
    // Fallback: Try CLI approach
    console.log('Gateway API not available, trying CLI approach...');
    return await spawnSessionViaCLI({ agentId, task, runtime, mode });
  }
}

/**
 * Spawn session via OpenClaw CLI (fallback method)
 */
async function spawnSessionViaCLI({ agentId, task, runtime, mode }) {
  try {
    const cmd = [
      OPENCLAW_CMD,
      'sessions',
      'spawn',
      '--runtime', runtime,
      '--agent-id', agentId,
      '--task', `"${task.replace(/"/g, '\\"')}"`,
      '--mode', mode,
      '--json'
    ].join(' ');

    const { stdout } = await execAsync(cmd);
    const result = JSON.parse(stdout);
    
    return {
      sessionId: result.sessionId || result.id,
      sessionKey: result.sessionKey
    };
  } catch (error) {
    throw new Error(`Failed to spawn session via CLI: ${error.message}`);
  }
}

/**
 * Get session history/execution results
 * 
 * @param {string} sessionId - Session ID
 * @returns {Promise<{messages: Array, status: string, output?: string}>}
 */
export async function getSessionHistory(sessionId) {
  try {
    const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN || '';
    
    // Try gateway API first
    const response = await fetch(`${GATEWAY_URL}/api/sessions/${sessionId}/history`, {
      headers: {
        'Content-Type': 'application/json',
        ...(gatewayToken && { 'Authorization': `Bearer ${gatewayToken}` })
      }
    });

    if (response.ok) {
      return await response.json();
    }

    // Fallback to CLI
    return await getSessionHistoryViaCLI(sessionId);
  } catch {
    return await getSessionHistoryViaCLI(sessionId);
  }
}

/**
 * Get session history via CLI (fallback)
 */
async function getSessionHistoryViaCLI(sessionId) {
  try {
    const cmd = `${OPENCLAW_CMD} sessions history ${sessionId} --json`;
    const { stdout } = await execAsync(cmd);
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Failed to get session history: ${error.message}`);
  }
}

/**
 * Get session status
 * 
 * @param {string} sessionId - Session ID
 * @returns {Promise<{status: string, active?: boolean}>}
 */
export async function getSessionStatus(sessionId) {
  try {
    const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN || '';
    
    const response = await fetch(`${GATEWAY_URL}/api/sessions/${sessionId}/status`, {
      headers: {
        ...(gatewayToken && { 'Authorization': `Bearer ${gatewayToken}` })
      }
    });

    if (response.ok) {
      return await response.json();
    }

    // Fallback to CLI
    const cmd = `${OPENCLAW_CMD} sessions status ${sessionId} --json`;
    const { stdout } = await execAsync(cmd);
    return JSON.parse(stdout);
  } catch {
    // Return default status if unable to check
    return { status: 'unknown', active: false };
  }
}

/**
 * Kill a session
 * 
 * @param {string} sessionId - Session ID to kill
 */
export async function killSession(sessionId) {
  try {
    const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN || '';
    
    const response = await fetch(`${GATEWAY_URL}/api/sessions/${sessionId}/kill`, {
      method: 'POST',
      headers: {
        ...(gatewayToken && { 'Authorization': `Bearer ${gatewayToken}` })
      }
    });

    if (response.ok) {
      return true;
    }

    // Fallback to CLI
    const cmd = `${OPENCLAW_CMD} sessions kill ${sessionId}`;
    await execAsync(cmd);
    return true;
  } catch (error) {
    console.error(`Failed to kill session ${sessionId}:`, error.message);
    return false;
  }
}

/**
 * Task Execution Status Polling Manager
 * Manages polling for multiple task executions
 */
class TaskExecutionPoller {
  constructor() {
    this.intervals = new Map();
    this.callbacks = new Map();
  }

  /**
   * Start polling for task execution status
   * 
   * @param {string} taskId - Task ID in our database
   * @param {string} sessionId - OpenClaw session ID
   * @param {Function} onUpdate - Callback(status, result)
   * @param {Object} options - Polling options
   */
  start(taskId, sessionId, onUpdate, options = {}) {
    const { interval = POLL_INTERVAL, maxAttempts = 120 } = options; // Max 10 min default
    
    // Clear existing polling for this task
    this.stop(taskId);

    let attempts = 0;
    const poll = async () => {
      attempts++;
      
      try {
        const status = await getSessionStatus(sessionId);
        const history = await getSessionHistory(sessionId);
        
        const executionStatus = {
          taskId,
          sessionId,
          status: status.status || status.state || 'running',
          active: status.active,
          messageCount: history.messages?.length || 0,
          lastMessage: history.messages?.slice(-1)[0] || null,
          output: this.extractOutput(history),
          attempt: attempts
        };

        // Notify callback
        onUpdate(executionStatus);

        // Update database
        await this.updateTaskExecution(taskId, executionStatus);

        // Check if completed
        if (!status.active || status.status === 'completed' || status.status === 'done') {
          this.stop(taskId);
          await this.finalizeTaskExecution(taskId, sessionId, history);
        } else if (attempts >= maxAttempts) {
          this.stop(taskId);
          await this.timeoutTask(taskId, sessionId);
        }
      } catch (error) {
        console.error(`Polling error for task ${taskId}:`, error.message);
      }
    };

    // Start polling
    const intervalId = setInterval(poll, interval);
    this.intervals.set(taskId, intervalId);
    this.callbacks.set(taskId, onUpdate);

    // Immediate first poll
    poll();
  }

  /**
   * Stop polling for a task
   */
  stop(taskId) {
    const intervalId = this.intervals.get(taskId);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(taskId);
      this.callbacks.delete(taskId);
    }
  }

  /**
   * Extract output text from session history
   */
  extractOutput(history) {
    if (!history.messages) return '';
    
    // Get last assistant message as output
    const lastAssistant = [...history.messages]
      .reverse()
      .find(m => m.role === 'assistant');
    
    return lastAssistant?.content || lastAssistant?.text || '';
  }

  /**
   * Update task execution in database
   */
  async updateTaskExecution(taskId, status) {
    try {
      const pool = getPgPool();
      await pool.query(
        `UPDATE tasks SET 
          execution_status = $1,
          updated_at = NOW()
         WHERE id = $2`,
        [status.status, taskId]
      );
    } catch (error) {
      console.error('Failed to update task execution:', error.message);
    }
  }

  /**
   * Finalize completed task execution
   */
  async finalizeTaskExecution(taskId, sessionId, history) {
    try {
      const pool = getPgPool();
      const output = this.extractOutput(history);
      
      // Update task as completed
      await pool.query(
        `UPDATE tasks SET 
          execution_status = 'completed',
          status = 'completed',
          updated_at = NOW()
         WHERE id = $1`,
        [taskId]
      );

      // Log execution
      await pool.query(
        `INSERT INTO execution_logs 
          (task_id, status, output, completed_at)
         VALUES ($1, 'completed', $2, NOW())`,
        [taskId, output]
      );

      // Notify via callback
      const callback = this.callbacks.get(taskId);
      if (callback) {
        callback({
          taskId,
          sessionId,
          status: 'completed',
          output,
          finalized: true
        });
      }
    } catch (error) {
      console.error('Failed to finalize task execution:', error.message);
    }
  }

  /**
   * Handle task timeout
   */
  async timeoutTask(taskId, sessionId) {
    try {
      const pool = getPgPool();
      await pool.query(
        `UPDATE tasks SET 
          execution_status = 'timeout',
          updated_at = NOW()
         WHERE id = $1`,
        [taskId]
      );
      await killSession(sessionId);
    } catch (error) {
      console.error('Failed to timeout task:', error.message);
    }
  }

  /**
   * Get all active polling tasks
   */
  getActiveTasks() {
    return Array.from(this.intervals.keys());
  }
}

// Singleton instance
export const taskPoller = new TaskExecutionPoller();

/**
 * Dispatch a task to an agent
 * 
 * @param {Object} params - Dispatch parameters
 * @param {string} params.taskId - Task ID in database
 * @param {string} params.agentId - Agent ID to dispatch to
 * @param {string} params.agentRole - Agent role (coder, reviewer, etc.)
 * @param {string} params.task - Task description
 * @param {string} [params.context] - Additional context
 * @returns {Promise<{success: boolean, sessionId?: string, error?: string}>}
 */
export async function dispatchTask({ taskId, agentId, agentRole, task, context }) {
  try {
    // Build task prompt with context
    const fullTask = buildTaskPrompt({ task, context, agentRole });
    
    // Spawn session
    const { sessionId, sessionKey } = await spawnSession({
      agentId: agentId,
      task: fullTask,
      runtime: 'subagent',
      mode: 'session'
    });

    // Store session info in cache/database
    await cacheSet(`task:session:${taskId}`, {
      sessionId,
      sessionKey,
      agentId,
      agentRole,
      startedAt: new Date().toISOString()
    }, 3600); // 1 hour TTL

    // Update task with session ID and status
    const pool = getPgPool();
    await pool.query(
      `UPDATE tasks SET 
        agent_session_id = $1,
        execution_status = 'dispatched',
        assigned_agent_id = $2,
        status = 'in_progress',
        updated_at = NOW()
       WHERE id = $3`,
      [sessionId, agentId, taskId]
    );

    // Start polling for this task
    taskPoller.start(taskId, sessionId, (status) => {
      console.log(`Task ${taskId} status: ${status.status}`);
    });

    return {
      success: true,
      sessionId,
      sessionKey
    };
  } catch (error) {
    console.error('Failed to dispatch task:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Build task prompt for agent
 */
function buildTaskPrompt({ task, context, agentRole }) {
  let prompt = '';
  
  if (agentRole === 'coder') {
    prompt = `【编码任务】\n\n${task}\n\n请完成上述编码任务，返回完成的代码和执行结果。`;
  } else if (agentRole === 'reviewer') {
    prompt = `【代码审查任务】\n\n${task}\n\n请审查代码并提供改进建议。`;
  } else if (agentRole === 'tester') {
    prompt = `【测试任务】\n\n${task}\n\n请编写并执行测试，返回测试结果。`;
  } else {
    prompt = `【任务】\n\n${task}\n\n请完成任务并返回结果。`;
  }
  
  if (context) {
    prompt += `\n\n【上下文】\n${context}`;
  }
  
  return prompt;
}

/**
 * Get task execution status
 */
export async function getTaskExecutionStatus(taskId) {
  try {
    const pool = getPgPool();
    const result = await pool.query(
      `SELECT id, agent_session_id, execution_status, status, assigned_agent_id
       FROM tasks WHERE id = $1`,
      [taskId]
    );
    
    if (result.rows.length === 0) {
      return { error: 'Task not found' };
    }
    
    const task = result.rows[0];
    
    // Get session status if we have a session ID
    let sessionStatus = null;
    if (task.agent_session_id) {
      try {
        sessionStatus = await getSessionStatus(task.agent_session_id);
        const history = await getSessionHistory(task.agent_session_id);
        return {
          taskId,
          taskStatus: task.status,
          executionStatus: task.execution_status || sessionStatus.status,
          agentId: task.assigned_agent_id,
          sessionId: task.agent_session_id,
          sessionActive: sessionStatus.active,
          messages: history.messages || [],
          output: history.messages?.slice(-1)[0]?.content || ''
        };
      } catch {
        return {
          taskId,
          taskStatus: task.status,
          executionStatus: task.execution_status || 'unknown',
          agentId: task.assigned_agent_id,
          sessionId: task.agent_session_id,
          sessionActive: false
        };
      }
    }
    
    return {
      taskId,
      taskStatus: task.status,
      executionStatus: task.execution_status || 'pending',
      agentId: task.assigned_agent_id
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Complete/cancel a task execution
 */
export async function completeTaskExecution(taskId, { success = true, output = '', error = null }) {
  try {
    const pool = getPgPool();
    
    // Get current task info
    const taskResult = await pool.query(
      'SELECT agent_session_id FROM tasks WHERE id = $1',
      [taskId]
    );
    
    if (taskResult.rows.length === 0) {
      return { error: 'Task not found' };
    }
    
    const task = taskResult.rows[0];
    
    // Stop polling
    taskPoller.stop(taskId);
    
    // Kill the session if still active
    if (task.agent_session_id) {
      await killSession(task.agent_session_id);
    }
    
    // Update task status
    const newStatus = success ? 'completed' : 'failed';
    const executionStatus = success ? 'completed' : 'failed';
    
    await pool.query(
      `UPDATE tasks SET 
        status = $1,
        execution_status = $2,
        updated_at = NOW()
       WHERE id = $3`,
      [newStatus, executionStatus, taskId]
    );
    
    // Log execution
    await pool.query(
      `INSERT INTO execution_logs 
        (task_id, status, output, error, completed_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [taskId, executionStatus, output, error]
    );
    
    return { success: true, taskId, status: newStatus };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * List available agents/sessions for dispatch
 */
export async function listAvailableAgents() {
  try {
    const pool = getPgPool();
    const result = await pool.query(
      `SELECT id, name, role, status, model_provider, model_name, enabled
       FROM agents WHERE enabled = true AND status != 'offline'
       ORDER BY role, name`
    );
    return result.rows;
  } catch (error) {
    console.error('Failed to list agents:', error);
    return [];
  }
}

export default {
  spawnSession,
  getSessionHistory,
  getSessionStatus,
  killSession,
  dispatchTask,
  getTaskExecutionStatus,
  completeTaskExecution,
  listAvailableAgents,
  taskPoller
};
