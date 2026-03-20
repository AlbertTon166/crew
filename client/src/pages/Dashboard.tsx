import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Bot, 
  FolderKanban, 
  CheckCircle, 
  AlertCircle, 
  Activity,
  TrendingUp,
  MoreHorizontal,
  ArrowRight,
  Coins,
  Cpu,
  HardDrive,
  MemoryStick,
  WifiOff
} from 'lucide-react'
import { useDashboardStore } from '../stores/dashboardStore'
import { useLanguage } from '../context/LanguageContext'
import { useDeployMode } from '../context/DeployModeContext'

const mockAgents = [
  { id: '1', name: 'Planner Agent', role: 'planner' as const, status: 'online' as const, modelProvider: 'openai', modelName: 'gpt-4', systemPrompt: '', skills: [] },
  { id: '2', name: 'Frontend Dev', role: 'frontend' as const, status: 'busy' as const, modelProvider: 'anthropic', modelName: 'claude-3', systemPrompt: '', skills: [] },
  { id: '3', name: 'Backend Dev', role: 'backend' as const, status: 'online' as const, modelProvider: 'anthropic', modelName: 'claude-3', systemPrompt: '', skills: [] },
  { id: '4', name: 'Reviewer', role: 'reviewer' as const, status: 'error' as const, modelProvider: 'anthropic', modelName: 'claude-3', systemPrompt: '', skills: [] },
  { id: '5', name: 'Tester', role: 'tester' as const, status: 'offline' as const, modelProvider: 'openai', modelName: 'gpt-4', systemPrompt: '', skills: [] },
]

const mockStats = {
  totalProjects: 12,
  inProgress: 5,
  completed: 6,
  error: 1,
  pending: 3,
  testing: 2,
}

const mockProjects = [
  { id: '1', name: 'E-commerce Platform', nameZh: '电商平台', status: 'in_progress', progress: 75, members: 3, dueDate: '2026-03-25', totalTokens: 450000, agentCount: 3 },
  { id: '2', name: 'Mobile App Redesign', nameZh: '移动端改版', status: 'completed', progress: 100, members: 2, dueDate: '2026-03-15', totalTokens: 280000, agentCount: 2 },
  { id: '3', name: 'API Integration', nameZh: 'API集成', status: 'in_progress', progress: 45, members: 4, dueDate: '2026-03-30', totalTokens: 120000, agentCount: 4 },
  { id: '4', name: 'Dashboard Analytics', nameZh: '数据仪表盘', status: 'pending', progress: 0, members: 2, dueDate: '2026-04-01', totalTokens: 0, agentCount: 0 },
]

const statusConfig: Record<string, { label: string; class: string }> = {
  in_progress: { label: 'In Progress', class: 'badge badge-active' },
  pending: { label: 'Pending', class: 'badge badge-pending' },
  completed: { label: 'Completed', class: 'badge badge-completed' },
}

const statusConfigZh: Record<string, { label: string; class: string }> = {
  in_progress: { label: '进行中', class: 'badge badge-active' },
  pending: { label: '待处理', class: 'badge badge-pending' },
  completed: { label: '已完成', class: 'badge badge-completed' },
}

// Generate mock historical data for 6 hours
const generateHistoryData = (baseValue: number, variance: number, decimals: number = 1) => {
  const now = Date.now()
  const sixHoursAgo = now - 6 * 60 * 60 * 1000
  const points = []
  for (let t = sixHoursAgo; t <= now; t += 10 * 60 * 1000) { // 10 min intervals
    const noise = (Math.random() - 0.5) * variance
    const trend = Math.sin(t / (60 * 60 * 1000)) * (variance / 4)
    points.push({ time: t, value: parseFloat((baseValue + noise + trend).toFixed(decimals)) })
  }
  return points
}

const mockMetrics = {
  totalTokens: { current: 2850000, history: generateHistoryData(2500000, 400000, 0) },
  cpu: { current: 47, history: generateHistoryData(45, 15, 1) },
  memory: { current: 68, history: generateHistoryData(65, 10, 1) },
  disk: { current: 42, history: generateHistoryData(40, 5, 1) },
}

