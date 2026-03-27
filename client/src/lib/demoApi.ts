/**
 * Demo API Client
 * Fetches demo data without authentication
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

interface DemoOverview {
  agents: DemoAgent[]
  projects: DemoProject[]
  tasks: DemoTask[]
  requirements: DemoRequirement[]
  stats: {
    totalAgents: number
    totalProjects: number
    totalTasks: number
    completedTasks: number
    runningTasks: number
  }
  rolesSummary: {
    role: string
    count: number
    avg_tasks: number
    avg_load: number
  }[]
}

interface DemoAgent {
  id: string
  name: string
  role: string
  model_provider: string
  model_name: string
  status: string
  avg_response_time: string
  task_count: number
  current_load: number
  personality?: string
  skills?: string[]
}

interface DemoProject {
  id: string
  name: string
  description: string
  status: string
  task_count: number
  completed_tasks: number
  running_tasks?: number
}

interface DemoTask {
  id: string
  title: string
  description: string
  status: string
  priority: string
  workflow_position: any
  node_type: string
  project_name: string
  assignee_name: string | null
  assignee_role: string | null
}

interface DemoRequirement {
  id: string
  title: string
  description: string
  status: string
  priority: string
  project_name: string
}

async function fetchDemo<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Demo API error: ${response.status}`);
  }

  const result = await response.json();
  return result.data || result;
}

export async function getDemoOverview(): Promise<DemoOverview> {
  return fetchDemo<DemoOverview>('/api/demo/overview');
}

export async function getDemoAgents(): Promise<DemoAgent[]> {
  return fetchDemo<DemoAgent[]>('/api/demo/agents');
}

export async function getDemoProjects(): Promise<DemoProject[]> {
  return fetchDemo<DemoProject[]>('/api/demo/projects');
}

export async function getDemoTasks(): Promise<DemoTask[]> {
  return fetchDemo<DemoTask[]>('/api/demo/tasks');
}

export async function getDemoRoles(): Promise<any[]> {
  return fetchDemo<any[]>('/api/demo/roles');
}

// Convert demo data to store format
export function convertDemoAgent(agent: DemoAgent) {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role as any,
    status: agent.status as any,
    modelProvider: agent.model_provider,
    modelName: agent.model_name,
    systemPrompt: '',
    skills: agent.skills || [],
    enabled: true,
    avgCompleteTime: agent.avg_response_time,
    projectCount: 0,
  };
}

export function convertDemoProject(project: DemoProject) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status === 'active' ? 'in_progress' : 'completed',
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function convertDemoTask(task: DemoTask) {
  return {
    id: task.id,
    projectId: '',
    title: task.title,
    description: task.description,
    status: mapTaskStatus(task.status),
    assignedAgentId: task.assignee_name || undefined,
    parentTaskId: undefined,
    dependsOn: [],
    executions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function mapTaskStatus(status: string): Task['status'] {
  const mapping: Record<string, Task['status']> = {
    pending: 'pending',
    running: 'in_progress',
    completed: 'completed',
    failed: 'failed',
  };
  return mapping[status] || 'pending';
}

type Task = {
  id: string
  projectId: string
  title: string
  description: string
  status: 'todo' | 'pending' | 'in_progress' | 'subtask_pending' | 'needs_review' | 'review_passed' | 'review_failed' | 'completed' | 'failed'
  assignedAgentId?: string
  parentTaskId?: string
  dependsOn?: string[]
  executions: any[]
  createdAt: string
  updatedAt: string
}
