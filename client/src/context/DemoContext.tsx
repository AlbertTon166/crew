/**
 * Demo Context
 * Provides demo data for unauthenticated users
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getDemoOverview, getDemoAgents, getDemoProjects, getDemoTasks } from '../lib/demoApi'
import { useDashboardStore } from '../stores/dashboardStore'

interface DemoData {
  isDemoMode: boolean
  isLoading: boolean
  error: string | null
  overview: any | null
  loadDemoData: () => Promise<void>
  clearDemoData: () => void
}

const DemoContext = createContext<DemoData | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [overview, setOverview] = useState<any | null>(null)
  
  const { setAgents, setProjects } = useDashboardStore()

  const loadDemoData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await getDemoOverview()
      setOverview(data)
      setIsDemoMode(true)
      
      // Convert and set store data
      if (data.agents) {
        const convertedAgents = data.agents.map((a: any) => ({
          id: a.id,
          name: a.name,
          role: a.role,
          status: a.status,
          modelProvider: a.model_provider,
          modelName: a.model_name,
          systemPrompt: '',
          skills: a.skills || [],
          enabled: true,
          avgCompleteTime: a.avg_response_time,
          projectCount: 0,
        }))
        setAgents(convertedAgents)
      }
      
      if (data.projects) {
        const convertedProjects = data.projects.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status === 'active' ? 'in_progress' : 'completed',
          tasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
        setProjects(convertedProjects)
      }
      
    } catch (err) {
      console.error('Failed to load demo data:', err)
      setError('Failed to load demo data')
    } finally {
      setIsLoading(false)
    }
  }

  const clearDemoData = () => {
    setIsDemoMode(false)
    setOverview(null)
    setError(null)
    setAgents([])
    setProjects([])
  }

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        isLoading,
        error,
        overview,
        loadDemoData,
        clearDemoData,
      }}
    >
      {children}
    </DemoContext.Provider>
  )
}

export function useDemo() {
  const context = useContext(DemoContext)
  if (!context) {
    throw new Error('useDemo must be used within DemoProvider')
  }
  return context
}
