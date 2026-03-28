import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Bot, 
  FolderKanban, 
  Folder,
  CheckCircle, 
  AlertCircle, 
  Activity,
  Coins,
  WifiOff,
  ArrowRight,
  Zap,
  Clock,
  MessageSquare,
  Code,
  Shield,
  TestTube,
  Rocket,
  Plus,
  User,
  Settings,
  Bell,
  ChevronRight,
  Play,
  Pause,
  RefreshCw,
} from 'lucide-react'
import { useDashboardStore } from '../stores/dashboardStore'
import { useLanguage } from '../context/LanguageContext'
import { useDeployMode } from '../context/DeployModeContext'

// Agent status config
const agentStatusConfig = {
  online: { color: '#34D399', label: { en: 'Online', zh: '在线' } },
  idle: { color: '#64748B', label: { en: 'Idle', zh: '空闲' } },
  busy: { color: '#FBBF24', label: { en: 'Busy', zh: '忙碌' } },
  thinking: { color: '#8B5CF6', label: { en: 'Thinking', zh: '思考中' } },
  error: { color: '#F87171', label: { en: 'Error', zh: '异常' } },
  offline: { color: '#334155', label: { en: 'Offline', zh: '离线' } },
}

// Role emoji
const roleEmoji: Record<string, string> = {
  pm: '📋', planner: '📝', architect: '🏗️', coder: '💻',
  frontend: '🎨', backend: '⚙️', reviewer: '🔍', tester: '🧪', deployer: '🚀', devops: '🔧',
}

// Activity types
const activityTypes = [
  { type: 'task', icon: <Code size={14} />, color: '#3B82F6' },
  { type: 'review', icon: <Shield size={14} />, color: '#34D399' },
  { type: 'deploy', icon: <Rocket size={14} />, color: '#F59E0B' },
  { type: 'message', icon: <MessageSquare size={14} />, color: '#8B5CF6' },
]

// Mock data
const mockAgents = [
  { id: '1', name: 'Coder', role: 'coder', status: 'online', model: 'GPT-4o', tasks: 3 },
  { id: '2', name: 'Reviewer', role: 'reviewer', status: 'busy', model: 'Claude-3.5', tasks: 2 },
  { id: '3', name: 'PM', role: 'pm', status: 'thinking', model: 'GPT-4o', tasks: 1 },
  { id: '4', name: 'Tester', role: 'tester', status: 'idle', model: 'DeepSeek', tasks: 0 },
  { id: '5', name: 'Deployer', role: 'deployer', status: 'offline', model: 'GPT-4o-mini', tasks: 0 },
]

const mockActivities = [
  { id: '1', type: 'task', agent: 'Coder', content: '完成了 API 集成模块', time: '2min ago' },
  { id: '2', type: 'review', agent: 'Reviewer', content: '通过代码审查 #23', time: '5min ago' },
  { id: '3', type: 'deploy', agent: 'Deployer', content: '上线版本 v2.1.0', time: '12min ago' },
  { id: '4', type: 'task', agent: 'Coder', content: '修复登录 bug', time: '1h ago' },
  { id: '5', type: 'message', agent: 'PM', content: '确认需求：支付模块', time: '2h ago' },
]

const mockStats = {
  activeAgents: 4,
  totalTasks: 12,
  completedToday: 3,
  pendingTasks: 7,
  totalTokens: 2847293,
  todayCost: 10.53,
}

// Quick action
function QuickAction({ icon, label, color, onClick }: {
  icon: React.ReactNode; label: string; color: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '16px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minWidth: '90px',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = color
        e.currentTarget.style.background = `${color}08`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.background = 'var(--bg-secondary)'
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: '12px',
        background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color,
      }}>
        {icon}
      </div>
      <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>
        {label}
      </span>
    </button>
  )
}

// Agent mini card
import { Agent } from '../stores/dashboardStore'

