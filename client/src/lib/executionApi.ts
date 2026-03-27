/**
 * Execution API Client
 * Handles task execution and logging
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export interface Execution {
  id: string
  task_id: string
  agent_id?: string
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'superseded'
  input: Record<string, any>
  output?: Record<string, any>
  error?: string
  metadata?: Record<string, any>
  started_at: string
  finished_at?: string
  duration_ms?: number
}

export interface ExecutionLog {
  id: string
  execution_id: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  metadata?: Record<string, any>
  created_at: string
}

export interface ExecutionWithLogs extends Execution {
  logs: ExecutionLog[]
  task_title?: string
}

interface CreateExecutionResult {
  success: boolean
  data?: Execution
  error?: string
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getExecutions(taskId?: string): Promise<Execution[]> {
  const endpoint = taskId ? `/api/execution?task_id=${taskId}` : '/api/execution';
  const result = await fetchAPI<any>(endpoint);
  return result.data || [];
}

export async function getExecution(executionId: string): Promise<ExecutionWithLogs | null> {
  try {
    const result = await fetchAPI<any>(`/api/execution/${executionId}`);
    return result.data;
  } catch {
    return null;
  }
}

export async function createExecution(
  taskId: string,
  agentId?: string,
  input?: Record<string, any>
): Promise<CreateExecutionResult> {
  try {
    const result = await fetchAPI<any>('/api/execution', {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId, agent_id: agentId, input: input || {} }),
    });
    return { success: true, data: result.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addExecutionLog(
  executionId: string,
  message: string,
  level: 'debug' | 'info' | 'warn' | 'error' = 'info',
  metadata?: Record<string, any>
): Promise<ExecutionLog | null> {
  try {
    const result = await fetchAPI<any>(`/api/execution/${executionId}/logs`, {
      method: 'POST',
      body: JSON.stringify({ message, level, metadata }),
    });
    return result.data;
  } catch {
    return null;
  }
}

export async function updateExecution(
  executionId: string,
  updates: { status?: string; output?: Record<string, any>; error?: string; metadata?: Record<string, any> }
): Promise<Execution | null> {
  try {
    const result = await fetchAPI<any>(`/api/execution/${executionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return result.data;
  } catch {
    return null;
  }
}

export async function retryExecution(executionId: string): Promise<Execution | null> {
  try {
    const result = await fetchAPI<any>(`/api/execution/${executionId}/retry`, {
      method: 'POST',
    });
    return result.data;
  } catch {
    return null;
  }
}

export async function cancelExecution(executionId: string): Promise<boolean> {
  try {
    await fetchAPI<any>(`/api/execution/${executionId}`, {
      method: 'DELETE',
    });
    return true;
  } catch {
    return false;
  }
}

// Log level display config
export const logLevelConfig: Record<string, { color: string; bg: string; icon: string }> = {
  debug: { color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)', icon: '🔍' },
  info: { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', icon: 'ℹ️' },
  warn: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', icon: '⚠️' },
  error: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', icon: '❌' },
}
