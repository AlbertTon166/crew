import { useState } from 'react'
import { 
  TrendingUp, TrendingDown, Coins, Zap, Bot, FolderKanban,
  Calendar, ArrowUp, ArrowDown, Clock, BarChart3, PieChart,
  Activity, Target, CheckCircle, Gauge
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

// Mock usage data
const mockUsageData = {
  totalTokens: 2847293,
  totalCost: 127.84,
  apiCalls: 12847,
  callsInLast5Min: 47,
  rateLimitPer5Min: 60,
  activeDays: 12,
  periodTokens: [
    { date: '03-19', tokens: 128000, cost: 5.76 },
    { date: '03-20', tokens: 256000, cost: 11.52 },
    { date: '03-21', tokens: 189000, cost: 8.51 },
    { date: '03-22', tokens: 312000, cost: 14.04 },
    { date: '03-23', tokens: 276000, cost: 12.42 },
    { date: '03-24', tokens: 198000, cost: 8.91 },
    { date: '03-25', tokens: 234000, cost: 10.53 },
  ],
  byAgent: [
    { name: 'Coder', tokens: 892341, cost: 40.15, calls: 4521 },
    { name: 'Reviewer', tokens: 634291, cost: 28.54, calls: 3201 },
    { name: 'PM', tokens: 412093, cost: 18.54, calls: 2892 },
    { name: 'Tester', tokens: 298102, cost: 13.41, calls: 1847 },
    { name: 'Planner', tokens: 209466, cost: 9.42, calls: 386 },
  ],
  byProject: [
    { name: 'E-commerce API', tokens: 1024000, cost: 46.08, tasks: 23 },
    { name: 'Data Pipeline', tokens: 789000, cost: 35.51, tasks: 15 },
    { name: 'AI Chatbot', tokens: 534000, cost: 24.03, tasks: 12 },
    { name: 'Mobile App', tokens: 345293, cost: 15.54, tasks: 8 },
    { name: 'Analytics Dashboard', tokens: 154000, cost: 6.93, tasks: 5 },
  ],
  byModel: [
    { model: 'GPT-4o', tokens: 1423000, cost: 64.04, percentage: 50 },
    { model: 'Claude-3.5', tokens: 854000, cost: 38.43, percentage: 30 },
    { model: 'DeepSeek', tokens: 570293, cost: 25.66, percentage: 20 },
  ],
}

// Format large numbers
const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(0) + 'K'
  return num.toString()
}

// Stat card
function StatCard({ icon, label, labelEn, value, subValue, trend, color, language }: {
  icon: React.ReactNode
  label: string
  labelEn: string
  value: string
  subValue?: string
  trend?: 'up' | 'down'
  color: string
  language: 'en' | 'zh'
}) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '10px',
          background: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color,
        }}>
          {icon}
        </div>
        {trend && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            fontSize: '11px',
            color: trend === 'up' ? '#34D399' : '#F87171',
          }}>
            {trend === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {trend === 'up' ? '+12%' : '-8%'}
          </div>
        )}
      </div>
      <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
        {language === 'zh' ? label : labelEn}
      </div>
      {subValue && (
        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          {subValue}
        </div>
      )}
    </div>
  )
}

