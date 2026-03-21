/**
 * Data Transformers - Convert API response to frontend format
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Transform Agent from API to frontend format
export function transformAgent(apiAgent: any) {
  return {
    id: apiAgent.id,
    name: apiAgent.name,
    role: apiAgent.role,
    status: apiAgent.status || 'offline',
    modelProvider: apiAgent.model_provider || 'openai',
    modelName: apiAgent.model_name || 'gpt-4',
    systemPrompt: apiAgent.system_prompt || '',
    skills: apiAgent.skills || [],
    enabled: apiAgent.enabled !== false,
    createdAt: apiAgent.created_at,
  }
}

// Transform Project from API to frontend format
export function transformProject(apiProject: any) {
  return {
    id: apiProject.id,
    name: apiProject.name,
    description: apiProject.description || '',
    status: apiProject.status || 'pending',
    tasks: [],
    createdAt: apiProject.created_at,
    updatedAt: apiProject.updated_at,
    progress: calculateProgress(apiProject.status),
    members: 0,
    dueDate: '',
    totalTokens: 0,
    agentCount: 0,
  }
}

// Transform Task from API to frontend format
export function transformTask(apiTask: any) {
  return {
    id: apiTask.id,
    projectId: apiTask.project_id,
    title: apiTask.title,
    description: apiTask.description || '',
    status: apiTask.status || 'pending',
    assignedAgentId: apiTask.assigned_agent_id,
    createdAt: apiTask.created_at,
    updatedAt: apiTask.updated_at,
    executions: [],
  }
}

// Transform Stats from API to frontend format
export function transformStats(apiStats: any) {
  return {
    totalProjects: apiStats.totalProjects || 0,
    inProgress: apiStats.inProgressProjects || 0,
    completed: apiStats.completedProjects || 0,
    error: apiStats.errorProjects || 0,
    pending: apiStats.pendingTasks || 0,
    testing: 0,
  }
}

// Calculate progress based on status
function calculateProgress(status: string) {
  switch (status) {
    case 'completed':
      return 100
    case 'in_progress':
      return 50
    case 'testing':
      return 75
    case 'pending':
      return 0
    default:
      return 0
  }
}

// Format date
export function formatDate(dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString()
}
