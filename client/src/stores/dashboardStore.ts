import { create } from 'zustand'

export interface TaskExecution {
  id: string
  taskId: string
  agentId: string
  agentName: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  input: string
  output?: string
  error?: string
  startedAt: string
  completedAt?: string
  sessionId?: string
}

export interface Agent {
  id: string
  name: string
  role: 'pm' | 'planner' | 'frontend' | 'backend' | 'reviewer' | 'tester' | 'deployer'
  status: 'online' | 'offline' | 'busy' | 'error'
  modelProvider: string
  modelName: string
  systemPrompt: string
  skills: string[]
  enabled: boolean
  createdAt?: string
  projectCount?: number
  avgCompleteTime?: string
  totalTokens?: number
  runningDays?: number
}

export interface Project {
  id: string
  name: string
  nameZh?: string
  description: string
  descZh?: string
  status: 'pending' | 'in_progress' | 'testing' | 'completed' | 'error' | 'deleted' | 'evaluating' | 'pending_dev' | 'subtask_pending' | 'needs_review' | 'review_passed' | 'review_failed'
  tasks: Task[]
  createdAt: string
  updatedAt: string
  dueDate?: string
  deletedAt?: string
  version?: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  titleZh?: string
  description: string
  status: 'todo' | 'pending' | 'in_progress' | 'subtask_pending' | 'needs_review' | 'review_passed' | 'review_failed' | 'completed' | 'failed'
  assignedAgentId?: string
  parentTaskId?: string
  dependsOn?: string[]
  executions: TaskExecution[]
  createdAt: string
  updatedAt: string
}

export interface LogEntry {
  id: string
  taskId?: string
  agentId: string
  agentName: string
  level: 'info' | 'warn' | 'error'
  message: string
  timestamp: string
}

export interface Knowledge {
  id: string
  title: string
  titleZh?: string
  content: string
  contentZh?: string
  category: 'role' | 'document' | 'rule'
  parentId?: string
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalProjects: number
  inProgress: number
  completed: number
  error: number
  pending: number
  testing: number
}

export interface ResourceUsage {
  cpu: number
  memory: number
  disk: number
  totalTokens?: number
}

interface DashboardStore {
  agents: Agent[]
  projects: Project[]
  tasks: Record<string, Task[]>
  knowledge: Knowledge[]
  stats: DashboardStats
  resources: ResourceUsage
  activities: LogEntry[]

  setAgents: (agents: Agent[]) => void
  addAgent: (agent: Agent) => void
  updateAgent: (id: string, updates: Partial<Agent>) => void
  deleteAgent: (id: string) => void

  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void

  setTasks: (tasks: Record<string, Task[]>) => void
  addTask: (projectId: string, task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  deleteTask: (taskId: string) => void

  setKnowledge: (knowledge: Knowledge[]) => void
  addKnowledge: (item: Knowledge) => void
  updateKnowledge: (id: string, updates: Partial<Knowledge>) => void
  deleteKnowledge: (id: string) => void

  setStats: (stats: DashboardStats) => void
  setResources: (resources: ResourceUsage) => void
  setActivities: (activities: LogEntry[]) => void
  addActivity: (activity: LogEntry) => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  agents: [],
  projects: [],
  tasks: {},
  knowledge: [],
  stats: { totalProjects: 0, inProgress: 0, completed: 0, error: 0, pending: 0, testing: 0 },
  resources: { cpu: 0, memory: 0, disk: 0 },
  activities: [],

  setAgents: (agents) => set({ agents }),
  addAgent: (agent) => set((state) => ({ agents: [...state.agents, agent] })),
  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  deleteAgent: (id) =>
    set((state) => ({ agents: state.agents.filter((a) => a.id !== id) })),

  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  deleteProject: (id) =>
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

  setTasks: (tasks) => set({ tasks }),
  addTask: (projectId, task) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [projectId]: [...(state.tasks[projectId] || []), task],
      },
    })),
  updateTask: (taskId, updates) =>
    set((state) => {
      const newTasks = { ...state.tasks }
      Object.keys(newTasks).forEach((projectId) => {
        newTasks[projectId] = newTasks[projectId].map((t) =>
          t.id === taskId ? { ...t, ...updates } : t
        )
      })
      return { tasks: newTasks }
    }),
  deleteTask: (taskId) =>
    set((state) => {
      const newTasks = { ...state.tasks }
      Object.keys(newTasks).forEach((projectId) => {
        newTasks[projectId] = newTasks[projectId].filter((t) => t.id !== taskId)
      })
      return { tasks: newTasks }
    }),

  setKnowledge: (knowledge) => set({ knowledge }),
  addKnowledge: (item) => set((state) => ({ knowledge: [...state.knowledge, item] })),
  updateKnowledge: (id, updates) =>
    set((state) => ({
      knowledge: state.knowledge.map((k) => (k.id === id ? { ...k, ...updates } : k)),
    })),
  deleteKnowledge: (id) =>
    set((state) => ({ knowledge: state.knowledge.filter((k) => k.id !== id) })),

  setStats: (stats) => set({ stats }),
  setResources: (resources) => set({ resources }),
  setActivities: (activities) => set({ activities }),
  addActivity: (activity) =>
    set((state) => ({ activities: [activity, ...state.activities].slice(0, 20) })),
}))
