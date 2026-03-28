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
  // Requirements
  requirements: {
    list: (params?: { projectId?: string; status?: string }) => {
      const searchParams = new URLSearchParams()
      if (params?.projectId) searchParams.set('projectId', params.projectId)
      if (params?.status) searchParams.set('status', params.status)
      const query = searchParams.toString()
      return request(`/api/requirements${query ? `?${query}` : ''}`)
    },
    get: (id: string) => request(`/api/requirements/${id}`),
    create: (data: { projectId: string; title: string; description?: string; priority?: string }) =>
      request('/api/requirements', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { title?: string; description?: string; status?: string; priority?: string }) =>
      request(`/api/requirements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/requirements/${id}`, { method: 'DELETE' }),
    analyze: (id: string) => request(`/api/requirements/${id}/analyze`, { method: 'POST' }),
  },
  // Knowledge
  knowledge: {
    list: (params?: { category?: string }) => {
      const searchParams = new URLSearchParams()
      if (params?.category) searchParams.set('category', params.category)
      const query = searchParams.toString()
      return request(`/api/knowledge${query ? `?${query}` : ''}`)
    },
    get: (id: string) => request(`/api/knowledge/${id}`),
    create: (data: { title: string; content: string; category?: string; tags?: string[] }) =>
      request('/api/knowledge', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { title?: string; content?: string; category?: string; tags?: string[] }) =>
      request(`/api/knowledge/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/knowledge/${id}`, { method: 'DELETE' }),
    search: (q: string, category?: string) => {
      const searchParams = new URLSearchParams({ q })
      if (category) searchParams.set('category', category)
      return request(`/api/knowledge/search?${searchParams.toString()}`)
    },
  },
  // API Keys
  apiKeys: {
    list: () => request('/api/api-keys'),
    create: (data: { name: string; provider: string; model?: string }) =>
      request('/api/api-keys', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/api-keys/${id}`, { method: 'DELETE' }),
  },
}