function AgentMiniCard({ agent, language }: { agent: Agent; language: 'en' | 'zh' }) {
  const cfg = agentStatusConfig[agent.status as keyof typeof agentStatusConfig]
  const emoji = roleEmoji[agent.role] || '🤖'
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 12px',
      background: 'var(--bg-tertiary)',
      borderRadius: '10px',
    }}>
      {/* Avatar */}
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '10px',
          background: `${cfg.color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px',
        }}>
          {emoji}
        </div>
        {/* Status dot */}
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 10, height: 10, borderRadius: '50%',
          background: cfg.color,
          border: '2px solid var(--bg-tertiary)',
        }} />
      </div>
      
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
          {agent.name}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
          {agent.tasks} {language === 'zh' ? '个任务' : 'tasks'}
        </div>
      </div>
      
      {/* Model badge */}
      <div style={{
        fontSize: '10px',
        padding: '2px 6px',
        borderRadius: '4px',
        background: 'var(--bg-secondary)',
        color: 'var(--text-tertiary)',
      }}>
        {agent.modelName}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { agents, stats, projects, resources, setAgents } = useDashboardStore()
  const { isConnected } = useDeployMode()
  
  // Compute stats from actual data
  const activeAgents = agents.filter(a => a.status === 'online' || a.status === 'busy').length
  const totalTasks = Object.values({}).length // No tasks in store yet
  const pendingTasks = projects.filter(p => p.status === 'pending' || p.status === 'in_progress').length

  // Quick actions handler
  const quickActions = [
    {
      icon: <Plus size={20} />,
      label: '新建项目',
      labelEn: 'New Project',
      color: '#3B82F6',
      onClick: () => navigate('/projects'),
    },
    {
      icon: <MessageSquare size={20} />,
      label: '提交需求',
      labelEn: 'Add Requirement',
      color: '#8B5CF6',
      onClick: () => navigate('/requirements'),
    },
    {
      icon: <Bot size={20} />,
      label: '配置智能体',
      labelEn: 'Configure Agents',
      color: '#34D399',
      onClick: () => navigate('/agents'),
    },
    {
      icon: <Activity size={20} />,
      label: '查看使用',
      labelEn: 'View Usage',
      color: '#F59E0B',
      onClick: () => navigate('/usage'),
    },
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>,
      label: '3D Office',
      labelEn: '3D Office',
      color: '#EC4899',
      onClick: () => navigate('/office3d'),
    },
  ]

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
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
          {language === 'zh' ? '欢迎回来' : 'Welcome Back'}
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
          {language === 'zh' ? '以下是团队最新动态' : "Here's your team's latest updates"}
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
          {language === 'zh' ? '快捷操作' : 'Quick Actions'}
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {quickActions.map((action, i) => (
            <QuickAction key={i} {...action} />
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { icon: <Bot size={18} />, value: activeAgents, label: language === 'zh' ? '活跃智能体' : 'Active Agents', color: '#34D399' },
              { icon: <CheckCircle size={18} />, value: stats.completed || 0, label: language === 'zh' ? '已完成' : 'Completed', color: '#3B82F6' },
              { icon: <Clock size={18} />, value: pendingTasks, label: language === 'zh' ? '进行中' : 'In Progress', color: '#F59E0B' },
              { icon: <Folder size={18} />, value: stats.totalProjects || projects.length, label: language === 'zh' ? '项目总数' : 'Projects', color: '#8B5CF6' },
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '8px',
                    background: `${stat.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: stat.color,
                  }}>
                    {stat.icon}
                  </div>
                </div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {language === 'zh' ? '最近活动' : 'Recent Activity'}
              </h3>
              <button 
                onClick={() => navigate('/projects')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {language === 'zh' ? '查看全部' : 'View All'}
                <ChevronRight size={14} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mockActivities.map(activity => {
                const actType = activityTypes.find(t => t.type === activity.type)
                return (
                  <div key={activity.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '10px',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '8px',
                      background: `${actType?.color}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: actType?.color,
                    }}>
                      {actType?.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                        <span style={{ fontWeight: '600' }}>{activity.agent}</span>
                        <span style={{ color: 'var(--text-tertiary)' }}> {activity.content}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {activity.time}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Agents */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {language === 'zh' ? '智能体状态' : 'Agent Status'}
            </h3>
            <button 
              onClick={() => navigate('/agents')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {language === 'zh' ? '管理' : 'Manage'}
              <ChevronRight size={14} />
            </button>
          </div>
          
          {/* Agent status summary */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {(['online', 'busy', 'idle', 'thinking'] as const).map(status => {
              const cfg = agentStatusConfig[status]
              const count = agents.filter(a => a.status === status).length
              return (
                <div key={status} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '10px 6px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '10px',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: cfg.color,
                    marginBottom: '6px',
                  }} />
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {count}
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                    {cfg.label[language]}
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Agent list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {agents.slice(0, 5).map(agent => (
              <AgentMiniCard key={agent.id} agent={agent} language={language} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
