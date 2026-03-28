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

// Mock data
const mockSharedKeys: SharedAPIKey[] = []

const mockServers: ServerConnection[] = []

const mockRateLimitTiers: RateLimitConfig[] = []

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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())

  // Mock admin check - in production this would come from auth
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
          keys={mockSharedKeys} 
          revealedKeys={revealedKeys}
          onToggleReveal={toggleReveal}
          language={language}
        />
      )}
      
      {activeTab === 'servers' && (
        <ServersTab 
          servers={mockServers} 
          language={language}
        />
      )}
      
      {activeTab === 'rate-limits' && (
        <RateLimitsTab 
          tiers={mockRateLimitTiers}
          language={language}
        />
      )}
    </div>
  )
}

// Shared Keys Tab
function SharedKeysTab({ keys, revealedKeys, onToggleReveal, language }: {
  keys: SharedAPIKey[]
  revealedKeys: Set<string>
  onToggleReveal: (id: string) => void
  language: 'en' | 'zh'
}) {
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
        <button style={{
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
      
      {keys.map(key => {
        const cfg = providerConfig[key.provider as keyof typeof providerConfig] || providerConfig.custom
        const isRevealed = revealedKeys.has(key.id)
        
        return (
          <div key={key.id} style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '20px',
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
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <Copy size={16} style={{ color: 'var(--text-tertiary)' }} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Gauge size={14} />
                    <span>{key.rateLimit} calls / {key.rateLimitWindow / 60}min</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{key.usageCount.toLocaleString()} {language === 'zh' ? '次调用' : 'calls'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={14} />
                    <span>{key.assignedTo.includes('all') ? (language === 'zh' ? '所有成员' : 'All members') : key.assignedTo.length + ' ' + (language === 'zh' ? '用户' : 'users')}</span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ padding: '10px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                  <Edit2 size={16} style={{ color: 'var(--text-secondary)' }} />
                </button>
                <button style={{ padding: '10px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                  <Trash2 size={16} style={{ color: '#F87171' }} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Servers Tab
function ServersTab({ servers, language }: {
  servers: ServerConnection[]
  language: 'en' | 'zh'
}) {
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
        <button style={{
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
      
      {servers.map(server => {
        const cfg = providerConfig[server.type as keyof typeof providerConfig] || providerConfig.custom
        const healthColor = server.health === 'healthy' ? '#34D399' : server.health === 'degraded' ? '#FBBF24' : '#F87171'
        
        return (
          <div key={server.id} style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '20px',
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
                
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Gauge size={14} />
                    <span>{server.rateLimit} calls / {server.rateLimitWindow / 60}min</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} />
                    <span>{language === 'zh' ? '最后检查' : 'Last checked'}: {server.lastChecked}</span>
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
                <button style={{ padding: '10px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                  <RefreshCw size={16} style={{ color: 'var(--text-secondary)' }} />
                </button>
                <button style={{ padding: '10px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                  <Edit2 size={16} style={{ color: 'var(--text-secondary)' }} />
                </button>
                <button style={{ padding: '10px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                  <Trash2 size={16} style={{ color: '#F87171' }} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Rate Limits Tab
function RateLimitsTab({ tiers, language }: {
  tiers: RateLimitConfig[]
  language: 'en' | 'zh'
}) {
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
                  { icon: <Zap size={14} />, label: language === 'zh' ? '调用限制' : 'Calls', value: `${tier.maxCalls}/${(tier.windowSeconds / 60)}min` },
                  { icon: <Gauge size={14} />, label: language === 'zh' ? 'Token 上限' : 'Token Limit', value: tier.maxTokens.toLocaleString() },
                  { icon: <FolderKanban size={14} />, label: language === 'zh' ? '项目数' : 'Projects', value: tier.maxProjects },
                  { icon: <Bot size={14} />, label: language === 'zh' ? 'Agent 数' : 'Agents', value: tier.maxAgents },
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
