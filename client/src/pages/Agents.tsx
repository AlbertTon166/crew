import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Bot, Settings, Power, CheckCircle, XCircle, 
  AlertCircle, Search,
  Zap, Brain, Code, TestTube, ClipboardList,
  FolderKanban, Clock, Coins, Calendar, Play,
  Bell, X, Loader2, WifiOff, RefreshCw, Trash2
} from 'lucide-react'
import { useDashboardStore } from '../stores/dashboardStore'
import { useLanguage } from '../context/LanguageContext'
import { useDeployMode } from '../context/DeployModeContext'
import AgentConfigModal from '../components/AgentConfigModal'
import { api } from '../lib/api'

const agentIcons: Record<string, any> = {
  'Planner Agent': ClipboardList,
  'Frontend Developer': Code,
  'Frontend Dev': Code,
  'Backend Developer': Code,
  'Backend Dev': Code,
  'Reviewer Agent': CheckCircle,
  'Reviewer': CheckCircle,
  'Tester Agent': TestTube,
  'Tester': TestTube,
}

const agentColors: Record<string, string> = {
  'Planner Agent': '#8B5CF6',
  'Frontend Developer': '#3B82F6',
  'Frontend Dev': '#3B82F6',
  'Backend Developer': '#10B981',
  'Backend Dev': '#10B981',
  'Reviewer Agent': '#F59E0B',
  'Reviewer': '#F59E0B',
  'Tester Agent': '#EF4444',
  'Tester': '#EF4444',
}

const agentNamesZh: Record<string, string> = {
  'Planner Agent': '规划智能体',
  'Frontend Developer': '前端开发',
  'Frontend Dev': '前端开发',
  'Backend Developer': '后端开发',
  'Backend Dev': '后端开发',
  'Reviewer Agent': '审核智能体',
  'Reviewer': '审核智能体',
  'Tester Agent': '测试智能体',
  'Tester': '测试智能体',
}

const agentDescZh: Record<string, string> = {
  'Planner Agent': '分析需求并创建任务分解',
  'Frontend Developer': '实现 React/Vue 组件和 UI',
  'Frontend Dev': '实现 React/Vue 组件和 UI',
  'Backend Developer': '构建 API 和数据库集成',
  'Backend Dev': '构建 API 和数据库集成',
  'Reviewer Agent': '执行代码审查和质量检查',
  'Reviewer': '执行代码审查和质量检查',
  'Tester Agent': '运行自动化测试并报告 Bug',
  'Tester': '运行自动化测试并报告 Bug',
}

const models = ['gpt-4', 'gpt-4-turbo', 'claude-3', 'claude-3.5', 'gemini-pro']

// Agent interface from API
interface Agent {
  id: string
  name: string
  role: string
  status: string
  modelProvider?: string
  modelName: string
  systemPrompt?: string
  skills?: string[]
  enabled: boolean
  createdAt?: string
  projectCount?: number
  avgCompleteTime?: string
  totalTokens?: number
  runningDays?: number
}

