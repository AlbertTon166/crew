import { useState } from 'react'
import { 
  TrendingUp, TrendingDown, Coins, Zap, Bot, FolderKanban,
  Calendar, ArrowUp, ArrowDown, Clock, BarChart3, PieChart,
  Activity, Target, CheckCircle, Gauge
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useDashboardStore } from '../stores/dashboardStore'

// Format large numbers
const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(0) + 'K'
  return num.toString()
}

export default function UsageStats() {
  const { language } = useLanguage()
  const { stats, agents, projects } = useDashboardStore()
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')

  // Empty state when no data
  const hasData = stats.totalProjects > 0 || agents.length > 0

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>
          {language === 'zh' ? '使用统计' : 'Usage Statistics'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0 0', fontSize: '14px' }}>
          {language === 'zh' ? '查看AI资源消耗和使用趋势' : 'Monitor AI resource consumption and usage trends'}
        </p>
      </div>

      {/* Time range selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['7d', '30d', '90d'] as const).map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: timeRange === range ? 'var(--primary)' : 'var(--bg-tertiary)',
              color: timeRange === range ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {range === '7d' ? (language === 'zh' ? '7天' : '7 Days') : 
             range === '30d' ? (language === 'zh' ? '30天' : '30 Days') : 
             (language === 'zh' ? '90天' : '90 Days')}
          </button>
        ))}
      </div>

      {!hasData ? (
        /* Empty state */
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border)'
        }}>
          <Activity size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>
            {language === 'zh' ? '暂无使用数据' : 'No Usage Data Yet'}
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            {language === 'zh' ? '开始使用AI智能体后，这里将显示您的使用统计' : 'Usage statistics will appear here once you start using AI agents'}
          </p>
        </div>
      ) : (
        <>
          {/* Stats overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Coins size={20} style={{ color: '#6366F1' }} />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '700' }}>0</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{language === 'zh' ? '总Token' : 'Total Tokens'}</div>
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(52, 211, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={20} style={{ color: '#34D399' }} />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '700' }}>{agents.filter(a => a.status === 'online').length}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{language === 'zh' ? '活跃智能体' : 'Active Agents'}</div>
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FolderKanban size={20} style={{ color: '#8B5CF6' }} />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '700' }}>{stats.completed || 0}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{language === 'zh' ? '已完成任务' : 'Completed Tasks'}</div>
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={20} style={{ color: '#F59E0B' }} />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '700' }}>$0.00</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{language === 'zh' ? '今日消耗' : "Today's Cost"}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
