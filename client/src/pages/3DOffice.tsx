import { useState, useEffect } from 'react'
import { 
  Box, AlertTriangle, Users, Loader2, Info
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useDashboardStore } from '../stores/dashboardStore'

// 3D Office - Placeholder page when @react-three/fiber is not installed
// Shows agent team visualization when linked, or prompt when not linked

export default function Office3D() {
  const { language } = useLanguage()
  const { agents, projects } = useDashboardStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  // Check if agent team is linked (has active agents and a project)
  const hasLinkedTeam = agents.length > 0 && projects.length > 0
  const onlineAgents = agents.filter(a => a.status === 'online' || a.status === 'busy')

  if (isLoading) {
    return (
      <div 
        className="page-container animate-fade-in"
        style={{ 
          background: 'var(--bg-primary)',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <Loader2 size={40} style={{ color: 'var(--text-tertiary)', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          {language === 'zh' ? '加载中...' : 'Loading...'}
        </p>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
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
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
          {language === 'zh' ? '3D 办公室' : '3D Office'}
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
          {language === 'zh' ? '可视化智能体团队工作空间' : 'Visualize agent team workspace'}
        </p>
      </div>

      {/* Not Linked State */}
      {!hasLinkedTeam && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 120, height: 120, borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(139, 92, 246, 0.1))',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '32px',
          }}>
            <AlertTriangle size={48} style={{ color: '#FBBF24' }} />
          </div>
          
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
            {language === 'zh' ? '未链接 Agent Team' : 'Agent Team Not Linked'}
          </h2>
          
          <p style={{ fontSize: '15px', color: 'var(--text-tertiary)', maxWidth: 400, lineHeight: 1.6, marginBottom: '32px' }}>
            {language === 'zh' 
              ? '请先创建项目并配置智能体团队，然后返回这里查看3D办公室视图。'
              : 'Please create a project and configure an agent team first, then return here to view the 3D office.'}
          </p>

          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <a 
              href="/dashboard/projects"
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                color: 'white',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Box size={16} />
              {language === 'zh' ? '创建项目' : 'Create Project'}
            </a>
            <a 
              href="/dashboard/agents"
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Users size={16} />
              {language === 'zh' ? '配置智能体' : 'Configure Agents'}
            </a>
          </div>
        </div>
      )}

      {/* Linked State - Placeholder for 3D visualization */}
      {hasLinkedTeam && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 120, height: 120, borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(99, 102, 241, 0.1))',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '32px',
          }}>
            <Box size={48} style={{ color: '#34D399' }} />
          </div>
          
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
            {language === 'zh' ? '3D 可视化已链接' : '3D Visualization Linked'}
          </h2>
          
          <p style={{ fontSize: '15px', color: 'var(--text-tertiary)', maxWidth: 400, lineHeight: 1.6, marginBottom: '24px' }}>
            {language === 'zh' 
              ? `当前有 ${onlineAgents.length} 个在线智能体正在工作`
              : `${onlineAgents.length} agents are currently online and working`}
          </p>

          {/* Agent Status Summary */}
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: '16px',
          }}>
            {onlineAgents.slice(0, 5).map(agent => (
              <div 
                key={agent.id}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: agent.status === 'online' ? '#34D399' : '#FBBF24',
                  boxShadow: agent.status === 'online' ? '0 0 8px #34D399' : '0 0 8px #FBBF24',
                }} />
                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {agent.name}
                </span>
              </div>
            ))}
          </div>

          {/* 3D Library Notice */}
          <div style={{
            marginTop: '32px',
            padding: '16px 20px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: 500,
          }}>
            <Info size={18} style={{ color: '#6366F1', flexShrink: 0 }} />
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'left', margin: 0 }}>
              {language === 'zh' 
                ? '要启用完整的3D办公室视图，请安装 @react-three/fiber 和 three.js'
                : 'To enable full 3D office view, please install @react-three/fiber and three.js'}
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
