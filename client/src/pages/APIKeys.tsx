import { useState, useEffect } from 'react'
import { 
  Key, Plus, Copy, Trash2, Eye, EyeOff, 
  CheckCircle, AlertCircle, RefreshCw, Settings,
  Bot, Zap, Cpu, Database, Loader2
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { api } from '../lib/api'

// API Key model
interface APIKey {
  id: string
  name: string
  key: string
  prefix: string
  provider: 'openai' | 'anthropic' | 'deepseek' | 'aliyun-qwen' | 'baidu-wenxin' | 'iflytek-xunfei' | 'tencent-hunyuan' | 'zhipu' | 'minimax' | 'other'
  model: string
  status: 'active' | 'expired' | 'disabled'
  createdAt: string
  lastUsed: string | null
  usageCount?: number
}

// Provider config
const providerConfig = {
  openai: { 
    label: 'OpenAI', 
    icon: Zap, 
    color: '#10A37F',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    placeholder: 'sk-proj-...',
  },
  anthropic: { 
    label: 'Anthropic', 
    icon: Bot, 
    color: '#CC785C',
    models: ['claude-sonnet-4', 'claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-opus'],
    placeholder: 'sk-ant-api01-...',
  },
  deepseek: { 
    label: 'DeepSeek', 
    icon: Cpu, 
    color: '#0066CC',
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
    placeholder: 'sk-...',
  },
  'aliyun-qwen': { 
    label: '通义千问', 
    icon: Zap, 
    color: '#FF6A00',
    models: ['qwen-plus', 'qwen-max', 'qwen-turbo', 'qwen-long'],
    placeholder: 'sk-...',
  },
  'baidu-wenxin': { 
    label: '文心一言', 
    icon: Zap, 
    color: '#2932E1',
    models: ['ernie-4.0-8k', 'ernie-3.5-8k', 'ernie-speed-128k', 'ernie-lite-8k'],
    placeholder: 'API Key',
  },
  'iflytek-xunfei': { 
    label: '讯飞星火', 
    icon: Zap, 
    color: '#00A6F0',
    models: ['spark-4.0', 'spark-3.5-pro', 'spark-3.5-standard'],
    placeholder: 'API Key',
  },
  'tencent-hunyuan': { 
    label: '腾讯混元', 
    icon: Zap, 
    color: '#12B7F5',
    models: ['hunyuan-pro', 'hunyuan-standard', 'hunyuan-lite'],
    placeholder: 'API Key',
  },
  zhipu: { 
    label: '智谱AI', 
    icon: Zap, 
    color: '#7C3AED',
    models: ['glm-4-plus', 'glm-4', 'glm-4-flash', 'glm-3-turbo'],
    placeholder: 'API Key',
  },
  minimax: { 
    label: 'MiniMax', 
    icon: Zap, 
    color: '#00D4AA',
    models: ['MiniMax-Text-01', 'abab6.5s-chat', 'abab6.5-chat'],
    placeholder: 'API Key',
  },
  other: { 
    label: 'Other', 
    icon: Settings, 
    color: '#8B5CF6',
    models: [],
    placeholder: 'API Key',
  },
}

function StatusBadge({ status, language }: { status: string; language: 'en' | 'zh' }) {
  const config = {
    active: { label: '活跃', labelEn: 'Active', color: '#34D399', bg: 'rgba(52, 211, 153, 0.1)' },
    expired: { label: '已过期', labelEn: 'Expired', color: '#F87171', bg: 'rgba(248, 113, 113, 0.1)' },
    disabled: { label: '已禁用', labelEn: 'Disabled', color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)' },
  }[status] || { label: status, labelEn: status, color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)' }
  
  return (
    <span style={{
      fontSize: '11px',
      fontWeight: '500',
      padding: '3px 8px',
      borderRadius: '6px',
      background: config.bg,
      color: config.color,
    }}>
      {language === 'zh' ? config.label : config.labelEn}
    </span>
  )
}

// Provider badge
function ProviderBadge({ model }: { model: string }) {
  const cfg = providerConfig[model as keyof typeof providerConfig] || providerConfig.other
  const Icon = cfg.icon
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px',
      color: cfg.color,
    }}>
      <Icon size={14} />
      {cfg.label}
    </div>
  )
}

