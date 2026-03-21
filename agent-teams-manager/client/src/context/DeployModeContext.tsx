import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { DeployMode, BackendStatus } from '../types/deploy'
import { DEFAULT_STATUS } from '../types/deploy'

interface DeployModeContextType {
  mode: DeployMode
  backendStatus: BackendStatus
  isConnected: boolean
  checkStatus: () => Promise<void>
}

const DeployModeContext = createContext<DeployModeContextType | null>(null)

export function DeployModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DeployMode>('cloud')
  const [backendStatus, setBackendStatus] = useState<BackendStatus>(DEFAULT_STATUS)

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/status')
      if (res.ok) {
        const data = await res.json()
        setBackendStatus(data)
        setMode(data.mode || 'cloud')
      } else {
        setBackendStatus({ ...DEFAULT_STATUS, connected: false })
      }
    } catch {
      setBackendStatus({ ...DEFAULT_STATUS, connected: false })
    }
  }

  useEffect(() => {
    checkStatus()
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <DeployModeContext.Provider
      value={{
        mode,
        backendStatus,
        isConnected: backendStatus.connected,
        checkStatus,
      }}
    >
      {children}
    </DeployModeContext.Provider>
  )
}

export function useDeployMode() {
  const context = useContext(DeployModeContext)
  if (!context) {
    throw new Error('useDeployMode must be used within DeployModeProvider')
  }
  return context
}
