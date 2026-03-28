import { useState } from 'react'
import { 
  Key, Server, Shield, Globe, Plus, Trash2, Edit2, 
  CheckCircle, AlertCircle, Copy, Eye, EyeOff, RefreshCw,
  Wifi, WifiOff, Database, HardDrive, Cpu, Lock, Unlock,
  Gauge, Clock, Zap, Users, Settings as SettingsIcon,
  FolderKanban, Bot
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'

// Shared API Key model
interface SharedAPIKey {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'deepseek' | 'other'
  key: string
  prefix: string
  rateLimit: number        // calls per window
  rateLimitWindow: number  // window in seconds (e.g. 300 = 5 min)
  isActive: boolean
  assignedTo: string[]     // user IDs or 'all'
  createdAt: string
  usageCount: number
}

// Server connection model
interface ServerConnection {
  id: string
  name: string
  type: 'openai' | 'anthropic' | 'deepseek' | 'custom'
  baseURL: string
  apiKey: string
  prefix: string
  rateLimit: number
  rateLimitWindow: number
  isActive: boolean
  isConnected: boolean
  lastChecked: string
  health: 'healthy' | 'degraded' | 'offline'
  assignedTo: string[]
}

// Rate limit config model
interface RateLimitConfig {
  id: string
  name: string
  tier: 'free' | 'starter' | 'pro' | 'enterprise'
  maxCalls: number
  windowSeconds: number
  maxTokens: number
  maxProjects: number
  maxAgents: number
  price: string
}

// Provider config
const providerConfig = {
  openai: { label: 'OpenAI', color: '#10A37F' },
  anthropic: { label: 'Anthropic', color: '#CC785C' },
  deepseek: { label: 'DeepSeek', color: '#0066CC' },
  custom: { label: 'Custom', color: '#8B5CF6' },
}


// Shared API Key model
interface SharedAPIKey {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'deepseek' | 'other'
  key: string
  prefix: string
  rateLimit: number
  rateLimitWindow: number
  isActive: boolean
  assignedTo: string[]
  createdAt: string
  usageCount: number
}

// Server connection model
interface ServerConnection {
  id: string
  name: string
  type: 'openai' | 'anthropic' | 'deepseek' | 'custom'
  baseURL: string
  apiKey: string
  prefix: string
  rateLimit: number
  rateLimitWindow: number
  isActive: boolean
  isConnected: boolean
  lastChecked: string
  health: 'healthy' | 'degraded' | 'offline'
  assignedTo: string[]
}

// Rate limit config model
interface RateLimitConfig {
  id: string
  name: string
  tier: 'free' | 'starter' | 'pro' | 'enterprise'
  maxCalls: number
  windowSeconds: number
}

export default function Resources() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'keys' | 'servers' | 'limits'>('keys')
  const [showAddKey, setShowAddKey] = useState(false)
  const [showAddServer, setShowAddServer] = useState(false)

  // Empty state for mock data
  const mockSharedKeys: SharedAPIKey[] = []
  const mockServers: ServerConnection[] = []
  const mockRateLimitTiers: RateLimitConfig[] = []
