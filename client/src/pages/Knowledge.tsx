import { useState } from 'react'
import { 
  Search, BookOpen, Star, Users, Plus, ChevronRight, 
  Code, Palette, LineChart, Settings, Shield, Zap,
  CheckCircle, ExternalLink, Clock, TrendingUp, Filter,
  Edit2, Eye, Bookmark, BookmarkCheck
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

// Job knowledge model
interface JobKnowledge {
  id: string
  title: string
  titleEn: string
  category: 'engineering' | 'product' | 'design' | 'operations'
  summary: string
  summaryZh: string
  capabilities: string[]       // 核心能力
  tools: { name: string; link?: string }[]
  bestPractices: string[]
  completeness: number          // 完善度 0-100
  qualityScore: number          // 质量评分 0-5
  subscribers: number           // 订阅数
  lastUpdatedBy: string
  updatedAt: string
  tags: string[]
}

// Category config
const categoryConfig = {
  engineering: { label: '工程', labelEn: 'Engineering', color: '#3B82F6', icon: Code },
  product: { label: '产品', labelEn: 'Product', color: '#8B5CF6', icon: LineChart },
  design: { label: '设计', labelEn: 'Design', color: '#EC4899', icon: Palette },
  operations: { label: '运营', labelEn: 'Operations', color: '#F59E0B', icon: Settings },
}

// Mock data - discovered jobs
const mockJobs: JobKnowledge[] = [] // No mock data
  {
    id: 'job-1',
    title: '前端开发工程师',
    titleEn: 'Frontend Engineer',
    category: 'engineering',
    summary: '负责 Web 前端开发，构建用户界面和交互体验',
    summaryZh: '负责Web前端开发，构建用户界面和交互体验',
    capabilities: ['React 18+', 'TypeScript', 'Tailwind CSS', '性能优化', '组件化开发'],
    tools: [
      { name: 'React', link: 'https://react.dev' },
      { name: 'TypeScript', link: 'https://typescriptlang.org' },
      { name: 'Vite', link: 'https://vitejs.dev' },
    ],
    bestPractices: ['组件单一职责', '状态管理规范', 'Git 提交规范', '代码审查流程'],
    completeness: 85,
    qualityScore: 4.5,
    subscribers: 128,
    lastUpdatedBy: '张三',
    updatedAt: '2026-03-20',
    tags: ['Frontend', 'React', 'TypeScript'],
  },
  {
    id: 'job-2',
    title: '后端开发工程师',
    titleEn: 'Backend Engineer',
    category: 'engineering',
    summary: '负责 API 设计、数据库开发、服务端逻辑',
    summaryZh: '负责API设计、数据库开发、服务端逻辑',
    capabilities: ['Node.js', 'Python', 'PostgreSQL', 'Redis', 'API 设计', '微服务'],
    tools: [
      { name: 'Node.js', link: 'https://nodejs.org' },
      { name: 'Express', link: 'https://expressjs.com' },
      { name: 'PostgreSQL', link: 'https://postgresql.org' },
    ],
    bestPractices: ['RESTful 规范', '数据库索引优化', '日志规范', '接口文档化'],
    completeness: 78,
    qualityScore: 4.2,
    subscribers: 156,
    lastUpdatedBy: '李四',
    updatedAt: '2026-03-18',
    tags: ['Backend', 'Node.js', 'Database'],
  },
  {
    id: 'job-3',
    title: '测试工程师',
    titleEn: 'QA Engineer',
    category: 'engineering',
    summary: '负责质量保障、测试自动化、缺陷追踪',
    summaryZh: '负责质量保障、测试自动化、缺陷追踪',
    capabilities: ['测试用例设计', 'Selenium', 'Playwright', 'Cypress', '持续集成'],
    tools: [
      { name: 'Playwright', link: 'https://playwright.dev' },
      { name: 'Cypress', link: 'https://cypress.io' },
      { name: 'Jest', link: 'https://jestjs.io' },
    ],
    bestPractices: ['测试金字塔', 'BDD 规范', '回归测试自动化', '性能测试'],
    completeness: 65,
    qualityScore: 3.8,
    subscribers: 45,
    lastUpdatedBy: '王五',
    updatedAt: '2026-03-15',
    tags: ['QA', 'Testing', 'Automation'],
  },
  {
    id: 'job-4',
    title: '产品经理',
    titleEn: 'Product Manager',
    category: 'product',
    summary: '负责产品规划、需求管理、跨团队协调',
    summaryZh: '负责产品规划、需求管理、跨团队协调',
    capabilities: ['需求分析', 'PRD 撰写', '数据分析', '用户研究', '项目管理'],
    tools: [
      { name: 'Figma', link: 'https://figma.com' },
      { name: 'Notion', link: 'https://notion.so' },
      { name: 'Miro', link: 'https://miro.com' },
    ],
    bestPractices: ['SMART 目标', '用户故事地图', 'KPI 定义', '迭代回顾'],
    completeness: 72,
    qualityScore: 4.0,
    subscribers: 89,
    lastUpdatedBy: '赵六',
    updatedAt: '2026-03-22',
    tags: ['PM', 'Product', 'Management'],
  },
  {
    id: 'job-5',
    title: 'UI/UX 设计师',
    titleEn: 'UI/UX Designer',
    category: 'design',
    summary: '负责界面设计、用户体验优化、设计系统维护',
    summaryZh: '负责界面设计、用户体验优化、设计系统维护',
    capabilities: ['Figma', 'UI 设计', 'UX 研究', '设计系统', '原型制作'],
    tools: [
      { name: 'Figma', link: 'https://figma.com' },
      { name: 'Framer', link: 'https://framer.com' },
    ],
    bestPractices: ['原子设计', '设计 token', '无障碍设计', '响应式布局'],
    completeness: 58,
    qualityScore: 4.3,
    subscribers: 67,
    lastUpdatedBy: '钱七',
    updatedAt: '2026-03-10',
    tags: ['Design', 'UI', 'UX'],
  },
  {
    id: 'job-6',
    title: '运维工程师',
    titleEn: 'DevOps Engineer',
    category: 'operations',
    summary: '负责 CI/CD 流水线、容器化、监控告警',
    summaryZh: '负责CI/CD流水线、容器化、监控告警',
    capabilities: ['Docker', 'Kubernetes', 'CI/CD', 'Terraform', '监控'],
    tools: [
      { name: 'Docker', link: 'https://docker.com' },
      { name: 'Kubernetes', link: 'https://kubernetes.io' },
      { name: 'GitHub Actions', link: 'https://github.com/features/actions' },
    ],
    bestPractices: ['基础设施即代码', 'GitOps', '监控告警规范', '灾备方案'],
    completeness: 70,
    qualityScore: 4.1,
    subscribers: 73,
    lastUpdatedBy: '孙八',
    updatedAt: '2026-03-19',
    tags: ['DevOps', 'Docker', 'Kubernetes'],
  },
]

