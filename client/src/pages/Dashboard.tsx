import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Bot, 
  FolderKanban, 
  CheckCircle, 
  AlertCircle, 
  Activity,
  Coins,
  Cpu,
  HardDrive,
  MemoryStick,
  WifiOff,
  ArrowRight,
  Zap,
  Clock,
  TrendingUp,
  MessageSquare,
  Code,
  Shield,
  TestTube,
  Rocket,
} from 'lucide-react'
import { useDashboardStore } from '../stores/dashboardStore'
import { useLanguage } from '../context/LanguageContext'
import { useDeployMode } from '../context/DeployModeContext'

// Agent status config with animations
const agentStatusConfig = {
  online: {
    color: '#34D399',
    glow: 'rgba(52, 211, 153, 0.6)',
    label: { en: 'Online', zh: '在线' },
    animation: 'pulse-online 2s ease-in-out infinite',
  },
  idle: {
    color: '#64748B',
    glow: 'transparent',
    label: { en: 'Idle', zh: '空闲' },
    animation: 'pulse-idle 3s ease-in-out infinite',
  },
  busy: {
    color: '#FBBF24',
    glow: 'rgba(251, 191, 36, 0.5)',
    label: { en: 'Busy', zh: '忙碌' },
    animation: 'scan-line 1.5s linear infinite',
  },
  thinking: {
    color: '#8B5CF6',
    glow: 'rgba(139, 92, 246, 0.5)',
    label: { en: 'Thinking', zh: '思考中' },
    animation: 'ripple 1.2s ease-out infinite',
  },
  error: {
    color: '#F87171',
    glow: 'rgba(248, 113, 113, 0.6)',
    label: { en: 'Error', zh: '异常' },
    animation: 'blink-error 0.5s ease-in-out infinite',
  },
  offline: {
    color: '#334155',
    glow: 'transparent',
    label: { en: 'Offline', zh: '离线' },
    animation: 'none',
  },
}

// Role emoji mapping
const roleEmoji: Record<string, string> = {
  pm: '📋',
  planner: '📝',
  architect: '🏗️',
  coder: '💻',
  frontend: '🎨',
  backend: '⚙️',
  reviewer: '🔍',
  tester: '🧪',
  deployer: '🚀',
  devops: '🔧',
}

// Role icon mapping
const roleIcon: Record<string, React.ReactNode> = {
  pm: <MessageSquare size={14} />,
  planner: <MessageSquare size={14} />,
  architect: <Zap size={14} />,
  coder: <Code size={14} />,
  frontend: <Code size={14} />,
  backend: <Code size={14} />,
  reviewer: <Shield size={14} />,
  tester: <TestTube size={14} />,
  deployer: <Rocket size={14} />,
  devops: <Rocket size={14} />,
}

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

