const API_BASE = import.meta.env.VITE_API_BASE || ''

async function request(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  // Projects
  projects: {
    list: () => request('/api/projects'),
    get: (id: string) => request(`/api/projects/${id}`),
    create: (data: any) => request('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/projects/${id}`, { method: 'DELETE' }),
    stats: (id: string) => request(`/api/projects/${id}/stats`),
  },
  // Tasks
  tasks: {
    create: (data: any) => request('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) => request(`/api/tasks/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    delete: (id: string) => request(`/api/tasks/${id}`, { method: 'DELETE' }),
  },
  // Agents
  agents: {
    list: () => request('/api/agents'),
    get: (id: string) => request(`/api/agents/${id}`),
    create: (data: any) => request('/api/agents', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/api/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) => request(`/api/agents/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    delete: (id: string) => request(`/api/agents/${id}`, { method: 'DELETE' }),
  },
}
