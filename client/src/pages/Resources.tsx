import { useState, useEffect } from 'react'
import { 
  Key, Server, Plus, Trash2, 
  Copy, Eye, EyeOff, RefreshCw,
  Wifi, WifiOff, Clock, Loader2,
  HardDrive, Terminal, Lock
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

// ============================================
// Types
// ============================================

interface APIKey {
  id: string
  name: string
  provider: string
  model: string
  apiKey: string
  prefix: string
  status: string
  createdAt: string
}

interface Server {
  id: string
  name: string
  type: 'docker' | 'ssh' | 'openclaw'
  host: string
  port: number
  username: string
  password: string
  status: 'online' | 'offline' | 'degraded'
  lastChecked: string | null
  createdAt: string
}

// Provider config - simple preset providers
const providerConfig: Record<string, { label: string; color: string; models: string[] }> = {
  openai: { label: 'OpenAI', color: '#10A37F', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  anthropic: { label: 'Anthropic', color: '#CC785C', models: ['claude-sonnet-4', 'claude-3-5-sonnet', 'claude-3-5-haiku'] },
  deepseek: { label: 'DeepSeek', color: '#0066CC', models: ['deepseek-chat', 'deepseek-coder'] },
  zhipu: { label: '智谱AI', color: '#7C3AED', models: ['glm-4', 'glm-4-flash', 'glm-3-turbo'] },
  minimax: { label: 'MiniMax', color: '#00D4AA', models: ['MiniMax-Text-01', 'abab6.5s-chat'] },
  other: { label: 'Other', color: '#8B5CF6', models: [] },
}

const tabs = [
  { id: 'api-keys', label: '共享密钥', labelEn: 'API Keys', icon: Key },
  { id: 'servers', label: '服务器', labelEn: 'Servers', icon: Server },
]

export default function Resources() {
  const { language } = useLanguage()
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('api-keys')

  const hasAdminAccess = true

  if (!hasAdminAccess) {
    return (
      <div style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        height: '100%', padding: '40px', textAlign: 'center'
      }}>
        <Lock size={64} style={{ color: 'var(--text-tertiary)', marginBottom: '20px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
          {language === 'zh' ? '需要管理员权限' : 'Admin Access Required'}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', maxWidth: '400px' }}>
          {language === 'zh' ? '此页面仅对管理员开放。' : 'This page is only accessible to administrators.'}
        </p>
      </div>
    )
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
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
          {language === 'zh' ? '资源管理' : 'Resources'}
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
          {language === 'zh' ? '管理 AI API 密钥和执行服务器' : 'Manage AI API keys and execution servers'}
        </p>
      </div>
      
      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '8px', marginBottom: '24px',
        background: 'var(--bg-secondary)', padding: '6px',
        borderRadius: '14px', border: '1px solid var(--border)', width: 'fit-content',
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px', borderRadius: '10px', border: 'none',
                background: isActive ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              }}
            >
              <Icon size={16} />
              {language === 'zh' ? tab.label : tab.labelEn}
            </button>
          )
        })}
      </div>
      
      {activeTab === 'api-keys' && <APIKeysTab language={language} />}
      {activeTab === 'servers' && <ServersTab language={language} />}
    </div>
  )
}