const formatToken = (token: number) => {
  if (token >= 1000000) return (token / 1000000).toFixed(1) + 'M'
  if (token >= 1000) return (token / 1000).toFixed(0) + 'K'
  return token.toString()
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { agents, stats, setAgents, setStats } = useDashboardStore()
  const { isConnected } = useDeployMode()

  useEffect(() => {
    // Only set mock data if store is empty (first load)
    if (agents.length === 0) {
      setAgents(mockAgents as any)
      setStats(mockStats)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - only run once on mount

  const getStatusConfig = (status: string) => {
    return language === 'zh' ? statusConfigZh[status] : statusConfig[status]
  }

  const getProjectName = (project: typeof mockProjects[0]) => {
    return language === 'zh' ? project.nameZh : project.name
  }

  const renderSparkline = (data: { time: number; value: number }[], color: string, maxValue: number = 100) => {
    const width = 120
    const height = 32
    const padding = 2
    
    const minVal = Math.min(...data.map(d => d.value))
    const maxVal = Math.max(...data.map(d => d.value), maxValue)
    const range = maxVal - minVal || 1
    
    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2)
      const y = height - padding - ((d.value - minVal) / range) * (height - padding * 2)
      return `${x},${y}`
    }).join(' ')
    
    const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`
    
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill={`url(#gradient-${color.replace('#', '')})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
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
      {/* Not Connected State */}
      {!isConnected && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '80px 20px',
          textAlign: 'center'
        }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: 'rgba(248, 113, 113, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <WifiOff size={40} style={{ color: '#F87171' }} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {language === 'zh' ? '未连接到 Teams 服务器' : 'Not Connected to Teams Server'}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px' }}>
            {language === 'zh' ? '仪表盘功能暂时不可用，请稍后再试' : 'Dashboard is temporarily unavailable, please try again later'}
          </p>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
          {language === 'zh' ? '控制台' : 'Dashboard'}
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
          {language === 'zh' ? '欢迎回来！以下是最新动态。' : 'Welcome back! Here\'s what\'s happening.'}
        </p>
      </div>

      {/* System Metrics - First Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }} className="metrics-grid">
        {/* Total Token */}
        <div className="card animate-slide-up stagger-1" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(16, 185, 129, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Coins size={18} style={{ color: '#34D399' }} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {language === 'zh' ? '总Token消耗' : 'Total Tokens'}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Cabinet Grotesk', color: '#34D399' }}>
              {formatToken(mockMetrics.totalTokens.current)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>6h</span>
            {renderSparkline(mockMetrics.totalTokens.history, '#34D399', mockMetrics.totalTokens.history[mockMetrics.totalTokens.history.length - 1].value * 1.2)}
          </div>
        </div>

        {/* CPU */}
        <div className="card animate-slide-up stagger-2" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={18} style={{ color: '#3B82F6' }} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {language === 'zh' ? 'CPU占用' : 'CPU Usage'}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Cabinet Grotesk', color: '#3B82F6' }}>
              {mockMetrics.cpu.current}%
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>6h</span>
            {renderSparkline(mockMetrics.cpu.history, '#3B82F6')}
          </div>
        </div>

        {/* Memory */}
        <div className="card animate-slide-up stagger-3" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MemoryStick size={18} style={{ color: '#FBBF24' }} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {language === 'zh' ? '内存占用' : 'Memory Usage'}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Cabinet Grotesk', color: '#FBBF24' }}>
              {mockMetrics.memory.current}%
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>6h</span>
            {renderSparkline(mockMetrics.memory.history, '#FBBF24')}
          </div>
        </div>

        {/* Disk */}
        <div className="card animate-slide-up stagger-4" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HardDrive size={18} style={{ color: '#8B5CF6' }} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {language === 'zh' ? '硬盘占用' : 'Disk Usage'}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Cabinet Grotesk', color: '#8B5CF6' }}>
              {mockMetrics.disk.current}%
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>6h</span>
            {renderSparkline(mockMetrics.disk.history, '#8B5CF6')}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="stat-card animate-slide-up stagger-1">
          <div className="flex items-center justify-between mb-4">
            <div className="icon"><FolderKanban size={22} style={{ color: '#818CF8' }} /></div>
            <span style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', color: '#34D399' }}><TrendingUp size={14} />+2</span>
          </div>
          <div className="value">{stats.totalProjects}</div>
          <div className="label">{language === 'zh' ? '项目总数' : 'Total Projects'}</div>
        </div>

        <div className="stat-card animate-slide-up stagger-2">
          <div className="flex items-center justify-between mb-4">
            <div className="icon"><Activity size={22} style={{ color: '#FBBF24' }} /></div>
            <span style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', color: '#34D399' }}><TrendingUp size={14} />+1</span>
          </div>
          <div className="value">{stats.inProgress}</div>
          <div className="label">{language === 'zh' ? '进行中' : 'Active Projects'}</div>
        </div>

        <div className="stat-card animate-slide-up stagger-3">
          <div className="flex items-center justify-between mb-4">
            <div className="icon"><CheckCircle size={22} style={{ color: '#34D399' }} /></div>
            <span style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', color: '#34D399' }}><TrendingUp size={14} />+3</span>
          </div>
          <div className="value">{stats.completed}</div>
          <div className="label">{language === 'zh' ? '已完成' : 'Completed'}</div>
        </div>

        <div className="stat-card animate-slide-up stagger-4">
          <div className="flex items-center justify-between mb-4">
            <div className="icon"><AlertCircle size={22} style={{ color: '#F87171' }} /></div>
            <span style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', color: '#F87171' }}><TrendingUp size={14} style={{ transform: 'rotate(180deg)' }} />-1</span>
          </div>
          <div className="value">{stats.error}</div>
          <div className="label">{language === 'zh' ? '问题' : 'Issues'}</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Projects Table Card */}
        <div className="card animate-slide-up stagger-5" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {language === 'zh' ? '最近项目' : 'Recent Projects'}
            </h2>
            <button onClick={() => navigate('/projects')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'transparent', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }} className="view-all-btn">
              {language === 'zh' ? '查看全部' : 'View All'} <ArrowRight size={16} />
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', verticalAlign: 'middle' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' }}>{language === 'zh' ? '项目名称' : 'Project Name'}</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' }}>{language === 'zh' ? '状态' : 'Status'}</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' }}>{language === 'zh' ? 'Token消耗' : 'Tokens'}</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' }}>{language === 'zh' ? '进度' : 'Progress'}</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' }} className="hide-mobile">{language === 'zh' ? '成员' : 'Members'}</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' }} className="hide-mobile">{language === 'zh' ? '截止日期' : 'Due Date'}</th>
                  <th style={{ width: '48px', borderBottom: '1px solid var(--border)' }} />
                </tr>
              </thead>
              <tbody>
                {mockProjects.map(project => (
                  <tr key={project.id} className="table-row" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{getProjectName(project)}</span>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <span className={getStatusConfig(project.status).class}>{getStatusConfig(project.status).label}</span>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: '13px', color: '#34D399', fontWeight: '600' }}>
                        {project.totalTokens > 0 ? formatToken(project.totalTokens) : '-'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '140px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'var(--bg-tertiary)', borderRadius: '100px', overflow: 'hidden' }}>
                          <div style={{ width: `${project.progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent-violet))', borderRadius: '100px', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </div>
                        <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', minWidth: '36px' }}>{project.progress}%</span>
                      </div>
                    </td>
                    <td className="hide-mobile" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', marginLeft: '-8px' }}>
                        {[...Array(Math.min(project.members, 3))].map((_, i) => (
                          <div key={i} className="avatar" style={{ marginLeft: '-8px', border: '2px solid var(--bg-secondary)', width: '32px', height: '32px', fontSize: '12px' }}>{String.fromCharCode(65 + i)}</div>
                        ))}
                        {project.members > 3 && <div className="avatar" style={{ marginLeft: '-8px', border: '2px solid var(--bg-secondary)', width: '32px', height: '32px', fontSize: '12px', background: 'var(--bg-tertiary)' }}>+{project.members - 3}</div>}
                      </div>
                    </td>
                    <td className="hide-mobile" style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--text-tertiary)', verticalAlign: 'middle' }}>
                      {new Date(project.dueDate).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <button className="btn-icon" style={{ width: '36px', height: '36px' }}><MoreHorizontal size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar - Agent Status & Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Agent Status Card */}
          <div className="card animate-slide-up stagger-6" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{language === 'zh' ? '智能体状态' : 'Agent Status'}</h3>
              <button onClick={() => navigate('/agents')} style={{ padding: '6px 12px', background: 'transparent', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                {language === 'zh' ? '管理' : 'Manage'}
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {mockAgents.map(agent => (
                <div key={agent.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', transition: 'all 0.2s' }} className="agent-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '12px' }}><Bot size={16} /></div>
                    <div>
                      <p style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>{agent.name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>{agent.modelName}</p>
                    </div>
                  </div>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: agent.status === 'online' ? '#34D399' : agent.status === 'busy' ? '#FBBF24' : agent.status === 'error' ? '#F87171' : '#475569', boxShadow: agent.status === 'online' ? '0 0 12px rgba(52, 211, 153, 0.6)' : agent.status === 'busy' ? '0 0 12px rgba(251, 191, 36, 0.6)' : agent.status === 'error' ? '0 0 12px rgba(248, 113, 113, 0.6)' : 'none' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="card animate-slide-up stagger-6" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
              {language === 'zh' ? '最近活动' : 'Recent Activity'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { time: '2 min ago', timeZh: '2分钟前', action: 'Task completed: User authentication', actionZh: '任务完成：用户认证', agent: 'Frontend Dev', color: '#818CF8' },
                { time: '15 min ago', timeZh: '15分钟前', action: 'Code review passed: API endpoints', actionZh: '代码审核通过：API端点', agent: 'Reviewer', color: '#34D399' },
                { time: '1 hour ago', timeZh: '1小时前', action: 'New project created: E-commerce', actionZh: '新项目创建：电商平台', agent: 'Planner', color: '#FBBF24' },
                { time: '2 hours ago', timeZh: '2小时前', action: 'Bug fixed: Login redirect', actionZh: 'Bug修复：登录跳转', agent: 'Tester', color: '#F87171' },
              ].map((activity, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '14px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activity.color, marginTop: '6px', flexShrink: 0, boxShadow: `0 0 10px ${activity.color}` }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0, lineHeight: '1.4' }}>{language === 'zh' ? activity.actionZh : activity.action}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>{activity.agent} • {language === 'zh' ? activity.timeZh : activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hover styles */}
      <style>{`
        .view-all-btn:hover { background: var(--bg-tertiary); color: var(--text-primary); }
        .agent-item:hover { border-color: var(--border-hover); transform: translateX(4px); }
        .table-row:hover td { background: rgba(255, 255, 255, 0.01); }
        
        /* Mobile Responsive */
        @media (max-width: 1024px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        @media (max-width: 640px) {
          .metrics-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
