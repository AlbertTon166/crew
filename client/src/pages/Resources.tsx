import { useState, useEffect } from 'react'
import { 
  Key, Server, Shield, Globe, Plus, Trash2, Edit2, 
  CheckCircle, AlertCircle, Copy, Eye, EyeOff, RefreshCw,
  Wifi, WifiOff, Database, HardDrive, Cpu, Lock, Unlock,
  Gauge, Clock, Zap, Users, Settings as SettingsIcon,
  FolderKanban, Bot, X, Loader2
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

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
  lastChecked: string | null
  health: 'healthy' | 'degraded' | 'offline'
  assignedTo: string[]
  createdAt: string
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

// Tab types
const tabs = [
  { id: 'shared-keys', label: '共享密钥', labelEn: 'Shared Keys', icon: Key },
  { id: 'servers', label: '服务器', labelEn: 'Servers', icon: Server },
  { id: 'rate-limits', label: '限流配置', labelEn: 'Rate Limits', icon: Gauge },
]

export default function Resources() {
  const { language } = useLanguage()
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('shared-keys')
  const [showCreateModal, setShowCreateModal] = useState<string | null>(null)
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())

  // Admin check - in production this would come from auth
  const hasAdminAccess = true

  if (!hasAdminAccess) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%', 
        padding: '40px',
        textAlign: 'center'
      }}>
        <Lock size={64} style={{ color: 'var(--text-tertiary)', marginBottom: '20px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
          {language === 'zh' ? '需要管理员权限' : 'Admin Access Required'}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', maxWidth: '400px' }}>
          {language === 'zh' 
            ? '此页面仅对管理员开放。请联系系统管理员获取访问权限。'
            : 'This page is only accessible to administrators. Please contact your system admin for access.'}
        </p>
      </div>
    )
  }

  const toggleReveal = (id: string) => {
    setRevealedKeys(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div 
      className="page-container animate-fade-in"
      style={{ 
        background: 'var(--bg-primary)',
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        height: '100%',
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {language === 'zh' ? '资源管理' : 'Resources'}
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              {language === 'zh' ? '管理共享 API 密钥、服务器连接和限流配置' : 'Manage shared API keys, server connections, and rate limits'}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
            }}>
              <Shield size={14} style={{ color: '#34D399' }} />
              <span style={{ fontSize: '12px', fontWeight: '500', color: '#34D399' }}>
                {language === 'zh' ? '管理员' : 'Admin'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        background: 'var(--bg-secondary)',
        padding: '6px',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        width: 'fit-content',
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                background: isActive ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Icon size={16} />
              {language === 'zh' ? tab.label : tab.labelEn}
            </button>
          )
        })}
      </div>
      
      {/* Content */}
      {activeTab === 'shared-keys' && (
        <SharedKeysTab 
          revealedKeys={revealedKeys}
          onToggleReveal={toggleReveal}
          language={language}
        />
      )}
      
      {activeTab === 'servers' && (
        <ServersTab 
          revealedKeys={revealedKeys}
          onToggleReveal={toggleReveal}
          language={language}
        />
      )}
      
      {activeTab === 'rate-limits' && (
        <RateLimitsTab language={language} />
      )}
    </div>
  )
}