// Completeness bar
function CompletenessBar({ value }: { value: number }) {
  const color = value > 70 ? '#34D399' : value > 40 ? '#FBBF24' : '#F87171'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: '11px', fontWeight: '600', color, minWidth: 32 }}>{value}%</span>
    </div>
  )
}

// Quality stars
function QualityStars({ score }: { score: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={12}
          style={{ color: i <= Math.round(score) ? '#FBBF24' : 'var(--bg-tertiary)', fill: i <= Math.round(score) ? '#FBBF24' : 'transparent' }}
        />
      ))}
      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: 4 }}>
        {score.toFixed(1)}
      </span>
    </div>
  )
}

// Job card
function JobCard({ job, onSubscribe, onView, isSubscribed, language }: {
  job: JobKnowledge
  onSubscribe: (id: string) => void
  onView: (job: JobKnowledge) => void
  isSubscribed: boolean
  language: 'en' | 'zh'
}) {
  const catCfg = categoryConfig[job.category]
  const CategoryIcon = catCfg.icon
  
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '20px',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      className="job-card"
      onClick={() => onView(job)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '12px',
            background: `${catCfg.color}15`,
            border: `1px solid ${catCfg.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CategoryIcon size={20} style={{ color: catCfg.color }} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              {language === 'zh' ? job.title : job.titleEn}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>
              {language === 'zh' ? job.summaryZh : job.summary}
            </p>
          </div>
        </div>
        
        <button
          onClick={(e) => { e.stopPropagation(); onSubscribe(job.id) }}
          style={{
            width: 36, height: 36, borderRadius: '10px',
            background: isSubscribed ? 'rgba(52, 211, 153, 0.1)' : 'var(--bg-tertiary)',
            border: isSubscribed ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {isSubscribed ? (
            <BookmarkCheck size={16} style={{ color: '#34D399' }} />
          ) : (
            <Bookmark size={16} style={{ color: 'var(--text-tertiary)' }} />
          )}
        </button>
      </div>
      
      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
        {job.tags.slice(0, 3).map(tag => (
          <span key={tag} style={{
            fontSize: '10px',
            padding: '3px 8px',
            borderRadius: '6px',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-tertiary)',
          }}>
            {tag}
          </span>
        ))}
      </div>
      
      {/* Capabilities */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
          {language === 'zh' ? '核心能力' : 'Capabilities'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {job.capabilities.slice(0, 4).map(cap => (
            <span key={cap} style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '4px',
              background: `${catCfg.color}10`,
              color: catCfg.color,
            }}>
              {cap}
            </span>
          ))}
        </div>
      </div>
      
      {/* Stats */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
              {language === 'zh' ? '完善度' : 'Complete'}
            </span>
            <CompletenessBar value={job.completeness} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <QualityStars score={job.qualityScore} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={12} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{job.subscribers}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Job detail modal
function JobDetailModal({ job, onClose, onSubscribe, isSubscribed, language }: {
  job: JobKnowledge
  onClose: () => void
  onSubscribe: (id: string) => void
  isSubscribed: boolean
  language: 'en' | 'zh'
}) {
  const catCfg = categoryConfig[job.category]
  const CategoryIcon = catCfg.icon
  
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '85vh',
          overflow: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '14px',
                background: `${catCfg.color}15`,
                border: `1px solid ${catCfg.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CategoryIcon size={24} style={{ color: catCfg.color }} />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  {language === 'zh' ? job.title : job.titleEn}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  {language === 'zh' ? job.summaryZh : job.summary}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: '10px',
                background: 'var(--bg-tertiary)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
          
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              onClick={() => onSubscribe(job.id)}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                background: isSubscribed ? 'rgba(52, 211, 153, 0.1)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                border: isSubscribed ? '1px solid rgba(52, 211, 153, 0.3)' : 'none',
                color: isSubscribed ? '#34D399' : 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isSubscribed ? (
                <>
                  <CheckCircle size={16} />
                  {language === 'zh' ? '已订阅' : 'Subscribed'}
                </>
              ) : (
                <>
                  <Plus size={16} />
                  {language === 'zh' ? '订阅此职业' : 'Subscribe'}
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: catCfg.color }}>
                {job.completeness}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                {language === 'zh' ? '完善度' : 'Completeness'}
              </div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#FBBF24' }}>
                {job.qualityScore.toFixed(1)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                {language === 'zh' ? '质量评分' : 'Quality'}
              </div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#8B5CF6' }}>
                {job.subscribers}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                {language === 'zh' ? '订阅者' : 'Subscribers'}
              </div>
            </div>
          </div>
          
          {/* Capabilities */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              {language === 'zh' ? '核心能力' : 'Core Capabilities'}
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {job.capabilities.map(cap => (
                <span key={cap} style={{
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: `${catCfg.color}10`,
                  color: catCfg.color,
                  border: `1px solid ${catCfg.color}20`,
                }}>
                  {cap}
                </span>
              ))}
            </div>
          </div>
          
          {/* Tools */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              {language === 'zh' ? '常用工具' : 'Tools'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {job.tools.map((tool, i) => (
                <a
                  key={i}
                  href={tool.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    fontSize: '13px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                >
                  {tool.name}
                  <ExternalLink size={14} style={{ color: 'var(--text-tertiary)' }} />
                </a>
              ))}
            </div>
          </div>
          
          {/* Best practices */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              {language === 'zh' ? '最佳实践' : 'Best Practices'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {job.bestPractices.map((practice, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-tertiary)',
                }}>
                  <CheckCircle size={14} style={{ color: '#34D399', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{practice}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-tertiary)' }}>
            <span>{language === 'zh' ? '最后更新' : 'Last updated'}: {job.lastUpdatedBy}</span>
            <span>{job.updatedAt}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Tab config
const tabs = [
  { id: 'discover', label: '发现', labelEn: 'Discover', icon: BookOpen },
  { id: 'subscriptions', label: '我的订阅', labelEn: 'My Subscriptions', icon: Star },
  { id: 'contribute', label: '贡献', labelEn: 'Contribute', icon: Plus },
]

export default function Knowledge() {
  const { language } = useLanguage()
  const [activeTab, setActiveTab] = useState<'discover' | 'subscriptions' | 'contribute'>('discover')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedJob, setSelectedJob] = useState<JobKnowledge | null>(null)
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(new Set(['job-1', 'job-4']))
  
  // Filter jobs
  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.titleEn.toLowerCase().includes(search.toLowerCase()) ||
      job.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory
    return matchesSearch && matchesCategory
  })
  
  const subscribedJobs = mockJobs.filter(job => subscribedIds.has(job.id))
  
  const handleSubscribe = (id: string) => {
    setSubscribedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }
  
  const getTabJobs = () => {
    switch (activeTab) {
      case 'subscriptions':
        return subscribedJobs
      case 'discover':
      default:
        return filteredJobs
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
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
          {language === 'zh' ? '知识库' : 'Knowledge Base'}
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
          {language === 'zh' ? '探索、订阅、贡献职业能力' : 'Discover, subscribe, and contribute professional capabilities'}
        </p>
      </div>
      
      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        background: 'var(--bg-secondary)',
        padding: '6px',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        width: 'fit-content',
      }}>
        {tabs.map(tab => {
          const TabIcon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                background: isActive ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <TabIcon size={16} />
              {language === 'zh' ? tab.label : tab.labelEn}
              {tab.id === 'subscriptions' && subscribedIds.size > 0 && (
                <span style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(52, 211, 153, 0.2)',
                  color: isActive ? 'white' : '#34D399',
                }}>
                  {subscribedIds.size}
                </span>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{
          flex: 1,
          minWidth: 240,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '10px 16px',
          border: '1px solid var(--border)',
        }}>
          <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={language === 'zh' ? '搜索职业、能力或工具...' : 'Search jobs, skills, or tools...'}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
        
        {/* Category filters */}
        {activeTab === 'discover' && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: selectedCategory === 'all' ? '1px solid #6366F1' : '1px solid var(--border)',
                background: selectedCategory === 'all' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
                color: selectedCategory === 'all' ? '#6366F1' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              {language === 'zh' ? '全部' : 'All'}
            </button>
            {(Object.keys(categoryConfig) as Array<keyof typeof categoryConfig>).map(cat => {
              const cfg = categoryConfig[cat]
              const CatIcon = cfg.icon
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: selectedCategory === cat ? `1px solid ${cfg.color}` : '1px solid var(--border)',
                    background: selectedCategory === cat ? `${cfg.color}10` : 'var(--bg-secondary)',
                    color: selectedCategory === cat ? cfg.color : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  <CatIcon size={14} />
                  {language === 'zh' ? cfg.label : cfg.labelEn}
                </button>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'discover' && (
          <>
            {filteredJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 20px' }}>
                <BookOpen size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
                <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {language === 'zh' ? '未找到匹配的职业' : 'No matching jobs found'}
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                  {language === 'zh' ? '尝试其他关键词或筛选条件' : 'Try different keywords or filters'}
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '16px',
              }}>
                {filteredJobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onSubscribe={handleSubscribe}
                    onView={setSelectedJob}
                    isSubscribed={subscribedIds.has(job.id)}
                    language={language}
                  />
                ))}
              </div>
            )}
          </>
        )}
        
        {activeTab === 'subscriptions' && (
          <>
            {subscribedJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 20px' }}>
                <Star size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
                <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {language === 'zh' ? '暂无订阅' : 'No subscriptions yet'}
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                  {language === 'zh' ? '去发现页订阅感兴趣的职业技能' : 'Go to Discover to subscribe to jobs'}
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '16px',
              }}>
                {subscribedJobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onSubscribe={handleSubscribe}
                    onView={setSelectedJob}
                    isSubscribed={true}
                    language={language}
                  />
                ))}
              </div>
            )}
          </>
        )}
        
        {activeTab === 'contribute' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 20px',
            textAlign: 'center',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '24px',
            }}>
              <Plus size={32} style={{ color: '#8B5CF6' }} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
              {language === 'zh' ? '贡献职业知识' : 'Contribute Job Knowledge'}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', maxWidth: 400, lineHeight: 1.6 }}>
              {language === 'zh' 
                ? '帮助完善团队的职业能力知识库。分享你的经验，贡献最佳实践，让团队更强大。'
                : 'Help improve the team\'s professional knowledge base. Share your experience and contribute best practices.'}
            </p>
            <button
              style={{
                marginTop: '24px',
                padding: '14px 28px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                border: 'none',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {language === 'zh' ? '创建新职业' : 'Create New Job'}
            </button>
          </div>
        )}
      </div>
      
      {/* Job detail modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onSubscribe={handleSubscribe}
          isSubscribed={subscribedIds.has(selectedJob.id)}
          language={language}
        />
      )}
      
      <style>{`
        .job-card:hover {
          border-color: var(--border-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  )
}