// ============================================
// API Keys Tab - Simple key storage
// ============================================
function APIKeysTab({ language }: { language: 'en' | 'zh' }) {
  const [keys, setKeys] = useState<APIKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())
  const [newKey, setNewKey] = useState({ name: '', provider: 'openai', model: 'gpt-4o', apiKey: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchKeys() }, [])

  const fetchKeys = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.apiKeys.list()
      setKeys(res.data || [])
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
        model: newKey.model,
        key: newKey.apiKey,
      })
      setShowCreate(false)
      setNewKey({ name: '', provider: 'openai', model: 'gpt-4o', apiKey: '' })
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

  const toggleReveal = (id: string) => {
    setRevealedKeys(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {language === 'zh' ? 'AI API 密钥' : 'AI API Keys'}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {language === 'zh' ? '存储 AI 厂商提供的 API 密钥' : 'Store API keys from AI providers'}
          </p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 18px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none',
            color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
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
        <div style={{ padding: '16px', background: 'rgba(248,113,113,0.1)', borderRadius: '12px', color: '#F87171' }}>{error}</div>
      ) : keys.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
          {language === 'zh' ? '暂无 API 密钥' : 'No API keys yet'}
        </div>
      ) : (
        keys.map(key => {
          const cfg = providerConfig[key.provider] || providerConfig.other
          const isRevealed = revealedKeys.has(key.id)
          return (
            <div key={key.id} style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '20px', opacity: deletingId === key.id ? 0.5 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '12px',
                      background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Key size={20} style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                        {key.name}
                      </h4>
                      <span style={{ fontSize: '12px', color: cfg.color }}>{cfg.label} · {key.model}</span>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: '10px',
                  }}>
                    <code style={{ flex: 1, fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {isRevealed ? key.apiKey : key.prefix + '...' + '·'.repeat(20)}
                    </code>
                    <button onClick={() => toggleReveal(key.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                      {isRevealed ? <EyeOff size={16} style={{ color: 'var(--text-tertiary)' }} /> : <Eye size={16} style={{ color: 'var(--text-tertiary)' }} />}
                    </button>
                    <button onClick={() => navigator.clipboard.writeText(key.apiKey)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                      <Copy size={16} style={{ color: 'var(--text-tertiary)' }} />
                    </button>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDelete(key.id)}
                  disabled={deletingId === key.id}
                  style={{ 
                    padding: '10px', borderRadius: '10px', background: 'var(--bg-tertiary)', 
                    border: '1px solid var(--border)', cursor: deletingId === key.id ? 'not-allowed' : 'pointer' 
                  }}>
                  {deletingId === key.id ? (
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Trash2 size={16} style={{ color: '#F87171' }} />
                  )}
                </button>
              </div>
            </div>
          )
        })
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowCreate(false)}>
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border)',
            width: '90%', maxWidth: '420px', padding: '24px',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
              {language === 'zh' ? '添加 API 密钥' : 'Add API Key'}
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? '名称' : 'Name'}
              </label>
              <input
                type="text" value={newKey.name}
                onChange={e => setNewKey(prev => ({ ...prev, name: e.target.value }))}
                placeholder={language === 'zh' ? '例如：我的 OpenAI Key' : 'e.g., My OpenAI Key'}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {Object.entries(providerConfig).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setNewKey(prev => ({ 
                      ...prev, 
                      provider: key, 
                      model: cfg.models[0] || '' 
                    }))}
                    style={{
                      padding: '12px 8px', borderRadius: '10px',
                      border: newKey.provider === key ? `2px solid ${cfg.color}` : '1px solid var(--border)',
                      background: newKey.provider === key ? `${cfg.color}10` : 'var(--bg-tertiary)',
                      cursor: 'pointer', textAlign: 'center',
                    }}>
                    <span style={{ fontSize: '11px', fontWeight: '500', color: newKey.provider === key ? cfg.color : 'var(--text-tertiary)' }}>
                      {cfg.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? '模型' : 'Model'}
              </label>
              <select
                value={newKey.model}
                onChange={e => setNewKey(prev => ({ ...prev, model: e.target.value }))}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
                }}
              >
                {(providerConfig[newKey.provider]?.models || []).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? 'API 密钥' : 'API Key'}
              </label>
              <input
                type="password" value={newKey.apiKey}
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