// Agent status dot with animation
function AgentStatusDot({ status }: { status: string }) {
  const config = agentStatusConfig[status as keyof typeof agentStatusConfig] || agentStatusConfig.offline
  
  return (
    <div style={{ position: 'relative', width: 12, height: 12 }}>
      <style>{`
        @keyframes pulse-online {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        @keyframes pulse-idle {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        @keyframes scan-line {
          0% { box-shadow: 0 0 4px rgba(251, 191, 36, 0.8); }
          50% { box-shadow: 0 0 12px rgba(251, 191, 36, 0.9); }
          100% { box-shadow: 0 0 4px rgba(251, 191, 36, 0.8); }
        }
        @keyframes ripple {
          0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7); }
          100% { box-shadow: 0 0 0 8px rgba(139, 92, 246, 0); }
        }
        @keyframes blink-error {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: config.color,
          boxShadow: config.glow !== 'transparent' ? `0 0 ${status === 'error' ? '12' : '8'}px ${config.glow}` : 'none',
          animation: config.animation !== 'none' ? config.animation : undefined,
          transition: 'all 0.3s ease',
        }}
      />
    </div>
  )
}

// Health ring component
function HealthRing({ value, size = 32 }: { value: number; size?: number }) {
  const stroke = 3
  const radius = (size - stroke) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference
  const color = value > 70 ? '#34D399' : value > 30 ? '#FBBF24' : '#F87171'
  
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--bg-tertiary)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  )
}

// Agent card with enhanced UI
function AgentCard({ agent, language }: { agent: any; language: 'en' | 'zh' }) {
  const [expanded, setExpanded] = useState(false)
  const statusCfg = agentStatusConfig[agent.status as keyof typeof agentStatusConfig] || agentStatusConfig.offline
  const roleEmo = roleEmoji[agent.role] || '🤖'
  
  // Mock data for demo - in production this comes from API
  const mockData = {
    taskCount: Math.floor(Math.random() * 5),
    avgResponseTime: ['1.2s', '2.4s', '0.8s', '3.1s'][Math.floor(Math.random() * 4)],
    load: Math.floor(Math.random() * 40) + 60,
    lastActivity: ['2min ago', '5min ago', '1h ago', 'just now'][Math.floor(Math.random() * 4)],
    personality: ['⚡ Fast', '🎯 Precise', '💡 Creative', '🛡️ Strict'][Math.floor(Math.random() * 4)],
  }
  
  return (
    <div
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: expanded ? '14px' : '12px 14px',
        borderRadius: '14px',
        background: agent.status === 'online' 
          ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.08), rgba(52, 211, 153, 0.02))' 
          : agent.status === 'busy'
          ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(251, 191, 36, 0.02))'
          : agent.status === 'thinking'
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(139, 92, 246, 0.02))'
          : 'var(--bg-tertiary)',
        border: `1px solid ${agent.status === 'online' ? 'rgba(52, 211, 153, 0.2)' : agent.status === 'busy' ? 'rgba(251, 191, 36, 0.2)' : 'var(--border)'}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        transform: expanded ? 'translateX(4px) scale(1.02)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Avatar with role emoji */}
          <div style={{ 
            position: 'relative',
            width: 40, 
            height: 40, 
            borderRadius: '12px', 
            background: `linear-gradient(135deg, ${statusCfg.color}30, ${statusCfg.color}10)`,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '18px',
          }}>
            {roleEmo}
            {/* Status dot */}
            <div style={{ 
              position: 'absolute', 
              bottom: -2, 
              right: -2,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 1,
            }}>
              <AgentStatusDot status={agent.status} />
            </div>
          </div>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>
                {agent.name}
              </span>
              {agent.status === 'online' && (
                <span style={{ 
                  fontSize: '10px', 
                  padding: '1px 6px', 
                  borderRadius: '4px', 
                  background: 'rgba(52, 211, 153, 0.15)', 
                  color: '#34D399',
                  fontWeight: '500',
                }}>
                  {language === 'zh' ? '就绪' : 'Ready'}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                {agent.modelName}
              </span>
              {agent.personality && (
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', opacity: 0.7 }}>
                  · {agent.personality}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Health ring */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HealthRing value={mockData.load} />
        </div>
      </div>
      
      {/* Expanded stats */}
      <div style={{
        maxHeight: expanded ? '100px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
        opacity: expanded ? 1 : 0,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          paddingTop: '10px',
          borderTop: '1px solid var(--border)',
          marginTop: '4px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {mockData.taskCount}
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {language === 'zh' ? '任务' : 'Tasks'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {mockData.avgResponseTime}
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {language === 'zh' ? '响应' : 'Response'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {mockData.load}%
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {language === 'zh' ? '负载' : 'Load'}
            </div>
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px', 
          marginTop: '8px',
          fontSize: '10px', 
          color: 'var(--text-tertiary)' 
        }}>
          <Clock size={10} />
          {language === 'zh' ? '最近活动：' : 'Last: '}{mockData.lastActivity}
        </div>
      </div>
    </div>
  )
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

      {/* System Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }} className="metrics-grid">
        <div className="card animate-slide-up stagger-1" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(16, 185, 129, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coins size={18} style={{ color: '#34D399' }} />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {language === 'zh' ? '总Token消耗' : 'Total Tokens'}
            </div>
          </div>
          <span style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Cabinet Grotesk', color: '#34D399' }}>
            {formatToken(resources.totalTokens || 0)}
          </span>
        </div>

        <div className="card animate-slide-up stagger-2" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={18} style={{ color: '#3B82F6' }} />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {language === 'zh' ? 'CPU占用' : 'CPU Usage'}
            </div>
          </div>
          <span style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Cabinet Grotesk', color: '#3B82F6' }}>
            {resources.cpu || 0}%
          </span>
        </div>

        <div className="card animate-slide-up stagger-3" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MemoryStick size={18} style={{ color: '#FBBF24' }} />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {language === 'zh' ? '内存占用' : 'Memory Usage'}
            </div>
          </div>
          <span style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Cabinet Grotesk', color: '#FBBF24' }}>
            {resources.memory || 0}%
          </span>
        </div>

        <div className="card animate-slide-up stagger-4" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDrive size={18} style={{ color: '#8B5CF6' }} />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {language === 'zh' ? '硬盘占用' : 'Disk Usage'}
            </div>
          </div>
          <span style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Cabinet Grotesk', color: '#8B5CF6' }}>
            {resources.disk || 0}%
          </span>
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

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Projects Table */}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Agent Status + Activity Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Enhanced Agent Status */}
          <div className="card animate-slide-up stagger-6" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {language === 'zh' ? '智能体状态' : 'Agent Status'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Legend */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399' }} />
                  {language === 'zh' ? '在线' : 'Online'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FBBF24' }} />
                  {language === 'zh' ? '忙碌' : 'Busy'}
                </div>
              </div>
              <button onClick={() => navigate('/agents')} style={{ padding: '6px 12px', background: 'transparent', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                {language === 'zh' ? '管理' : 'Manage'}
              </button>
            </div>
            
            {!isConnected ? (
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
                  <AgentCard key={agent.id} agent={agent} language={language} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card animate-slide-up stagger-7" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>
              {language === 'zh' ? '最近活动' : 'Recent Activity'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Mock activity items */}
              {[
                { icon: <Code size={14} />, text: { en: 'Coder completed task: API integration', zh: 'Coder 完成任务：API集成' }, time: '2min ago', color: '#3B82F6' },
                { icon: <Shield size={14} />, text: { en: 'Reviewer approved PR #23', zh: 'Reviewer 批准 PR #23' }, time: '5min ago', color: '#34D399' },
                { icon: <MessageSquare size={14} />, text: { en: 'PM clarified requirements for Project A', zh: 'PM 澄清 Project A 需求' }, time: '12min ago', color: '#8B5CF6' },
                { icon: <TestTube size={14} />, text: { en: 'Tester found 2 issues in auth module', zh: 'Tester 在 auth 模块发现 2 个问题' }, time: '1h ago', color: '#FBBF24' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-tertiary)' }}>
                  <div style={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: '8px', 
                    background: `${item.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.color,
                    flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {item.text[language]}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {item.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style>{`
        .view-all-btn:hover { background: var(--bg-tertiary); color: var(--text-primary); }
        .table-row:hover td { background: rgba(255, 255, 255, 0.01); }
        
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
