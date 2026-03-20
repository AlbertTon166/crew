// Deploy Mode Types

export type DeployMode = 'cloud' | 'local'

export interface DeployConfig {
  mode: DeployMode
  hasFrontend: boolean
  hasMonitoring: boolean
  teamsEndpoint: string | null
}

export interface BackendStatus {
  connected: boolean
  mode: DeployMode
  version: string
  features: {
    auth: boolean
    frontend: boolean
    monitoring: boolean
    teamsSync: boolean
  }
  timestamp: string
}

export const DEFAULT_STATUS: BackendStatus = {
  connected: false,
  mode: 'local',
  version: '1.0.0',
  features: {
    auth: true,
    frontend: true,
    monitoring: false,
    teamsSync: false,
  },
  timestamp: new Date().toISOString(),
}