export default function Agents() {
  const { language } = useLanguage()
  const { agents: storeAgents, setAgents, updateAgent, deleteAgent } = useDashboardStore()
  const { isConnected } = useDeployMode()
  const [search, setSearch] = useState('')
  const [showConfig, setShowConfig] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<Record<string, string>>({})
  const [pendingModel, setPendingModel] = useState<Record<string, string>>({})
  const [showAlertDropdown, setShowAlertDropdown] = useState(false)
  const [showGlobalConfig, setShowGlobalConfig] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const navigate = useNavigate()

  // Fetch agents from API
  const fetchAgents = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.agents.list()
      // Transform API response to match expected format (with safety check)
      const dataArray = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : [])
      const agents: Agent[] = dataArray.map((a: any) => ({
        id: a.id,
        name: a.name,
        role: a.role,
        status: a.status || 'offline',
        modelProvider: a.model_provider,
        modelName: a.model_name,
        systemPrompt: a.system_prompt,
        skills: a.skills || [],
        enabled: a.enabled !== false,
        createdAt: a.created_at,
      }))
      setAgents(agents as any)
    } catch (err: any) {
      setError(err.message || 'Failed to load agents')
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (isConnected && storeAgents.length === 0) {
      fetchAgents()
    }
  }, [isConnected])

  // Use store agents
  const agents = storeAgents as Agent[]

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(search.toLowerCase()) ||
    agent.modelName?.toLowerCase().includes(search.toLowerCase())
  )

  // Mock error logs for agents (in real app, this would come from API)
  const agentErrorLogs = [
    { agentId: '4', agentName: 'Reviewer Agent', error: 'API rate limit exceeded', time: '2 min ago' },
    { agentId: '2', agentName: 'Frontend Developer', error: 'Failed to fetch component schema', time: '15 min ago' },
  ]

  // Get agents with error status
  const errorAgents = agents.filter(a => a.status === 'error')

  const getStatusConfig = (status: string) => {
    if (language === 'zh') {
      switch (status) {
        case 'online': return { icon: CheckCircle, color: '#34D399', label: '在线', glow: 'rgba(52, 211, 153, 0.4)' }
        case 'busy': return { icon: Zap, color: '#FBBF24', label: '忙碌', glow: 'rgba(251, 191, 36, 0.4)' }
        case 'error': return { icon: AlertCircle, color: '#F87171', label: '错误', glow: 'rgba(248, 113, 113, 0.4)' }
        default: return { icon: XCircle, color: '#64748B', label: '离线', glow: 'transparent' }
      }
    }
    switch (status) {
      case 'online': return { icon: CheckCircle, color: '#34D399', label: 'Online', glow: 'rgba(52, 211, 153, 0.4)' }
      case 'busy': return { icon: Zap, color: '#FBBF24', label: 'Busy', glow: 'rgba(251, 191, 36, 0.4)' }
      case 'error': return { icon: AlertCircle, color: '#F87171', label: 'Error', glow: 'rgba(248, 113, 113, 0.4)' }
      default: return { icon: XCircle, color: '#64748B', label: 'Offline', glow: 'transparent' }
    }
  }

  const getAgentName = (name: string) => language === 'zh' ? (agentNamesZh[name] || name) : name
  const getAgentDesc = (name: string) => language === 'zh' ? (agentDescZh[name] || name) : name

  const onlineCount = agents.filter(a => a.status === 'online').length
  const busyCount = agents.filter(a => a.status === 'busy').length
  const errorCount = agents.filter(a => a.status === 'error').length
  const offlineCount = agents.filter(a => a.status === 'offline').length

  const handleConfigClick = (agentId: string, currentModel: string) => {
    setSelectedModel(prev => ({ ...prev, [agentId]: currentModel }))
    setPendingModel(prev => ({ ...prev, [agentId]: currentModel }))
    setShowConfig(showConfig === agentId ? null : agentId)
  }

  const handleModelChange = (agentId: string, model: string) => {
    setPendingModel(prev => ({ ...prev, [agentId]: model }))
  }

  const handleApplyModel = (agentId: string) => {
    const newModel = pendingModel[agentId]
    if (newModel && newModel !== selectedModel[agentId]) {
      setSelectedModel(prev => ({ ...prev, [agentId]: newModel }))
    }
  }

  const handleKnowledgeConfig = (agentName: string) => {
    navigate(`/knowledge?agent=${encodeURIComponent(agentName)}`)
  }

  // Update agent status via API
  const handleToggleAgent = async (agentId: string, enabled: boolean) => {
    try {
      await api.agents.update(agentId, { enabled: !enabled })
      updateAgent(agentId, { enabled: !enabled } as any)
    } catch (err: any) {
      alert(err.message || 'Failed to update agent')
    }
  }

  // Delete agent via API
  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm(language === 'zh' ? '确定删除此智能体？' : 'Delete this agent?')) return
    setDeletingId(agentId)
    try {
      await api.agents.delete(agentId)
      deleteAgent(agentId)
    } catch (err: any) {
      alert(err.message || 'Failed to delete agent')
    } finally {
      setDeletingId(null)
    }
  }

  const formatToken = (token: number) => {
    if (token >= 1000000) return (token / 1000000).toFixed(1) + 'M'
    if (token >= 1000) return (token / 1000).toFixed(0) + 'K'
    return token.toString()
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div 
        className="page-container animate-fade-in"
        style={{ 
          background: 'var(--bg-primary)',
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '80px 20px',
          textAlign: 'center'
        }}>
          <Loader2 size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 24px', animation: 'spin 2s linear infinite' }} />
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {language === 'zh' ? '等待 Teams 服务器连接...' : 'Waiting for Teams Server Connection...'}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px' }}>
            {language === 'zh' ? '正在尝试连接 Teams 服务器，请稍候' : 'Attempting to connect to Teams server, please wait'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="page-container animate-fade-in"
      style={{ 
        background: 'var(--bg-primary)',
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {language === 'zh' ? '智能体' : 'Agents'}
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            {language === 'zh' ? '管理您的AI智能体团队' : 'Manage your AI agent team'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          {/* Refresh button */}
          <button
            onClick={fetchAgents}
            disabled={loading}
            style={{
              padding: '10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
            }}
            title={language === 'zh' ? '刷新' : 'Refresh'}
          >
            <RefreshCw size={18} style={{ color: 'var(--text-secondary)', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>

          {/* Bell Icon with Alert Dropdown */}
          <button
            onClick={() => setShowAlertDropdown(!showAlertDropdown)}
            style={{
              position: 'relative',
              padding: '10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Bell size={18} style={{ color: 'var(--text-secondary)' }} />
            {errorAgents.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#F87171',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(248, 113, 113, 0.6)'
              }}>
                {errorAgents.length}
              </div>
            )}
          </button>

          {/* Alert Dropdown */}
          {showAlertDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              width: '320px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              zIndex: 1000,
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)'
              }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {language === 'zh' ? '最近报错' : 'Recent Errors'}
                </span>
                <button
                  onClick={() => setShowAlertDropdown(false)}
                  style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={14} style={{ color: 'var(--text-tertiary)' }} />
                </button>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {agentErrorLogs.length > 0 ? agentErrorLogs.map((log, idx) => (
                  <div key={idx} style={{
                    padding: '12px 16px',
                    borderBottom: idx < agentErrorLogs.length - 1 ? '1px solid var(--border)' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F87171' }} />
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {log.agentName}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 4px 14px' }}>
                      {log.error}
                    </p>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginLeft: '14px' }}>
                      {log.time}
                    </span>
                  </div>
                )) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <CheckCircle size={24} style={{ marginBottom: '8px', color: '#34D399' }} />
                    <p style={{ fontSize: '13px', margin: 0 }}>
                      {language === 'zh' ? '暂无报错' : 'No errors'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Global Config Button */}
          <button
            onClick={() => setShowGlobalConfig(true)}
            style={{
              padding: '10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title={language === 'zh' ? '全局配置' : 'Global Configuration'}
          >
            <Settings size={18} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              {language === 'zh' ? '配置' : 'Config'}
            </span>
          </button>
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
      {loading && agents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 48px', marginBottom: '24px' }}>
          <Loader2 size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
            {language === 'zh' ? '加载智能体列表...' : 'Loading agents...'}
          </p>
        </div>
      ) : agents.length === 0 ? (
        /* Empty state */
        <div className="card" style={{ textAlign: 'center', padding: '64px 48px', marginBottom: '24px' }}>
          <Bot size={56} style={{ color: 'var(--text-tertiary)', margin: '0 auto 20px' }} />
          <p style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {language === 'zh' ? '暂无智能体' : 'No agents yet'}
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', maxWidth: '360px', margin: '0 auto' }}>
            {language === 'zh' ? '连接服务器后自动同步智能体列表' : 'Agents will sync when server is connected'}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="stat-card animate-slide-up stagger-1">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="icon"><CheckCircle size={20} style={{ color: '#34D399' }} /></div>
                <div>
                  <div className="value" style={{ fontSize: '28px' }}>{onlineCount}</div>
                  <div className="label">{language === 'zh' ? '在线' : 'Online'}</div>
                </div>
              </div>
            </div>
            <div className="stat-card animate-slide-up stagger-2">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="icon"><Zap size={20} style={{ color: '#FBBF24' }} /></div>
                <div>
                  <div className="value" style={{ fontSize: '28px' }}>{busyCount}</div>
                  <div className="label">{language === 'zh' ? '忙碌' : 'Busy'}</div>
                </div>
              </div>
            </div>
            <div className="stat-card animate-slide-up stagger-3">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="icon"><AlertCircle size={20} style={{ color: '#F87171' }} /></div>
                <div>
                  <div className="value" style={{ fontSize: '28px' }}>{errorCount}</div>
                  <div className="label">{language === 'zh' ? '错误' : 'Error'}</div>
                </div>
              </div>
            </div>
            <div className="stat-card animate-slide-up stagger-4">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="icon"><XCircle size={20} style={{ color: '#64748B' }} /></div>
                <div>
                  <div className="value" style={{ fontSize: '28px' }}>{offlineCount}</div>
                  <div className="label">{language === 'zh' ? '离线' : 'Offline'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="card animate-slide-up stagger-5" style={{ padding: '14px', marginBottom: '20px' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} size={18} />
              <input
                type="text"
                placeholder={language === 'zh' ? '搜索智能体...' : 'Search agents...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '12px 16px 12px 46px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '14px', color: 'var(--text-primary)' }}
                className="agent-search-input"
              />
            </div>
          </div>

          {/* Agent Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {filteredAgents.map((agent, index) => {
              const statusConfig = getStatusConfig(agent.status)
              const StatusIcon = statusConfig.icon
              const AgentIcon = agentIcons[agent.name] || Bot
              const agentColor = agentColors[agent.name] || '#6366F1'
              const hasPendingChange = pendingModel[agent.id] && pendingModel[agent.id] !== selectedModel[agent.id]
              const isDeleting = deletingId === agent.id
              
              return (
                <div key={agent.id} className="card animate-slide-up" style={{ padding: '24px', animationDelay: `${0.1 + index * 0.05}s`, opacity: isDeleting ? 0.5 : 1 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${agentColor}15`, border: `1px solid ${agentColor}30`, position: 'relative' }}>
                        <AgentIcon size={24} style={{ color: agentColor }} />
                        <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '14px', height: '14px', borderRadius: '50%', background: statusConfig.color, border: '2px solid var(--bg-secondary)', boxShadow: `0 0 10px ${statusConfig.glow}` }} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{getAgentName(agent.name)}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          <StatusIcon size={12} style={{ color: statusConfig.color }} />
                          <span style={{ fontSize: '12px', color: statusConfig.color, fontWeight: '500' }}>{statusConfig.label}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleKnowledgeConfig(agent.name)} style={{ padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }} className="knowledge-btn" title={language === 'zh' ? '知识库配置' : 'Knowledge Config'}>
                        <Brain size={16} style={{ color: 'var(--text-secondary)' }} />
                      </button>
                      <button onClick={() => handleDeleteAgent(agent.id)} disabled={isDeleting} style={{ padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px', cursor: isDeleting ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }} title={language === 'zh' ? '删除' : 'Delete'}>
                        {isDeleting ? (
                          <Loader2 size={16} style={{ color: 'var(--text-tertiary)', animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Trash2 size={16} style={{ color: '#F87171' }} />
                        )}
                      </button>
                      <button onClick={() => handleConfigClick(agent.id, agent.modelName)} style={{ padding: '8px', background: showConfig === agent.id ? 'var(--primary)' : 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }} className="config-btn">
                        <Settings size={16} style={{ color: showConfig === agent.id ? '#fff' : 'var(--text-secondary)' }} />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: '1.5' }}>{getAgentDesc(agent.name)}</p>

                  {/* Agent Stats Row 1 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-tertiary)' }}>
                      <FolderKanban size={14} style={{ color: '#818CF8' }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{agent.projectCount || 0}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{language === 'zh' ? '项目数' : 'Projects'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-tertiary)' }}>
                      <Clock size={14} style={{ color: '#FBBF24' }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{agent.avgCompleteTime || '-'}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{language === 'zh' ? '平均完成' : 'Avg Time'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Agent Stats Row 2 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-tertiary)' }}>
                      <Coins size={14} style={{ color: '#34D399' }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{formatToken(agent.totalTokens || 0)}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Token</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-tertiary)' }}>
                      <Calendar size={14} style={{ color: '#F87171' }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{agent.runningDays || 0}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{language === 'zh' ? '运行天数' : 'Days'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Model Config */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 0', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', flexShrink: 0 }}>{language === 'zh' ? '模型' : 'Model'}:</span>
                    <select
                      value={pendingModel[agent.id] || agent.modelName}
                      onChange={(e) => handleModelChange(agent.id, e.target.value)}
                      disabled={showConfig !== agent.id}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        cursor: showConfig === agent.id ? 'pointer' : 'not-allowed',
                        opacity: showConfig === agent.id ? 1 : 0.6
                      }}
                    >
                      {models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    {showConfig === agent.id && (
                      <button
                        onClick={() => handleApplyModel(agent.id)}
                        disabled={!hasPendingChange}
                        style={{
                          padding: '8px 14px',
                          background: hasPendingChange ? 'linear-gradient(135deg, var(--primary), var(--accent-violet))' : 'var(--bg-tertiary)',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: hasPendingChange ? '#fff' : 'var(--text-tertiary)',
                          cursor: hasPendingChange ? 'pointer' : 'not-allowed',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Play size={12} />
                        {language === 'zh' ? '应用' : 'Apply'}
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', paddingTop: '12px' }}>
                    <button 
                      onClick={() => handleToggleAgent(agent.id, agent.enabled)}
                      disabled={isDeleting}
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px', 
                        padding: '12px', 
                        borderRadius: '12px', 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        border: 'none', 
                        cursor: isDeleting ? 'not-allowed' : 'pointer', 
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                        background: agent.enabled ? 'linear-gradient(135deg, #DC2626, #F43F5E)' : 'linear-gradient(135deg, #059669, #10B981)', 
                        color: 'white', 
                        boxShadow: agent.enabled ? '0 4px 16px rgba(220, 38, 38, 0.3)' : '0 4px 16px rgba(5, 150, 105, 0.3)' 
                      }} 
                      className="power-btn"
                    >
                      <Power size={16} />
                      {agent.enabled ? (language === 'zh' ? '禁用' : 'Disable') : (language === 'zh' ? '启用' : 'Enable')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Styles */}
      <style>{`
        .agent-search-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
        .config-btn:hover, .knowledge-btn:hover { background: var(--bg-card-hover) !important; border-color: var(--border-hover) !important; }
        .power-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Global Configuration Modal */}
      <AgentConfigModal isOpen={showGlobalConfig} onClose={() => setShowGlobalConfig(false)} />
    </div>
  )
}