// ============================================
// Servers Tab - Execution infrastructure for spawning agents
// ============================================
function ServersTab({ language }: { language: 'en' | 'zh' }) {
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedServer, setSelectedServer] = useState<string | null>(null)
  const [containers, setContainers] = useState<any[]>([])
  const [loadingContainers, setLoadingContainers] = useState(false)
  const [spawning, setSpawning] = useState(false)
  const [showSpawn, setShowSpawn] = useState(false)
  const [spawnConfig, setSpawnConfig] = useState({ image: 'ubuntu:22.04', command: 'sleep 3600', taskId: '' })
  const [containerLogs, setContainerLogs] = useState<Record<string, string>>({})
  const [showLogsFor, setShowLogsFor] = useState<string | null>(null)
  const [killingId, setKillingId] = useState<string | null>(null)
  const [newServer, setNewServer] = useState({ 
    name: '', type: 'docker', host: 'localhost', port: 22, username: '', password: '' 
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchServers() }, [])

  const fetchServers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.servers.list()
      const converted: Server[] = (res.data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        type: s.type || 'docker',
        host: s.host || s.baseURL || '',
        port: s.port || 22,
        username: s.username || '',
        password: '',
        status: s.health === 'healthy' ? 'online' : s.health === 'degraded' ? 'degraded' : 'offline',
        lastChecked: s.lastChecked,
        createdAt: s.createdAt,
      }))
      setServers(converted)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchContainers = async (serverId: string) => {
    setLoadingContainers(true)
    try {
      const res = await api.servers.getContainers(serverId)
      setContainers(res.data?.containers || [])
    } catch (err: any) {
      console.error('Failed to fetch containers:', err)
    } finally {
      setLoadingContainers(false)
    }
  }

  const handleCreate = async () => {
    if (!newServer.name || !newServer.host) return
    setCreating(true)
    try {
      await api.servers.create({
        name: newServer.name,
        type: newServer.type,
        host: newServer.host,
        port: newServer.port,
        username: newServer.username,
        password: newServer.password,
      })
      setShowCreate(false)
      setNewServer({ name: '', type: 'docker', host: 'localhost', port: 22, username: '', password: '' })
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
      await api.servers.test(id)
      fetchServers()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setTestingId(null)
    }
  }

  const handleSpawn = async (serverId: string) => {
    setSpawning(true)
    try {
      const cmdArray = spawnConfig.command.split(' ').filter(Boolean)
      await api.servers.spawn(serverId, {
        image: spawnConfig.image,
        command: cmdArray,
        taskId: spawnConfig.taskId || undefined,
      })
      setShowSpawn(false)
      setSpawnConfig({ image: 'ubuntu:22.04', command: 'sleep 3600', taskId: '' })
      if (selectedServer) fetchContainers(selectedServer)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSpawning(false)
    }
  }

  const handleViewLogs = async (serverId: string, containerId: string) => {
    try {
      const res = await api.servers.getContainerLogs(serverId, containerId, 50)
      setContainerLogs(prev => ({ ...prev, [containerId]: res.data?.logs || '' }))
      setShowLogsFor(containerId)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleKill = async (serverId: string, containerId: string) => {
    if (!confirm(language === 'zh' ? '确定停止容器？' : 'Stop container?')) return
    setKillingId(containerId)
    try {
      await api.servers.killContainer(serverId, containerId)
      if (selectedServer) fetchContainers(selectedServer)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setKillingId(null)
    }
  }

  const handleSelectServer = (serverId: string) => {
    setSelectedServer(selectedServer === serverId ? null : serverId)
    if (selectedServer !== serverId) {
      fetchContainers(serverId)
    }
  }

  const serverTypeConfig = {
    docker: { label: 'Docker', icon: HardDrive, color: '#3B82F6', desc: language === 'zh' ? 'Docker 容器执行环境' : 'Docker container execution' },
    ssh: { label: 'SSH', icon: Terminal, color: '#10A37F', desc: language === 'zh' ? 'SSH 远程服务器' : 'SSH remote server' },
    openclaw: { label: 'OpenClaw', icon: Server, color: '#8B5CF6', desc: language === 'zh' ? 'OpenClaw 主机节点' : 'OpenClaw host node' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {language === 'zh' ? '执行服务器' : 'Execution Servers'}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {language === 'zh' ? '用于创建 Agent 执行任务的服务器节点' : 'Server nodes for spawning agent execution tasks'}
          </p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 18px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none',
            color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
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
        <div style={{ padding: '16px', background: 'rgba(248,113,113,0.1)', borderRadius: '12px', color: '#F87171' }}>{error}</div>
      ) : servers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
          {language === 'zh' ? '暂无执行服务器' : 'No execution servers yet'}
        </div>
      ) : (
        servers.map(server => {
          const cfg = serverTypeConfig[server.type as keyof typeof serverTypeConfig] || serverTypeConfig.docker
          const Icon = cfg.icon
          const statusColor = server.status === 'online' ? '#34D399' : server.status === 'degraded' ? '#FBBF24' : '#F87171'
          
          return (
            <div key={server.id} style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '20px', opacity: deletingId === server.id ? 0.5 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '12px',
                      background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={20} style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                          {server.name}
                        </h4>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
                        <span style={{ fontSize: '11px', color: statusColor }}>
                          {server.status === 'online' ? (language === 'zh' ? '在线' : 'Online') :
                           server.status === 'degraded' ? (language === 'zh' ? '性能下降' : 'Degraded') :
                           (language === 'zh' ? '离线' : 'Offline')}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: cfg.color }}>{cfg.label}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{server.host}:{server.port}</span>
                    </div>
                    {server.username && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{server.username}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} />
                      <span>{language === 'zh' ? '最后检查' : 'Last checked'}: {server.lastChecked ? new Date(server.lastChecked).toLocaleString() : '-'}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleTest(server.id)}
                    disabled={testingId === server.id}
                    style={{ 
                      padding: '10px', borderRadius: '10px', background: 'var(--bg-tertiary)', 
                      border: '1px solid var(--border)', cursor: testingId === server.id ? 'not-allowed' : 'pointer' 
                    }}>
                    {testingId === server.id ? (
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <RefreshCw size={16} style={{ color: 'var(--text-secondary)' }} />
                    )}
                  </button>
                  <button 
                    onClick={() => handleSelectServer(server.id)}
                    style={{ 
                      padding: '10px 14px', borderRadius: '10px', background: server.id === selectedServer ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'var(--bg-tertiary)', 
                      border: '1px solid var(--border)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      fontSize: '12px', fontWeight: '600', color: server.id === selectedServer ? 'white' : 'var(--text-secondary)'
                    }}>
                    <Terminal size={14} />
                    {server.id === selectedServer ? (language === 'zh' ? '收起' : 'Collapse') : (language === 'zh' ? '容器' : 'Containers')}
                  </button>
                  <button 
                    onClick={() => handleDelete(server.id)}
                    disabled={deletingId === server.id}
                    style={{ 
                      padding: '10px', borderRadius: '10px', background: 'var(--bg-tertiary)', 
                      border: '1px solid var(--border)', cursor: deletingId === server.id ? 'not-allowed' : 'pointer' 
                    }}>
                    {deletingId === server.id ? (
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Trash2 size={16} style={{ color: '#F87171' }} />
                    )}
                  </button>
                </div>
              </div>

              {/* Container Management Section */}
              {server.id === selectedServer && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                      {language === 'zh' ? '容器列表' : 'Containers'}
                    </h4>
                    <button
                      onClick={() => { setShowSpawn(true); fetchContainers(server.id); }}
                      style={{
                        padding: '8px 14px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none',
                        color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}>
                      <Plus size={14} />
                      {language === 'zh' ? '启动容器' : 'Spawn'}
                    </button>
                  </div>

                  {loadingContainers ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : containers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                      {language === 'zh' ? '暂无运行中的容器' : 'No running containers'}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {containers.map((c: any) => (
                        <div key={c.id} style={{
                          background: 'var(--bg-tertiary)', borderRadius: '10px', padding: '12px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: c.state === 'running' ? '#34D399' : '#F87171',
                            }} />
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                {c.names?.[0] || c.id.slice(0, 12)}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                {c.image} • {c.status}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleViewLogs(server.id, c.id)}
                              style={{
                                padding: '6px 10px', borderRadius: '6px',
                                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)',
                              }}>
                              {language === 'zh' ? '日志' : 'Logs'}
                            </button>
                            {c.state === 'running' && (
                              <button
                                onClick={() => handleKill(server.id, c.id)}
                                disabled={killingId === c.id}
                                style={{
                                  padding: '6px 10px', borderRadius: '6px',
                                  background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                                  cursor: killingId === c.id ? 'not-allowed' : 'pointer', fontSize: '11px', color: '#F87171',
                                }}>
                                {killingId === c.id ? '...' : (language === 'zh' ? '停止' : 'Stop')}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}

      {/* Spawn Modal */}
      {showSpawn && selectedServer && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowSpawn(false)}>
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border)',
            width: '90%', maxWidth: '420px', padding: '24px',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
              {language === 'zh' ? '启动容器' : 'Spawn Container'}
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? '镜像' : 'Image'}
              </label>
              <input
                type="text" value={spawnConfig.image}
                onChange={e => setSpawnConfig(prev => ({ ...prev, image: e.target.value }))}
                placeholder="ubuntu:22.04"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? '命令' : 'Command'}
              </label>
              <input
                type="text" value={spawnConfig.command}
                onChange={e => setSpawnConfig(prev => ({ ...prev, command: e.target.value }))}
                placeholder="sleep 3600"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? '任务 ID (可选)' : 'Task ID (optional)'}
              </label>
              <input
                type="text" value={spawnConfig.taskId}
                onChange={e => setSpawnConfig(prev => ({ ...prev, taskId: e.target.value }))}
                placeholder={language === 'zh' ? '例如：task-001' : 'e.g., task-001'}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSpawn(false)}
                style={{
                  padding: '12px 20px', borderRadius: '10px', border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                  fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                }}>
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={() => handleSpawn(selectedServer)}
                disabled={!spawnConfig.image || spawning}
                style={{
                  padding: '12px 20px', borderRadius: '10px', border: 'none',
                  background: spawnConfig.image && !spawning ? 'linear-gradient(135deg, #10B981, #059669)' : 'var(--bg-tertiary)',
                  color: spawnConfig.image && !spawning ? 'white' : 'var(--text-tertiary)',
                  fontSize: '14px', fontWeight: '600', cursor: spawnConfig.image && !spawning ? 'pointer' : 'not-allowed',
                }}>
                {spawning ? (language === 'zh' ? '启动中...' : 'Spawning...') : (language === 'zh' ? '启动' : 'Spawn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogsFor && containerLogs[showLogsFor] !== undefined && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => { setShowLogsFor(null); setContainerLogs(prev => ({ ...prev, [showLogsFor]: '' })); }}>
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border)',
            width: '90%', maxWidth: '600px', maxHeight: '70vh', padding: '24px',
            display: 'flex', flexDirection: 'column',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>
              {language === 'zh' ? '容器日志' : 'Container Logs'}
            </h2>
            <div style={{
              flex: 1, background: '#0D1117', borderRadius: '10px', padding: '16px',
              overflow: 'auto', maxHeight: '400px',
              fontFamily: 'monospace', fontSize: '12px', color: '#E6EDF3',
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              {containerLogs[showLogsFor] || '(no logs)'}
            </div>
            <button
              onClick={() => { setShowLogsFor(null); setContainerLogs(prev => ({ ...prev, [showLogsFor]: '' })); }}
              style={{
                marginTop: '16px', padding: '12px 20px', borderRadius: '10px', border: '1px solid var(--border)',
                background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                fontSize: '14px', fontWeight: '500', cursor: 'pointer', alignSelf: 'flex-end',
              }}>
              {language === 'zh' ? '关闭' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowCreate(false)}>
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border)',
            width: '90%', maxWidth: '420px', padding: '24px',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
              {language === 'zh' ? '添加执行服务器' : 'Add Execution Server'}
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? '名称' : 'Name'}
              </label>
              <input
                type="text" value={newServer.name}
                onChange={e => setNewServer(prev => ({ ...prev, name: e.target.value }))}
                placeholder={language === 'zh' ? '例如：Docker Host 1' : 'e.g., Docker Host 1'}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {Object.entries(serverTypeConfig).map(([key, cfg]) => {
                  const Icon = cfg.icon
                  return (
                    <button
                      key={key}
                      onClick={() => setNewServer(prev => ({ ...prev, type: key }))}
                      style={{
                        padding: '12px 8px', borderRadius: '10px',
                        border: newServer.type === key ? `2px solid ${cfg.color}` : '1px solid var(--border)',
                        background: newServer.type === key ? `${cfg.color}10` : 'var(--bg-tertiary)',
                        cursor: 'pointer', textAlign: 'center',
                      }}>
                      <Icon size={18} style={{ color: newServer.type === key ? cfg.color : 'var(--text-tertiary)', margin: '0 auto 4px' }} />
                      <span style={{ fontSize: '11px', fontWeight: '500', color: newServer.type === key ? cfg.color : 'var(--text-tertiary)', display: 'block' }}>
                        {cfg.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                  {language === 'zh' ? '主机地址' : 'Host'}
                </label>
                <input
                  type="text" value={newServer.host}
                  onChange={e => setNewServer(prev => ({ ...prev, host: e.target.value }))}
                  placeholder="192.168.1.100"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                    border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                  {language === 'zh' ? '端口' : 'Port'}
                </label>
                <input
                  type="number" value={newServer.port}
                  onChange={e => setNewServer(prev => ({ ...prev, port: parseInt(e.target.value) || 22 }))}
                  placeholder="22"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                    border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? '用户名' : 'Username'}
              </label>
              <input
                type="text" value={newServer.username}
                onChange={e => setNewServer(prev => ({ ...prev, username: e.target.value }))}
                placeholder={language === 'zh' ? '例如：root' : 'e.g., root'}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? '密码/密钥' : 'Password / Key'}
              </label>
              <input
                type="password" value={newServer.password}
                onChange={e => setNewServer(prev => ({ ...prev, password: e.target.value }))}
                placeholder={language === 'zh' ? '密码或 SSH 私钥' : 'Password or SSH private key'}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
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
                disabled={!newServer.name || !newServer.host || creating}
                style={{
                  padding: '12px 20px', borderRadius: '10px', border: 'none',
                  background: newServer.name && newServer.host && !creating ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'var(--bg-tertiary)',
                  color: newServer.name && newServer.host && !creating ? 'white' : 'var(--text-tertiary)',
                  fontSize: '14px', fontWeight: '600', cursor: newServer.name && newServer.host && !creating ? 'pointer' : 'not-allowed',
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