// Shared Keys Tab
function SharedKeysTab({ revealedKeys, onToggleReveal, language }: {
  revealedKeys: Set<string>
  onToggleReveal: (id: string) => void
  language: 'en' | 'zh'
}) {
  const [keys, setKeys] = useState<SharedAPIKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newKey, setNewKey] = useState({ name: '', provider: 'openai', apiKey: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.apiKeys.list()
      // Convert apiKeys to SharedAPIKey format (they share the same backend model)
      const converted: SharedAPIKey[] = (res.data || []).map((k: any) => ({
        id: k.id,
        name: k.name,
        provider: k.provider || 'other',
        key: k.key,
        prefix: k.prefix,
        rateLimit: 60,
        rateLimitWindow: 60,
        isActive: k.status === 'active',
        assignedTo: [],
        createdAt: k.createdAt,
        usageCount: k.usageCount || 0,
      }))
      setKeys(converted)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newKey.name || !newKey.apiKey) return
    setCreating(true)
    try {
      await api.apiKeys.create({
        name: newKey.name,
        provider: newKey.provider,
        model: 'gpt-4o', // Default model
      })
      setShowCreate(false)
      setNewKey({ name: '', provider: 'openai', apiKey: '' })
      fetchKeys()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'zh' ? '确定删除？' : 'Delete?')) return
    setDeletingId(id)
    try {
      await api.apiKeys.delete(id)
      setKeys(prev => prev.filter(k => k.id !== id))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {language === 'zh' ? '团队共享 API 密钥' : 'Team Shared API Keys'}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {language === 'zh' ? '所有团队成员可使用的共享密钥，支持限流配置' : 'Shared keys available to all team members with rate limit config'}
          </p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 18px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            border: 'none',
            color: 'white',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}>
          <Plus size={16} />
          {language === 'zh' ? '添加密钥' : 'Add Key'}
        </button>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : error ? (
        <div style={{ padding: '16px', background: 'rgba(248,113,113,0.1)', borderRadius: '12px', color: '#F87171' }}>
          {error}
        </div>
      ) : keys.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
          {language === 'zh' ? '暂无共享密钥' : 'No shared keys yet'}
        </div>
      ) : (
        keys.map(key => {
          const cfg = providerConfig[key.provider as keyof typeof providerConfig] || providerConfig.custom
          const isRevealed = revealedKeys.has(key.id)
          
          return (
            <div key={key.id} style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '20px',
              opacity: deletingId === key.id ? 0.5 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '12px',
                      background: `${cfg.color}15`,
                      border: `1px solid ${cfg.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Key size={20} style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                          {key.name}
                        </h4>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: key.isActive ? '#34D399' : '#64748B',
                        }} />
                      </div>
                      <span style={{ fontSize: '12px', color: cfg.color }}>{cfg.label}</span>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '10px',
                    marginBottom: '12px',
                  }}>
                    <code style={{ flex: 1, fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {isRevealed ? key.key : key.prefix + '...' + '·'.repeat(20)}
                    </code>
                    <button onClick={() => onToggleReveal(key.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                      {isRevealed ? <EyeOff size={16} style={{ color: 'var(--text-tertiary)' }} /> : <Eye size={16} style={{ color: 'var(--text-tertiary)' }} />}
                    </button>
                    <button 
                      onClick={() => navigator.clipboard.writeText(key.key)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                      <Copy size={16} style={{ color: 'var(--text-tertiary)' }} />
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Gauge size={14} />
                      <span>{key.rateLimit} calls / {key.rateLimitWindow}s</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{key.usageCount.toLocaleString()} {language === 'zh' ? '次调用' : 'calls'}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleDelete(key.id)}
                    disabled={deletingId === key.id}
                    style={{ 
                      padding: '10px', 
                      borderRadius: '10px', 
                      background: 'var(--bg-tertiary)', 
                      border: '1px solid var(--border)', 
                      cursor: deletingId === key.id ? 'not-allowed' : 'pointer' 
                    }}>
                    {deletingId === key.id ? (
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Trash2 size={16} style={{ color: '#F87171' }} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowCreate(false)}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            width: '90%',
            maxWidth: '420px',
            padding: '24px',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
              {language === 'zh' ? '添加 API 密钥' : 'Add API Key'}
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? '名称' : 'Name'}
              </label>
              <input
                type="text"
                value={newKey.name}
                onChange={e => setNewKey(prev => ({ ...prev, name: e.target.value }))}
                placeholder={language === 'zh' ? '例如：Production OpenAI' : 'e.g., Production OpenAI'}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? '提供商' : 'Provider'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {Object.entries(providerConfig).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setNewKey(prev => ({ ...prev, provider: key }))}
                    style={{
                      padding: '12px 8px', borderRadius: '10px',
                      border: newKey.provider === key ? `2px solid ${cfg.color}` : '1px solid var(--border)',
                      background: newKey.provider === key ? `${cfg.color}10` : 'var(--bg-tertiary)',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    }}>
                    <span style={{ fontSize: '10px', fontWeight: '500', color: newKey.provider === key ? cfg.color : 'var(--text-tertiary)' }}>
                      {cfg.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? 'API 密钥' : 'API Key'}
              </label>
              <input
                type="password"
                value={newKey.apiKey}
                onChange={e => setNewKey(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="sk-..."
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'monospace', outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding: '12px 20px', borderRadius: '10px', border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                  fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                }}>
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleCreate}
                disabled={!newKey.name || !newKey.apiKey || creating}
                style={{
                  padding: '12px 20px', borderRadius: '10px', border: 'none',
                  background: newKey.name && newKey.apiKey && !creating ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'var(--bg-tertiary)',
                  color: newKey.name && newKey.apiKey && !creating ? 'white' : 'var(--text-tertiary)',
                  fontSize: '14px', fontWeight: '600', cursor: newKey.name && newKey.apiKey && !creating ? 'pointer' : 'not-allowed',
                }}>
                {creating ? (language === 'zh' ? '添加中...' : 'Adding...') : (language === 'zh' ? '添加' : 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// Servers Tab
function ServersTab({ revealedKeys, onToggleReveal, language }: {
  revealedKeys: Set<string>
  onToggleReveal: (id: string) => void
  language: 'en' | 'zh'
}) {
  const [servers, setServers] = useState<ServerConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newServer, setNewServer] = useState({ name: '', type: 'custom', baseURL: '', apiKey: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchServers()
  }, [])

  const fetchServers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.servers.list()
      const converted: ServerConnection[] = (res.data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        type: s.type || 'custom',
        baseURL: s.baseURL || '',
        apiKey: s.apiKey || '',
        prefix: s.prefix || '',
        rateLimit: s.rateLimit || 60,
        rateLimitWindow: s.rateLimitWindow || 60,
        isActive: s.isActive ?? true,
        isConnected: s.isConnected ?? false,
        lastChecked: s.lastChecked,
        health: s.health || 'offline',
        assignedTo: [],
        createdAt: s.createdAt,
      }))
      setServers(converted)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newServer.name || !newServer.baseURL || !newServer.apiKey) return
    setCreating(true)
    try {
      await api.servers.create({
        name: newServer.name,
        type: newServer.type,
        baseURL: newServer.baseURL,
        apiKey: newServer.apiKey,
      })
      setShowCreate(false)
      setNewServer({ name: '', type: 'custom', baseURL: '', apiKey: '' })
      fetchServers()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'zh' ? '确定删除？' : 'Delete?')) return
    setDeletingId(id)
    try {
      await api.servers.delete(id)
      setServers(prev => prev.filter(s => s.id !== id))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleTest = async (id: string) => {
    setTestingId(id)
    try {
      const res = await api.servers.test(id)
      setServers(prev => prev.map(s => 
        s.id === id ? { 
          ...s, 
          isConnected: res.data.isConnected, 
          health: res.data.health,
          lastChecked: res.data.lastChecked,
        } : s
      ))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setTestingId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {language === 'zh' ? '服务器连接' : 'Server Connections'}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {language === 'zh' ? '配置自托管模型服务器和 API 端点' : 'Configure self-hosted model servers and API endpoints'}
          </p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 18px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            border: 'none',
            color: 'white',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}>
          <Plus size={16} />
          {language === 'zh' ? '添加服务器' : 'Add Server'}
        </button>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : error ? (
        <div style={{ padding: '16px', background: 'rgba(248,113,113,0.1)', borderRadius: '12px', color: '#F87171' }}>
          {error}
        </div>
      ) : servers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
          {language === 'zh' ? '暂无服务器连接' : 'No server connections yet'}
        </div>
      ) : (
        servers.map(server => {
          const cfg = providerConfig[server.type as keyof typeof providerConfig] || providerConfig.custom
          const healthColor = server.health === 'healthy' ? '#34D399' : server.health === 'degraded' ? '#FBBF24' : '#F87171'
          const isRevealed = revealedKeys.has(server.id)
          
          return (
            <div key={server.id} style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '20px',
              opacity: deletingId === server.id ? 0.5 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '12px',
                      background: `${cfg.color}15`,
                      border: `1px solid ${cfg.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Server size={20} style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                          {server.name}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: healthColor }} />
                          <span style={{ fontSize: '11px', color: healthColor }}>
                            {server.health === 'healthy' ? (language === 'zh' ? '健康' : 'Healthy') :
                             server.health === 'degraded' ? (language === 'zh' ? '性能下降' : 'Degraded') :
                             (language === 'zh' ? '离线' : 'Offline')}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', color: cfg.color }}>{server.baseURL}</span>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '10px',
                    marginBottom: '12px',
                  }}>
                    <code style={{ flex: 1, fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {isRevealed ? server.apiKey : server.prefix + '...' + '·'.repeat(20)}
                    </code>
                    <button onClick={() => onToggleReveal(server.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                      {isRevealed ? <EyeOff size={16} style={{ color: 'var(--text-tertiary)' }} /> : <Eye size={16} style={{ color: 'var(--text-tertiary)' }} />}
                    </button>
                    <button 
                      onClick={() => navigator.clipboard.writeText(server.apiKey)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                      <Copy size={16} style={{ color: 'var(--text-tertiary)' }} />
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Gauge size={14} />
                      <span>{server.rateLimit} calls / {server.rateLimitWindow}s</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} />
                      <span>{language === 'zh' ? '最后检查' : 'Last checked'}: {server.lastChecked ? new Date(server.lastChecked).toLocaleString() : '-'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {server.isConnected ? (
                        <Wifi size={14} style={{ color: '#34D399' }} />
                      ) : (
                        <WifiOff size={14} style={{ color: '#F87171' }} />
                      )}
                      <span>{server.isConnected ? (language === 'zh' ? '已连接' : 'Connected') : (language === 'zh' ? '未连接' : 'Disconnected')}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleTest(server.id)}
                    disabled={testingId === server.id}
                    style={{ 
                      padding: '10px', 
                      borderRadius: '10px', 
                      background: 'var(--bg-tertiary)', 
                      border: '1px solid var(--border)', 
                      cursor: testingId === server.id ? 'not-allowed' : 'pointer' 
                    }}>
                    {testingId === server.id ? (
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <RefreshCw size={16} style={{ color: 'var(--text-secondary)' }} />
                    )}
                  </button>
                  <button 
                    onClick={() => handleDelete(server.id)}
                    disabled={deletingId === server.id}
                    style={{ 
                      padding: '10px', 
                      borderRadius: '10px', 
                      background: 'var(--bg-tertiary)', 
                      border: '1px solid var(--border)', 
                      cursor: deletingId === server.id ? 'not-allowed' : 'pointer' 
                    }}>
                    {deletingId === server.id ? (
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Trash2 size={16} style={{ color: '#F87171' }} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowCreate(false)}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            width: '90%',
            maxWidth: '420px',
            padding: '24px',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
              {language === 'zh' ? '添加服务器' : 'Add Server'}
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? '名称' : 'Name'}
              </label>
              <input
                type="text"
                value={newServer.name}
                onChange={e => setNewServer(prev => ({ ...prev, name: e.target.value }))}
                placeholder={language === 'zh' ? '例如：本地 Ollama' : 'e.g., Local Ollama'}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? '类型' : 'Type'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {Object.entries(providerConfig).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setNewServer(prev => ({ ...prev, type: key }))}
                    style={{
                      padding: '12px 8px', borderRadius: '10px',
                      border: newServer.type === key ? `2px solid ${cfg.color}` : '1px solid var(--border)',
                      background: newServer.type === key ? `${cfg.color}10` : 'var(--bg-tertiary)',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    }}>
                    <span style={{ fontSize: '10px', fontWeight: '500', color: newServer.type === key ? cfg.color : 'var(--text-tertiary)' }}>
                      {cfg.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? 'Base URL' : 'Base URL'}
              </label>
              <input
                type="text"
                value={newServer.baseURL}
                onChange={e => setNewServer(prev => ({ ...prev, baseURL: e.target.value }))}
                placeholder="http://localhost:11434"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'monospace', outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? 'API 密钥' : 'API Key'}
              </label>
              <input
                type="password"
                value={newServer.apiKey}
                onChange={e => setNewServer(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="sk-..."
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'monospace', outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding: '12px 20px', borderRadius: '10px', border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                  fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                }}>
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleCreate}
                disabled={!newServer.name || !newServer.baseURL || !newServer.apiKey || creating}
                style={{
                  padding: '12px 20px', borderRadius: '10px', border: 'none',
                  background: newServer.name && newServer.baseURL && newServer.apiKey && !creating ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'var(--bg-tertiary)',
                  color: newServer.name && newServer.baseURL && newServer.apiKey && !creating ? 'white' : 'var(--text-tertiary)',
                  fontSize: '14px', fontWeight: '600', cursor: newServer.name && newServer.baseURL && newServer.apiKey && !creating ? 'pointer' : 'not-allowed',
                }}>
                {creating ? (language === 'zh' ? '添加中...' : 'Adding...') : (language === 'zh' ? '添加' : 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// Rate Limits Tab
function RateLimitsTab({ language }: { language: 'en' | 'zh' }) {
  // Static rate limit tiers (could be fetched from backend in future)
  const tiers: RateLimitConfig[] = [
    { id: 'free', name: 'Free', tier: 'free', maxCalls: 60, windowSeconds: 60, maxTokens: 10000, maxProjects: 1, maxAgents: 3, price: '$0' },
    { id: 'starter', name: 'Starter', tier: 'starter', maxCalls: 300, windowSeconds: 60, maxTokens: 100000, maxProjects: 5, maxAgents: 10, price: '$29' },
    { id: 'pro', name: 'Pro', tier: 'pro', maxCalls: 1000, windowSeconds: 60, maxTokens: 1000000, maxProjects: 20, maxAgents: 50, price: '$99' },
    { id: 'enterprise', name: 'Enterprise', tier: 'enterprise', maxCalls: 10000, windowSeconds: 60, maxTokens: 10000000, maxProjects: -1, maxAgents: -1, price: 'Custom' },
  ]
  
  const tierColors = {
    free: '#64748B',
    starter: '#3B82F6',
    pro: '#8B5CF6',
    enterprise: '#F59E0B',
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {language === 'zh' ? '限流配置层级' : 'Rate Limit Tiers'}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          {language === 'zh' ? '配置不同订阅层级的调用限制' : 'Configure rate limits for different subscription tiers'}
        </p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {tiers.map(tier => {
          const color = tierColors[tier.tier as keyof typeof tierColors]
          return (
            <div key={tier.id} style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {tier.tier === 'pro' && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '-24px',
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '600',
                  padding: '4px 32px',
                  transform: 'rotate(45deg)',
                }}>
                  {language === 'zh' ? '推荐' : 'Popular'}
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '12px',
                  background: `${color}15`,
                  border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Zap size={24} style={{ color }} />
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                    {tier.name}
                  </h4>
                  <span style={{ fontSize: '14px', color }}>{tier.price}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {[
                  { icon: <Zap size={14} />, label: language === 'zh' ? '调用限制' : 'Calls', value: tier.maxCalls < 0 ? '∞' : `${tier.maxCalls}/${(tier.windowSeconds / 60)}min` },
                  { icon: <Gauge size={14} />, label: language === 'zh' ? 'Token 上限' : 'Token Limit', value: tier.maxTokens < 0 ? '∞' : tier.maxTokens.toLocaleString() },
                  { icon: <FolderKanban size={14} />, label: language === 'zh' ? '项目数' : 'Projects', value: tier.maxProjects < 0 ? '∞' : tier.maxProjects },
                  { icon: <Bot size={14} />, label: language === 'zh' ? 'Agent 数' : 'Agents', value: tier.maxAgents < 0 ? '∞' : tier.maxAgents },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
              
              <button style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: `1px solid ${color}`,
                background: `${color}10`,
                color: color,
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}>
                {language === 'zh' ? '编辑配置' : 'Edit Config'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