export default function APIKeys() {
  const { language } = useLanguage()
  const [keys, setKeys] = useState<APIKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [newKeyForm, setNewKeyForm] = useState({
    name: '',
    provider: 'openai' as 'openai' | 'anthropic' | 'deepseek' | 'aliyun-qwen' | 'baidu-wenxin' | 'iflytek-xunfei' | 'tencent-hunyuan' | 'zhipu' | 'minimax' | 'other',
    apiKey: '',
    model: '',
  })

  // Fetch keys on mount
  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.apiKeys.list()
      setKeys(res.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  // Copy to clipboard
  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
  }
  
  // Toggle reveal
  const toggleReveal = (id: string) => {
    setRevealedKeys(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }
  
  // Delete key
  const deleteKey = async (id: string) => {
    if (!confirm(language === 'zh' ? '确定删除此 API 密钥？' : 'Delete this API key?')) return
    setDeletingId(id)
    try {
      await api.apiKeys.delete(id)
      setKeys(prev => prev.filter(k => k.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete API key')
    } finally {
      setDeletingId(null)
    }
  }
  
  // Create new key
  const handleCreateKey = async () => {
    if (!newKeyForm.name || !newKeyForm.apiKey) return
    setCreating(true)
    try {
      const res = await api.apiKeys.create({
        name: newKeyForm.name,
        provider: newKeyForm.provider,
        model: newKeyForm.model || providerConfig[newKeyForm.provider].models[0] || 'default',
        key: newKeyForm.apiKey,
      })
      // The API returns the full key only on creation
      const newKey: APIKey = {
        ...res.data,
        key: res.data.key, // Full key returned on creation
      }
      setKeys(prev => [...prev, newKey])
      setShowCreateModal(false)
      setNewKeyForm({ name: '', provider: 'openai', apiKey: '', model: '' })
    } catch (err: any) {
      alert(err.message || 'Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div 
      className="page-container animate-fade-in"
      style={{ 
        background: 'var(--bg-primary)',
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        height: '100%',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {language === 'zh' ? 'API 密钥' : 'API Keys'}
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              {language === 'zh' ? '管理 AI 模型 API 密钥，确保安全访问' : 'Manage AI model API keys for secure access'}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={fetchKeys}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                border: 'none',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Plus size={16} />
              {language === 'zh' ? '添加密钥' : 'Add Key'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Error state */}
      {error && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(248, 113, 113, 0.1)',
          border: '1px solid rgba(248, 113, 113, 0.3)',
          borderRadius: '12px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <AlertCircle size={18} style={{ color: '#F87171' }} />
          <span style={{ fontSize: '14px', color: '#F87171' }}>{error}</span>
        </div>
      )}
      
      {/* Loading state */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '64px 20px',
          background: 'var(--bg-secondary)',
          borderRadius: '20px',
          border: '1px solid var(--border)',
        }}>
          <Loader2 size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {language === 'zh' ? '加载中...' : 'Loading...'}
          </p>
        </div>
      ) : (
        /* Keys list */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {keys.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '64px 20px',
              background: 'var(--bg-secondary)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
            }}>
              <Key size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {language === 'zh' ? '暂无 API 密钥' : 'No API keys yet'}
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                {language === 'zh' ? '添加你的第一个 AI API 密钥开始使用' : 'Add your first AI API key to get started'}
              </p>
            </div>
          ) : (
            keys.map(key => {
              const isRevealed = revealedKeys.has(key.id)
              const isDeleting = deletingId === key.id
              const cfg = providerConfig[key.provider as keyof typeof providerConfig] || providerConfig.other
              
              return (
                <div
                  key={key.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '20px',
                    transition: 'all 0.2s ease',
                    opacity: isDeleting ? 0.5 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    {/* Key info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: '12px',
                          background: `${cfg.color}15`,
                          border: `1px solid ${cfg.color}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <cfg.icon size={20} style={{ color: cfg.color }} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                              {key.name}
                            </h3>
                            <StatusBadge status={key.status} language={language} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                            <ProviderBadge model={key.provider} />
                          </div>
                        </div>
                      </div>
                      
                      {/* Key value */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '10px',
                        marginBottom: '12px',
                      }}>
                        <code style={{
                          flex: 1,
                          fontSize: '13px',
                          fontFamily: 'monospace',
                          color: 'var(--text-secondary)',
                        }}>
                          {isRevealed ? key.key : key.prefix + '...' + '·'.repeat(20)}
                        </code>
                        <button
                          onClick={() => toggleReveal(key.id)}
                          style={{
                            padding: '6px',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {isRevealed ? (
                            <EyeOff size={16} style={{ color: 'var(--text-tertiary)' }} />
                          ) : (
                            <Eye size={16} style={{ color: 'var(--text-tertiary)' }} />
                          )}
                        </button>
                        <button
                          onClick={() => copyKey(key.key)}
                          style={{
                            padding: '6px',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Copy size={16} style={{ color: 'var(--text-tertiary)' }} />
                        </button>
                      </div>
                      
                      {/* Stats */}
                      <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        <div>
                          <span style={{ opacity: 0.7 }}>{language === 'zh' ? '创建于' : 'Created'}: </span>
                          <span>{key.createdAt ? new Date(key.createdAt).toLocaleDateString() : '-'}</span>
                        </div>
                        <div>
                          <span style={{ opacity: 0.7 }}>{language === 'zh' ? '最后使用' : 'Last used'}: </span>
                          <span>{key.lastUsed || '-'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => deleteKey(key.id)}
                        disabled={isDeleting}
                        style={{
                          padding: '10px',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          cursor: isDeleting ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title={language === 'zh' ? '删除' : 'Delete'}
                      >
                        {isDeleting ? (
                          <Loader2 size={16} style={{ color: 'var(--text-tertiary)', animation: 'spin 1s linear infinite' }} />
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
        </div>
      )}
      
      {/* Create modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              width: '90%',
              maxWidth: '480px',
              padding: '24px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
              {language === 'zh' ? '添加 API 密钥' : 'Add API Key'}
            </h2>
            
            {/* Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? '名称' : 'Name'}
              </label>
              <input
                type="text"
                value={newKeyForm.name}
                onChange={e => setNewKeyForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={language === 'zh' ? '例如：Production OpenAI' : 'e.g., Production OpenAI'}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            
            {/* Provider */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? '提供商' : 'Provider'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {(Object.entries(providerConfig) as [keyof typeof providerConfig, typeof providerConfig[keyof typeof providerConfig]][]).map(([key, cfg]) => {
                  const Icon = cfg.icon
                  const isSelected = newKeyForm.provider === key
                  return (
                    <button
                      key={key}
                      onClick={() => setNewKeyForm(prev => ({ ...prev, provider: key, model: cfg.models[0] || '' }))}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '10px',
                        border: isSelected ? `2px solid ${cfg.color}` : '1px solid var(--border)',
                        background: isSelected ? `${cfg.color}10` : 'var(--bg-tertiary)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Icon size={18} style={{ color: isSelected ? cfg.color : 'var(--text-tertiary)' }} />
                      <span style={{ fontSize: '10px', fontWeight: '500', color: isSelected ? cfg.color : 'var(--text-tertiary)' }}>
                        {cfg.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* API Key */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? 'API 密钥' : 'API Key'}
              </label>
              <input
                type="password"
                value={newKeyForm.apiKey}
                onChange={e => setNewKeyForm(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder={providerConfig[newKeyForm.provider]?.placeholder || 'API Key'}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
            </div>
            
            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleCreateKey}
                disabled={!newKeyForm.name || !newKeyForm.apiKey || creating}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: newKeyForm.name && newKeyForm.apiKey && !creating
                    ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                    : 'var(--bg-tertiary)',
                  color: newKeyForm.name && newKeyForm.apiKey && !creating ? 'white' : 'var(--text-tertiary)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: newKeyForm.name && newKeyForm.apiKey && !creating ? 'pointer' : 'not-allowed',
                }}
              >
                {creating ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    {language === 'zh' ? '添加中...' : 'Adding...'}
                  </span>
                ) : (
                  language === 'zh' ? '添加' : 'Add'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