// Mini bar chart
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percentage = (value / max) * 100
  return (
    <div style={{
      width: '100%',
      height: 8,
      background: 'var(--bg-tertiary)',
      borderRadius: 4,
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${percentage}%`,
        height: '100%',
        background: color,
        borderRadius: 4,
        transition: 'width 0.5s ease',
      }} />
    </div>
  )
}

export default function UsageStats() {
  const { language } = useLanguage()
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d')
  
  const maxTokens = Math.max(...mockUsageData.periodTokens.map(t => t.tokens))
  const maxAgentTokens = Math.max(...mockUsageData.byAgent.map(a => a.tokens))
  const maxProjectTokens = Math.max(...mockUsageData.byProject.map(p => p.tokens))
  
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
              {language === 'zh' ? '使用统计' : 'Usage Statistics'}
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              {language === 'zh' ? 'Token 消耗与成本分析' : 'Token consumption & cost analysis'}
            </p>
          </div>
          
          {/* Period selector */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            borderRadius: '10px',
            padding: '4px',
            border: '1px solid var(--border)',
          }}>
            {[
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: '90d', label: '90D' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as typeof period)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: period === p.id ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'transparent',
                  color: period === p.id ? 'white' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }} className="stats-grid">
        <StatCard
          icon={<Coins size={20} />}
          label="总 Token"
          labelEn="Total Tokens"
          value={formatNumber(mockUsageData.totalTokens)}
          subValue={`$${mockUsageData.totalCost.toFixed(2)}`}
          trend="up"
          color="#34D399"
          language={language}
        />
        <StatCard
          icon={<Zap size={20} />}
          label="API 调用"
          labelEn="API Calls"
          value={formatNumber(mockUsageData.apiCalls)}
          subValue={`${language === 'zh' ? '近5分钟' : 'Last 5min'}: ${mockUsageData.callsInLast5Min}/${mockUsageData.rateLimitPer5Min}`}
          trend="up"
          color="#6366F1"
          language={language}
        />
        <StatCard
          icon={<Gauge size={20} />}
          label="限流使用"
          labelEn="Rate Limit"
          value={`${Math.round(mockUsageData.callsInLast5Min / mockUsageData.rateLimitPer5Min * 100)}%`}
          subValue={`${mockUsageData.callsInLast5Min} / ${mockUsageData.rateLimitPer5Min} (5min)`}
          trend={mockUsageData.callsInLast5Min / mockUsageData.rateLimitPer5Min > 0.8 ? 'down' : undefined}
          color="#F59E0B"
          language={language}
        />
        <StatCard
          icon={<Bot size={20} />}
          label="活跃天数"
          labelEn="Active Days"
          value={mockUsageData.activeDays.toString()}
          subValue={language === 'zh' ? '本月' : 'This month'}
          trend="up"
          color="#8B5CF6"
          language={language}
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="日均消耗"
          labelEn="Daily Average"
          value={`$${(mockUsageData.totalCost / mockUsageData.activeDays).toFixed(2)}`}
          trend="down"
          color="#EC4899"
          language={language}
        />
      </div>
      
      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }} className="charts-grid">
        {/* Token trend */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={16} style={{ color: '#6366F1' }} />
            {language === 'zh' ? 'Token 消耗趋势' : 'Token Consumption Trend'}
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
            {mockUsageData.periodTokens.map((day, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '100%',
                  height: `${(day.tokens / maxTokens) * 100}%`,
                  minHeight: '4px',
                  background: i === mockUsageData.periodTokens.length - 1 
                    ? 'linear-gradient(180deg, #6366F1, #8B5CF6)' 
                    : 'rgba(99, 102, 241, 0.4)',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.5s ease',
                }} />
                <span style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>{day.date}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Model distribution */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={16} style={{ color: '#8B5CF6' }} />
            {language === 'zh' ? '模型分布' : 'Model Distribution'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mockUsageData.byModel.map((m, i) => {
              const colors = ['#6366F1', '#8B5CF6', '#34D399']
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{m.model}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{m.percentage}%</span>
                  </div>
                  <MiniBar value={m.percentage} max={100} color={colors[i]} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="bottom-grid">
        {/* By Agent */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={16} style={{ color: '#34D399' }} />
            {language === 'zh' ? 'Agent 消耗排行' : 'Agent Usage Ranking'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mockUsageData.byAgent.map((agent, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '10px', 
                      fontWeight: '600', 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '6px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#6366F1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{agent.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {formatNumber(agent.tokens)}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>
                      ${agent.cost.toFixed(2)}
                    </span>
                  </div>
                </div>
                <MiniBar value={agent.tokens} max={maxAgentTokens} color="#34D399" />
              </div>
            ))}
          </div>
        </div>
        
        {/* By Project */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderKanban size={16} style={{ color: '#F59E0B' }} />
            {language === 'zh' ? '项目消耗排行' : 'Project Usage Ranking'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mockUsageData.byProject.map((project, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '10px', 
                      fontWeight: '600', 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '6px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#F59E0B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{project.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                      {project.tasks} {language === 'zh' ? '任务' : 'tasks'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {formatNumber(project.tokens)}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>
                      ${project.cost.toFixed(2)}
                    </span>
                  </div>
                </div>
                <MiniBar value={project.tokens} max={maxProjectTokens} color="#F59E0B" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .charts-grid {
            grid-template-columns: 1fr !important;
          }
          .bottom-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
