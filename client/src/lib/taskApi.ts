/**
 * Task API Client
 * Handles task CRUD operations including status transitions
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

interface Task {
  id: string
  projectId: string
  title: string
  description: string
  status: string
  priority: string
  assignee_id?: string
  [key: string]: any
}

interface UpdateTaskResult {
  success: boolean
  data?: Task
  error?: string
}

// Valid status transitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['running', 'skipped'],
  running: ['completed', 'failed', 'waiting_retry', 'waiting_human', 'fallback'],
  waiting_retry: ['running', 'failed'],
  waiting_human: ['running', 'skipped', 'failed'],
  fallback: ['completed', 'failed'],
  failed: ['pending', 'skipped'],
  completed: [],
  skipped: [],
};

// Status display config
export const statusConfig: Record<string, { label: string; labelEn: string; color: string; bg: string; border: string }> = {
  new: { label: '新建', labelEn: 'New', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.3)' },
  pending: { label: '待领取', labelEn: 'Pending', color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)', border: 'rgba(100, 116, 139, 0.3)' },
  running: { label: '进行中', labelEn: 'In Progress', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)' },
  waiting_retry: { label: '重试中', labelEn: 'Retry', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' },
  waiting_human: { label: '待确认', labelEn: 'Pending', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' },
  fallback: { label: '降级', labelEn: 'Fallback', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)' },
  failed: { label: '失败', labelEn: 'Failed', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)' },
  completed: { label: '已完成', labelEn: 'Completed', color: '#34D399', bg: 'rgba(52, 211, 153, 0.1)', border: 'rgba(52, 211, 153, 0.3)' },
  skipped: { label: '已跳过', labelEn: 'Skipped', color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)', border: 'rgba(100, 116, 139, 0.3)' },
};

// Check if transition is valid
export function canTransition(from: string, to: string): boolean {
  const transitions = STATUS_TRANSITIONS[from];
  if (!transitions) return false;
  return transitions.includes(to);
}

// Get next valid statuses
export function getNextStatuses(currentStatus: string): string[] {
  return STATUS_TRANSITIONS[currentStatus] || [];
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

export async function updateTaskStatus(taskId: string, newStatus: string): Promise<UpdateTaskResult> {
  try {
    const result = await fetchAPI<any>(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
    
    return {
      success: true,
      data: result.data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update task status',
    };
  }
}

export async function getTask(taskId: string): Promise<Task | null> {
  try {
    const result = await fetchAPI<any>(`/api/tasks/${taskId}`);
    return result.data;
  } catch {
    return null;
  }
}

// Get status transitions menu for a task
export function getStatusTransitionMenu(task: Task, language: 'en' | 'zh' = 'en') {
  const nextStatuses = getNextStatuses(task.status);
  
  return nextStatuses.map(status => ({
    status,
    label: language === 'zh' ? statusConfig[status]?.label : statusConfig[status]?.labelEn,
    color: statusConfig[status]?.color,
  }));
}
