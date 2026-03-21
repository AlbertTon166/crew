import { useState, useEffect } from 'react'
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
  WifiOff,
  Plus
} from 'lucide-react'
import { useDashboardStore } from '../stores/dashboardStore'
import { useLanguage } from '../context/LanguageContext'
import { useDeployMode } from '../context/DeployModeContext'

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

const formatToken = (token: number) => {
  if (token >= 1000000) return (token / 1000000).toFixed(1) + 'M'
  if (token >= 1000) return (token / 1000).toFixed(0) + 'K'
  return token.toString()
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { agents, stats, projects, resources, setAgents } = useDashboardStore()
  const { isConnected } = useDeployMode()
  const [agentsLoading, setAgentsLoading] = useState(false)

  // Fetch agents from API
  useEffect(() => {
    const fetchAgents = async () => {
      if (!isConnected) return
      setAgentsLoading(true)
      try {
        const res = await fetch('/api/agents')
        if (res.ok) {
          const data = await res.json()
          // Transform backend data to store format
          const transformed = data.map((a: any) => ({
            id: a.id,
            name: a.name,
            role: a.role,
            status: a.status,
            modelProvider: a.model_provider || 'openai',
            modelName: a.model_name || 'gpt-4',
            systemPrompt: '',
            skills: [],
            enabled: a.enabled,
          }))
          setAgents(transformed)
        }
      } catch (e) {
        console.error('Failed to fetch agents:', e)
      }
      setAgentsLoading(false)
    }
    fetchAgents()
  }, [isConnected, setAgents])

  // Get real data from store
  const recentProjects = projects.slice(0, 5)

  const getStatusConfig = (status: string) => {
    return language === 'zh' ? statusConfigZh[status] : statusConfig[status]
  }

  const getProjectName = (project: any) => {
    return language === 'zh' ? (project.nameZh || project.name) : project.name
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
              {formatToken(resources.totalTokens || 0)}
            </span>
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
              {resources.cpu || 0}%
            </span>
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
              {resources.memory || 0}%
            </span>
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
              {resources.disk || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="stat-card animate-slide-up stagger-1">
          <div className="flex items-center justify-between mb-4">
            <div className="icon"><FolderKanban size={22} style={{ color: '#818CF8' }} /></div>
          </div>
          <div className="value">{stats.totalProjects}</div>
          <div className="label">{language === 'zh' ? '项目总数' : 'Total Projects'}</div>
        </div>

        <div className="stat-card animate-slide-up stagger-2">
          <div className="flex items-center justify-between mb-4">
            <div className="icon"><Activity size={22} style={{ color: '#FBBF24' }} /></div>
          </div>
          <div className="value">{stats.inProgress}</div>
          <div className="label">{language === 'zh' ? '进行中' : 'Active Projects'}</div>
        </div>

        <div className="stat-card animate-slide-up stagger-3">
          <div className="flex items-center justify-between mb-4">
            <div className="icon"><CheckCircle size={22} style={{ color: '#34D399' }} /></div>
          </div>
          <div className="value">{stats.completed}</div>
          <div className="label">{language === 'zh' ? '已完成' : 'Completed'}</div>
        </div>

        <div className="stat-card animate-slide-up stagger-4">
          <div className="flex items-center justify-between mb-4">
            <div className="icon"><AlertCircle size={22} style={{ color: '#F87171' }} /></div>
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

          {recentProjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <FolderKanban size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {language === 'zh' ? '暂无项目' : 'No projects yet'}
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                {language === 'zh' ? '创建您的第一个项目开始吧' : 'Create your first project to get started'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', verticalAlign: 'middle' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' }}>{language === 'zh' ? '项目名称' : 'Project Name'}</th>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' }}>{language === 'zh' ? '状态' : 'Status'}</th>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' }}>{language === 'zh' ? 'Token消耗' : 'Tokens'}</th>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' }}>{language === 'zh' ? '进度' : 'Progress'}</th>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' }} className="hide-mobile">{language === 'zh' ? '成员' : 'Members'}</th>
                    <th style={{ width: '48px', borderBottom: '1px solid var(--border)' }} />
                  </tr>
                </thead>
                <tbody>
                  {recentProjects.map(project => (
                    <tr key={project.id} className="table-row" style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{getProjectName(project)}</span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span className={getStatusConfig(project.status)?.class || 'badge badge-pending'}>{getStatusConfig(project.status)?.label || project.status}</span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '13px', color: '#34D399', fontWeight: '600' }}>
                          {(project as any).totalTokens > 0 ? formatToken((project as any).totalTokens) : '-'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '140px' }}>
                          <div style={{ flex: 1, height: '6px', background: 'var(--bg-tertiary)', borderRadius: '100px', overflow: 'hidden' }}>
                            <div style={{ width: `${(project as any).progress || 0}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent-violet))', borderRadius: '100px', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                          </div>
                          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', minWidth: '36px' }}>{(project as any).progress || 0}%</span>
                        </div>
                      </td>
                      <td className="hide-mobile" style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', marginLeft: '-8px' }}>
                          {[...Array(Math.min((project as any).members || 0, 3))].map((_, i) => (
                            <div key={i} className="avatar" style={{ marginLeft: '-8px', border: '2px solid var(--bg-secondary)', width: '32px', height: '32px', fontSize: '12px' }}>{String.fromCharCode(65 + i)}</div>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <button className="btn-icon" style={{ width: '36px', height: '36px' }}><MoreHorizontal size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
            
            {!isConnected || agents.filter(a => a.status === 'online').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <WifiOff size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
                <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', background: 'linear-gradient(90deg, #F87171, #EF4444, #DC2626)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'breathingRed 2s ease-in-out infinite' }}>
                  {language === 'zh' ? '未连接到teams服务器' : 'Not Connected to Teams'}
                </p>
                <style>{`@keyframes breathingRed { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
              </div>
            ) : agents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <Bot size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {language === 'zh' ? '暂无智能体' : 'No agents yet'}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  {language === 'zh' ? '连接服务器后自动同步' : 'Agents will sync when server is connected'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {agents.slice(0, 5).map(agent => (
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
            )}
          </div>

          {/* Recent Activity Card */}
          <div className="card animate-slide-up stagger-6" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
              {language === 'zh' ? '最近活动' : 'Recent Activity'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '32px 16px' }}>
              <Activity size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto' }} />
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {language === 'zh' ? '暂无活动记录' : 'No recent activity'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {language === 'zh' ? '活动记录将在连接服务器后显示' : 'Activity will be shown when server is connected'}
              </p>
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
