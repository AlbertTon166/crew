import { useState } from 'react'
import { X, Settings, Cpu, MemoryStick, Timer, Zap, Bell, Mail, MessageCircle, MessageSquare, Webhook, Globe, Key, Check, AlertCircle, Loader2, ChevronRight, Users } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

interface AgentConfigModalProps {
  isOpen: boolean
  onClose: () => void
}

const defaultConfig = {
  // Admin resources (system-level)
  adminCpuLimit: 4,
  adminMemoryLimit: 8192,
  // Member resources (per-agent)
  memberCpuLimit: 1,
  memberMemoryLimit: 2048,
  // Work rules
  maxConcurrentAgents: 3,
  taskTimeout: 300,
  // Notifications
  notificationChannels: ['feishu'],
  errorNotification: true,
  dailySummary: false,
  webhookUrl: '',
  // Proxy
  proxyEnabled: false,
  proxyEndpoint: '',
  proxyAuthToken: '',
  // Model config
  defaultProvider: 'openai',
  defaultModel: 'gpt-4',
  temperature: 0.7,
  maxTokens: 4096,
  fallbackEnabled: true,
}

const STORAGE_KEY = 'agent_global_config'

export default function AgentConfigModal({ isOpen, onClose }: AgentConfigModalProps) {
  const { language } = useLanguage()
  const [activeTab, setActiveTab] = useState(0)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [config, setConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          return { ...defaultConfig, ...JSON.parse(saved) }
        } catch {
          return defaultConfig
        }
      }
    }
    return defaultConfig
  })

  const tabs = [
    { icon: Cpu, label: language === 'zh' ? '资源分配' : 'Resources' },
    { icon: Settings, label: language === 'zh' ? '工作规则' : 'Work Rules' },
    { icon: Bell, label: language === 'zh' ? '通讯规则' : 'Notifications' },
    { icon: Globe, label: language === 'zh' ? '代理API' : 'Proxy API' },
    { icon: Zap, label: language === 'zh' ? '模型配置' : 'Models' },
  ]

  const notificationOptions = [
    { id: 'email', icon: Mail, label: 'Email' },
    { id: 'feishu', icon: MessageCircle, label: 'Feishu' },
    { id: 'wechat', icon: MessageSquare, label: 'WeChat' },
    { id: 'dingtalk', icon: Zap, label: 'DingTalk' },
  ]

  const modelProviders = [
    { id: 'openai', label: 'OpenAI' },
    { id: 'anthropic', label: 'Anthropic' },
    { id: 'google', label: 'Google' },
    { id: 'local', label: 'Local / Custom' },
  ]

  const modelOptions: Record<string, string[]> = {
    openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3.5-sonnet'],
    google: ['gemini-pro', 'gemini-ultra'],
    local: ['llama2', 'mistral', 'custom'],
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    await new Promise(resolve => setTimeout(resolve, 1500))
    if (config.proxyEndpoint && config.proxyEndpoint.startsWith('http')) {
      setTestResult({ success: true, message: language === 'zh' ? '连接成功！' : 'Connection successful!' })
    } else {
      setTestResult({ success: false, message: language === 'zh' ? '无效的代理地址' : 'Invalid proxy address' })
    }
    setIsTesting(false)
  }

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    onClose()
  }

  if (!isOpen) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={20} style={{ color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{language === 'zh' ? '全局配置' : 'Global Configuration'}</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>{language === 'zh' ? '配置全局设置和默认值' : 'Configure global settings and defaults'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '8px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            <X size={18} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}>
          {tabs.map((tab, idx) => {
            const Icon = tab.icon
            return (
              <button key={idx} onClick={() => setActiveTab(idx)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '14px 8px', background: activeTab === idx ? 'var(--bg-secondary)' : 'transparent', border: 'none', borderBottom: activeTab === idx ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
                <Icon size={18} style={{ color: activeTab === idx ? 'var(--primary)' : 'var(--text-tertiary)' }} />
                <span style={{ fontSize: '11px', fontWeight: activeTab === idx ? '600' : '500', color: activeTab === idx ? 'var(--primary)' : 'var(--text-tertiary)' }}>{tab.label}</span>
              </button>
            )
          })}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {activeTab === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Admin Resources Section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Settings size={14} style={{ color: '#fff' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{language === 'zh' ? '管理资源分配' : 'Admin Resources'}</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: 0 }}>{language === 'zh' ? '系统整体资源限制' : 'System-wide resource limits'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '36px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}><Cpu size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />{language === 'zh' ? 'CPU 限制' : 'CPU Limit'}</label>
                      <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '600' }}>{config.adminCpuLimit} {language === 'zh' ? '核' : 'cores'}</span>
                    </div>
                    <input type="range" min="0.5" max="8" step="0.5" value={config.adminCpuLimit} onChange={(e) => setConfig({ ...config, adminCpuLimit: parseFloat(e.target.value) })} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}><span>0.5 {language === 'zh' ? '核' : 'cores'}</span><span>8 {language === 'zh' ? '核' : 'cores'}</span></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}><MemoryStick size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />{language === 'zh' ? '内存限制' : 'Memory Limit'}</label>
                      <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '600' }}>{config.adminMemoryLimit >= 1024 ? `${config.adminMemoryLimit / 1024}GB` : `${config.adminMemoryLimit}MB`}</span>
                    </div>
                    <input type="range" min="512" max="16384" step="256" value={config.adminMemoryLimit} onChange={(e) => setConfig({ ...config, adminMemoryLimit: parseInt(e.target.value) })} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}><span>512MB</span><span>16GB</span></div>
                  </div>
                </div>
              </div>

              {/* Member Resources Section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={14} style={{ color: '#fff' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{language === 'zh' ? '成员资源分配' : 'Member Resources'}</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: 0 }}>{language === 'zh' ? '每个智能体的资源限制' : 'Per-agent resource limits'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '36px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}><Cpu size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />{language === 'zh' ? '单智能体 CPU 限制' : 'Per-Agent CPU Limit'}</label>
                      <span style={{ fontSize: '13px', color: '#10B981', fontWeight: '600' }}>{config.memberCpuLimit} {language === 'zh' ? '核' : 'cores'}</span>
                    </div>
                    <input type="range" min="0.5" max="4" step="0.5" value={config.memberCpuLimit} onChange={(e) => setConfig({ ...config, memberCpuLimit: parseFloat(e.target.value) })} style={{ width: '100%', accentColor: '#10B981' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}><span>0.5 {language === 'zh' ? '核' : 'cores'}</span><span>4 {language === 'zh' ? '核' : 'cores'}</span></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}><MemoryStick size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />{language === 'zh' ? '单智能体内存限制' : 'Per-Agent Memory Limit'}</label>
                      <span style={{ fontSize: '13px', color: '#10B981', fontWeight: '600' }}>{config.memberMemoryLimit >= 1024 ? `${config.memberMemoryLimit / 1024}GB` : `${config.memberMemoryLimit}MB`}</span>
                    </div>
                    <input type="range" min="256" max="4096" step="128" value={config.memberMemoryLimit} onChange={(e) => setConfig({ ...config, memberMemoryLimit: parseInt(e.target.value) })} style={{ width: '100%', accentColor: '#10B981' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}><span>256MB</span><span>4GB</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}><Users size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />{language === 'zh' ? '最大并发智能体数量' : 'Max Concurrent Agents'}</label>
                  <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '600' }}>{config.maxConcurrentAgents}</span>
                </div>
                <input type="range" min="1" max="10" step="1" value={config.maxConcurrentAgents} onChange={(e) => setConfig({ ...config, maxConcurrentAgents: parseInt(e.target.value) })} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}><span>1</span><span>10</span></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}><Timer size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />{language === 'zh' ? '任务超时' : 'Task Timeout'}</label>
                  <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '600' }}>{config.taskTimeout >= 60 ? `${config.taskTimeout / 60}${language === 'zh' ? '分钟' : 'min'}` : `${config.taskTimeout}${language === 'zh' ? '秒' : 's'}`}</span>
                </div>
                <input type="range" min="30" max="600" step="30" value={config.taskTimeout} onChange={(e) => setConfig({ ...config, taskTimeout: parseInt(e.target.value) })} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}><span>30s</span><span>10min</span></div>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px', display: 'block' }}><Bell size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />{language === 'zh' ? '通知渠道' : 'Notification Channels'}</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {notificationOptions.map((opt) => {
                    const Icon = opt.icon
                    const isSelected = config.notificationChannels.includes(opt.id)
                    return (
                      <button key={opt.id} onClick={() => { const channels = isSelected ? config.notificationChannels.filter((c: string) => c !== opt.id) : [...config.notificationChannels, opt.id]; setConfig({ ...config, notificationChannels: channels }) }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: isSelected ? 'var(--primary-glow)' : 'var(--bg-tertiary)', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: isSelected ? 'var(--primary)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isSelected && <Check size={12} style={{ color: '#fff' }} />}</div>
                        <Icon size={16} style={{ color: isSelected ? 'var(--primary)' : 'var(--text-tertiary)' }} />
                        <span style={{ fontSize: '13px', fontWeight: '500', color: isSelected ? 'var(--primary)' : 'var(--text-secondary)' }}>{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}><AlertCircle size={14} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#F87171' }} />{language === 'zh' ? '错误通知' : 'Error Notifications'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{language === 'zh' ? '智能体遇到错误时发送通知' : 'Notify when agent encounters an error'}</div>
                </div>
                <button onClick={() => setConfig({ ...config, errorNotification: !config.errorNotification })} style={{ width: '44px', height: '24px', borderRadius: '12px', background: config.errorNotification ? 'var(--primary)' : 'var(--bg-secondary)', border: `1px solid ${config.errorNotification ? 'var(--primary)' : 'var(--border)'}`, position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: config.errorNotification ? '22px' : '2px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}><Bell size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />{language === 'zh' ? '每日汇总' : 'Daily Summary'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{language === 'zh' ? '发送所有智能体的每日报告' : 'Send daily report of all agents'}</div>
                </div>
                <button onClick={() => setConfig({ ...config, dailySummary: !config.dailySummary })} style={{ width: '44px', height: '24px', borderRadius: '12px', background: config.dailySummary ? 'var(--primary)' : 'var(--bg-secondary)', border: `1px solid ${config.dailySummary ? 'var(--primary)' : 'var(--border)'}`, position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: config.dailySummary ? '22px' : '2px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}><Webhook size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />{language === 'zh' ? 'Webhook 地址' : 'Webhook URL'}</label>
                <input type="text" value={config.webhookUrl} onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })} placeholder={language === 'zh' ? 'https://your-webhook.com/endpoint' : 'https://your-webhook.com/endpoint'} style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none' }} onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')} onBlur={(e) => (e.target.style.borderColor = 'var(--border)')} />
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}><Globe size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />{language === 'zh' ? '启用代理' : 'Enable Proxy'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{language === 'zh' ? '通过代理服务器路由 API 请求' : 'Route API requests through proxy server'}</div>
                </div>
                <button onClick={() => setConfig({ ...config, proxyEnabled: !config.proxyEnabled })} style={{ width: '44px', height: '24px', borderRadius: '12px', background: config.proxyEnabled ? 'var(--primary)' : 'var(--bg-secondary)', border: `1px solid ${config.proxyEnabled ? 'var(--primary)' : 'var(--border)'}`, position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: config.proxyEnabled ? '22px' : '2px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>{language === 'zh' ? '代理端点' : 'Proxy Endpoint'}</label>
                <input type="text" value={config.proxyEndpoint} onChange={(e) => setConfig({ ...config, proxyEndpoint: e.target.value })} placeholder={language === 'zh' ? 'https://proxy.example.com:8080' : 'https://proxy.example.com:8080'} disabled={!config.proxyEnabled} style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '13px', color: config.proxyEnabled ? 'var(--text-primary)' : 'var(--text-tertiary)', outline: 'none', opacity: config.proxyEnabled ? 1 : 0.6 }} onFocus={(e) => config.proxyEnabled && (e.target.style.borderColor = 'var(--primary)')} onBlur={(e) => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}><Key size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />{language === 'zh' ? '代理认证令牌' : 'Proxy Auth Token'}</label>
                <input type="password" value={config.proxyAuthToken} onChange={(e) => setConfig({ ...config, proxyAuthToken: e.target.value })} placeholder={language === 'zh' ? '输入认证令牌或 API Key' : 'Enter auth token or API key'} disabled={!config.proxyEnabled} style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '13px', color: config.proxyEnabled ? 'var(--text-primary)' : 'var(--text-tertiary)', outline: 'none', opacity: config.proxyEnabled ? 1 : 0.6, fontFamily: 'monospace' }} onFocus={(e) => config.proxyEnabled && (e.target.style.borderColor = 'var(--primary)')} onBlur={(e) => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              <button onClick={handleTestConnection} disabled={!config.proxyEnabled || !config.proxyEndpoint || isTesting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: config.proxyEnabled && config.proxyEndpoint ? 'linear-gradient(135deg, var(--primary), var(--accent-violet))' : 'var(--bg-tertiary)', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', color: config.proxyEnabled && config.proxyEndpoint ? '#fff' : 'var(--text-tertiary)', cursor: config.proxyEnabled && config.proxyEndpoint ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                {isTesting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />{language === 'zh' ? '测试中...' : 'Testing...'}</> : <><Globe size={16} />{language === 'zh' ? '测试连接' : 'Test Connection'}</>}
              </button>
              {testResult && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: testResult.success ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)', border: `1px solid ${testResult.success ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`, borderRadius: '10px' }}>
                  {testResult.success ? <Check size={16} style={{ color: '#34D399' }} /> : <AlertCircle size={16} style={{ color: '#F87171' }} />}
                  <span style={{ fontSize: '13px', color: testResult.success ? '#34D399' : '#F87171' }}>{testResult.message}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>{language === 'zh' ? '默认模型提供商' : 'Default Model Provider'}</label>
                <select value={config.defaultProvider} onChange={(e) => setConfig({ ...config, defaultProvider: e.target.value, defaultModel: modelOptions[e.target.value][0] })} style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  {modelProviders.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>{language === 'zh' ? '默认模型' : 'Default Model'}</label>
                <select value={config.defaultModel} onChange={(e) => setConfig({ ...config, defaultModel: e.target.value })} style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  {modelOptions[config.defaultProvider]?.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Temperature</label>
                  <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '600' }}>{config.temperature.toFixed(1)}</span>
                </div>
                <input type="range" min="0" max="2" step="0.1" value={config.temperature} onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}><span>{language === 'zh' ? '精确 (0.0)' : 'Precise (0.0)'}</span><span>{language === 'zh' ? '创意 (2.0)' : 'Creative (2.0)'}</span></div>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>{language === 'zh' ? '最大 Token 数' : 'Max Tokens'}</label>
                <input type="number" value={config.maxTokens} onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) || 0 })} min="256" max="128000" step="256" style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none' }} onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')} onBlur={(e) => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}><ChevronRight size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />{language === 'zh' ? '启用备选模型' : 'Enable Fallback Model'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{language === 'zh' ? '主模型失败时自动切换到备选' : 'Switch to fallback when primary fails'}</div>
                </div>
                <button onClick={() => setConfig({ ...config, fallbackEnabled: !config.fallbackEnabled })} style={{ width: '44px', height: '24px', borderRadius: '12px', background: config.fallbackEnabled ? 'var(--primary)' : 'var(--bg-secondary)', border: `1px solid ${config.fallbackEnabled ? 'var(--primary)' : 'var(--border)'}`, position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: config.fallbackEnabled ? '22px' : '2px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '20px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}>
          <button onClick={onClose} style={{ padding: '12px 24px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}>{language === 'zh' ? '取消' : 'Cancel'}</button>
          <button onClick={handleSave} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', color: '#fff', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} />{language === 'zh' ? '保存' : 'Save'}</button>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
