/**
 * API Service - Frontend to Backend Communication
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_BASE}${endpoint}`
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }
  
  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error)
    throw error
  }
}

// ==================== Projects API ====================

export const projectsApi = {
  getAll: () => apiCall('/api/projects'),

  getById: (id: string) => apiCall(`/api/projects/${id}`),

  create: (data: any) => apiCall('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id: string, data: any) => apiCall(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id: string) => apiCall(`/api/projects/${id}`, {
    method: 'DELETE',
  }),

  // Project status transition with validation
  transition: (id: string, newStatus: string) => apiCall(`/api/projects/${id}/transition`, {
    method: 'POST',
    body: JSON.stringify({ newStatus }),
  }),

  // Generate tasks from PM recommendations
  generateTasks: (id: string) => apiCall(`/api/projects/${id}/generate-tasks`, {
    method: 'POST',
  }),
}

// ==================== Tasks API ====================

export const tasksApi = {
  getAll: (projectId?: string) => {
    const query = projectId ? `?project_id=${projectId}` : ''
    return apiCall(`/api/tasks${query}`)
  },
  
  create: (data: any) => apiCall('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: any) => apiCall(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => apiCall(`/api/tasks/${id}`, {
    method: 'DELETE',
  }),
}

// ==================== Agents API ====================

export const agentsApi = {
  getAll: () => apiCall('/api/agents'),
  
  create: (data: any) => apiCall('/api/agents', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: any) => apiCall(`/api/agents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => apiCall(`/api/agents/${id}`, {
    method: 'DELETE',
  }),
}

// ==================== Knowledge API ====================

export const knowledgeApi = {
  getAll: () => apiCall('/api/knowledge'),
  
  create: (data: any) => apiCall('/api/knowledge', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
}

// ==================== Dashboard Stats API ====================

export const dashboardApi = {
  getStats: () => apiCall('/api/dashboard/stats'),
}

// ==================== Health Check ====================

export const healthApi = {
  check: () => apiCall('/api/health'),
}

// ==================== Status ====================

export const statusApi = {
  get: () => apiCall('/api/status'),
}

// ==================== Auth API ====================

export const authApi = {
  register: (data: any) => apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  login: (data: any) => apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  me: () => apiCall('/api/auth/me'),
}

// ==================== Project Export API ====================

export const projectExportApi = {
  export: (id: string) => apiCall(`/api/projects/${id}/export`),
}

// ==================== Requirements Upload API ====================

export const requirementsApi = {
  getByProject: (projectId: string) => apiCall(`/api/projects/${projectId}/requirements`),
  
  upload: (projectId: string, data: any) => apiCall(`/api/projects/${projectId}/requirements`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
}

export default {
  projects: projectsApi,
  tasks: tasksApi,
  agents: agentsApi,
  knowledge: knowledgeApi,
  dashboard: dashboardApi,
  health: healthApi,
  status: statusApi,
  auth: authApi,
  projectExport: projectExportApi,
  requirements: requirementsApi,
}
