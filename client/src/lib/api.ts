const API_BASE = import.meta.env.VITE_API_BASE || ''
const REQUEST_TIMEOUT = 10000 // 10 seconds

class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

class TimeoutError extends Error {
  constructor(message: string = 'Request timed out') {
    super(message)
    this.name = 'TimeoutError'
  }
}

// Get tenant ID and auth token from localStorage (set during login)
function getTenantId(): string | null {
  return localStorage.getItem('tenantId')
}

function getAuthToken(): string | null {
  try {
    const tokens = localStorage.getItem('auth_tokens')
    if (tokens) {
      const parsed = JSON.parse(tokens)
      // Ensure parsed is an array
      if (!Array.isArray(parsed)) {
        return null
      }
      // Find any active, non-expired token (support both JWT and simple token formats)
      const now = Date.now()
      const validTokens = parsed.filter((t: any) => 
        t && 
        t.token && 
        typeof t.token === 'string' &&
        t.isActive && 
        (!t.expiresAt || new Date(t.expiresAt).getTime() > now)
      )
      // Return the most recent valid token (last in array = most recently added)
      if (validTokens.length > 0) {
        return validTokens[validTokens.length - 1].token
      }
      return null
    }
  } catch (e) {
    // Ignore parse errors
  }
  return null
}

async function request(endpoint: string, options?: RequestInit) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  
  const tenantId = getTenantId()
  const authToken = getAuthToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  
  // Add tenant ID header for multi-tenancy support
  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId
  }
  
  // Add auth token for protected endpoints
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers,
      signal: controller.signal,
      ...options,
    })
    clearTimeout(timeoutId)

    const data = await res.json()
    if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : `Request failed (${res.status})`)
    return data
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new TimeoutError('Request timed out after 10 seconds')
    }
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new NetworkError('Network connection failed. Please check your network.')
    }
    throw err
  }
}

export { NetworkError, TimeoutError }

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
    create: (data: { name: string; provider: string; model?: string; key: string }) =>
      request('/api/api-keys', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/api-keys/${id}`, { method: 'DELETE' }),
  },
  // Servers
  servers: {
    list: () => request('/api/servers'),
    create: (data: { name: string; type: string; host: string; port?: number; username?: string; password?: string }) =>
      request('/api/servers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/api/servers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    test: (id: string) => request(`/api/servers/${id}/test`, { method: 'POST' }),
    delete: (id: string) => request(`/api/servers/${id}`, { method: 'DELETE' }),
    // Container management
    spawn: (id: string, data: { image: string; command?: string[]; taskId?: string; env?: string[] }) =>
      request(`/api/servers/${id}/spawn`, { method: 'POST', body: JSON.stringify(data) }),
    getContainers: (id: string) => request(`/api/servers/${id}/containers`, { method: 'GET' }),
    getContainerLogs: (id: string, containerId: string, tail?: number) =>
      request(`/api/servers/${id}/container/${containerId}/logs?tail=${tail || 100}`),
    killContainer: (id: string, containerId: string) =>
      request(`/api/servers/${id}/container/${containerId}/kill`, { method: 'POST' }),
    removeContainer: (id: string, containerId: string) =>
      request(`/api/servers/${id}/container/${containerId}`, { method: 'DELETE' }),
  },
}
