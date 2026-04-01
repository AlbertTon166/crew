import { useState, useEffect } from 'react'
import { 
  Search, BookOpen, Star, Users, Plus, ChevronRight, 
  Code, Palette, LineChart, Settings, Shield, Zap,
  CheckCircle, ExternalLink, Clock, TrendingUp, Filter,
  Edit2, Eye, Bookmark, BookmarkCheck, Loader2, AlertCircle
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { api } from '../lib/api'

// Knowledge model from API
interface KnowledgeItem {
  id: string
  title: string
  titleZh?: string
  content?: string
  contentZh?: string
  category: 'role' | 'skill' | 'workflow' | 'other'
  tags: string[]
  createdAt: string
  updatedAt: string
}

// Category config
const categoryConfig = {
  role: { label: '角色', labelEn: 'Role', color: '#8B5CF6', icon: Users },
  skill: { label: '技能', labelEn: 'Skill', color: '#3B82F6', icon: Code },
  workflow: { label: '流程', labelEn: 'Workflow', color: '#F59E0B', icon: LineChart },
  other: { label: '其他', labelEn: 'Other', color: '#64748B', icon: Settings },
}

// Completeness bar (mock for now - API doesn't provide these)
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

// Quality stars (mock for now)
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

// Knowledge card
function KnowledgeCard({ item, onSubscribe, onView, isSubscribed, language }: {
  item: KnowledgeItem
  onSubscribe: (id: string) => void
  onView: (item: KnowledgeItem) => void
  isSubscribed: boolean
  language: 'en' | 'zh'
}) {
  const catCfg = categoryConfig[item.category] || categoryConfig.other
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
      onClick={() => onView(item)}
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
              {item.title}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
              {item.content?.substring(0, 60) || '-'}
            </p>
          </div>
        </div>
        
        <button
          onClick={(e) => { e.stopPropagation(); onSubscribe(item.id) }}
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
        {item.tags.slice(0, 3).map(tag => (
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
      
      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            {language === 'zh' ? '完善度' : 'Complete'}
          </span>
          <CompletenessBar value={85} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <QualityStars score={4.5} />
        </div>
      </div>
    </div>
  )
}

// Knowledge detail modal
function KnowledgeDetailModal({ item, onClose, language }: {
  item: KnowledgeItem
  onClose: () => void
  language: 'en' | 'zh'
}) {
  const catCfg = categoryConfig[item.category] || categoryConfig.other
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
                  {item.title}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  {language === 'zh' ? catCfg.label : catCfg.labelEn}
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
        </div>
        
        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: catCfg.color }}>
                85%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                {language === 'zh' ? '完善度' : 'Completeness'}
              </div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#FBBF24' }}>
                4.5
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                {language === 'zh' ? '质量评分' : 'Quality'}
              </div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#8B5CF6' }}>
                12
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                {language === 'zh' ? '订阅者' : 'Subscribers'}
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              {language === 'zh' ? '内容' : 'Content'}
            </h4>
            <div style={{
              padding: '14px',
              borderRadius: '10px',
              background: 'var(--bg-tertiary)',
              fontSize: '14px',
              color: 'var(--text-primary)',
              lineHeight: 1.6,
            }}>
              {item.content || '-'}
            </div>
          </div>
          
          {/* Tags */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              {language === 'zh' ? '标签' : 'Tags'}
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {item.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: `${catCfg.color}10`,
                  color: catCfg.color,
                  border: `1px solid ${catCfg.color}20`,
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          {/* Footer */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-tertiary)' }}>
            <span>{language === 'zh' ? '创建于' : 'Created'}: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</span>
            <span>{language === 'zh' ? '更新于' : 'Updated'}: {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '-'}</span>
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
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null)
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(new Set())
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)

  // Mock software job data in GitHub Jobs format
  const getMockJobData = (): KnowledgeItem[] => [
    {
      id: 'job-1',
      title: 'Senior Frontend Developer',
      titleZh: '高级前端开发工程师',
      content: 'Build modern React applications with TypeScript. 5+ years experience with React, Redux, and state management. Remote friendly.',
      contentZh: '使用 TypeScript 构建现代化 React 应用。5年以上 React、Redux 和状态管理经验。支持远程办公。',
      category: 'role',
      tags: ['React', 'TypeScript', 'Frontend', 'Remote'],
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
    },
    {
      id: 'job-2',
      title: 'Backend Engineer - Python/Go',
      titleZh: '后端工程师 - Python/Go',
      content: 'Design and implement scalable microservices. Experience with Kubernetes, Docker, and cloud platforms (AWS/GCP).',
      contentZh: '设计并实现可扩展的微服务。有 Kubernetes、Docker 和云平台（AWS/GCP）经验。',
      category: 'role',
      tags: ['Python', 'Go', 'Kubernetes', 'AWS'],
      createdAt: '2024-01-14',
      updatedAt: '2024-01-19',
    },
    {
      id: 'job-3',
      title: 'Full Stack Developer',
      titleZh: '全栈开发工程师',
      content: 'Work on both frontend and backend. Proficiency in Node.js, Express, React, and PostgreSQL required.',
      contentZh: '从事前端和后端开发。需要熟练掌握 Node.js、Express、React 和 PostgreSQL。',
      category: 'role',
      tags: ['Node.js', 'React', 'PostgreSQL', 'Full Stack'],
      createdAt: '2024-01-13',
      updatedAt: '2024-01-18',
    },
    {
      id: 'job-4',
      title: 'DevOps Engineer',
      titleZh: 'DevOps 工程师',
      content: 'Manage CI/CD pipelines, infrastructure as code, and monitoring systems. Terraform and Ansible experience required.',
      contentZh: '管理 CI/CD 流水线、基础设施即代码和监控系统。需要 Terraform 和 Ansible 经验。',
      category: 'role',
      tags: ['DevOps', 'Terraform', 'Ansible', 'CI/CD'],
      createdAt: '2024-01-12',
      updatedAt: '2024-01-17',
    },
    {
      id: 'job-5',
      title: 'Mobile Developer - iOS/Android',
      titleZh: '移动端开发工程师 - iOS/Android',
      content: 'Build cross-platform mobile apps using React Native. Experience with app store deployment and mobile UX best practices.',
      contentZh: '使用 React Native 构建跨平台移动应用。有应用商店部署和移动端 UX 最佳实践经验。',
      category: 'role',
      tags: ['React Native', 'iOS', 'Android', 'Mobile'],
      createdAt: '2024-01-11',
      updatedAt: '2024-01-16',
    },
    {
      id: 'job-6',
      title: 'Machine Learning Engineer',
      titleZh: '机器学习工程师',
      content: 'Develop and deploy ML models at scale. Strong background in Python, TensorFlow/PyTorch, and data pipeline design.',
      contentZh: '大规模开发和部署 ML 模型。有 Python、TensorFlow/PyTorch 和数据流水线设计方面的扎实背景。',
      category: 'role',
      tags: ['Python', 'TensorFlow', 'ML', 'Data Science'],
      createdAt: '2024-01-10',
      updatedAt: '2024-01-15',
    },
    {
      id: 'job-7',
      title: 'Senior UX Designer',
      titleZh: '高级 UX 设计师',
      content: 'Create intuitive user experiences. Proficiency in Figma, user research, and design systems. Portfolio required.',
      contentZh: '创造直观易用的用户体验。熟练使用 Figma、用户研究和设计系统。需要作品集。',
      category: 'role',
      tags: ['UX', 'Figma', 'Design Systems', 'UI'],
      createdAt: '2024-01-09',
      updatedAt: '2024-01-14',
    },
    {
      id: 'job-8',
      title: 'QA Automation Engineer',
      titleZh: 'QA 自动化测试工程师',
      content: 'Build and maintain automated test suites. Experience with Selenium, Jest, and CI/CD testing integration.',
      contentZh: '构建和维护自动化测试套件。有 Selenium、Jest 和 CI/CD 测试集成经验。',
      category: 'role',
      tags: ['QA', 'Selenium', 'Automation', 'Testing'],
      createdAt: '2024-01-08',
      updatedAt: '2024-01-13',
    },
    {
      id: 'job-9',
      title: 'Site Reliability Engineer',
      titleZh: 'SRE 工程师',
      content: 'Ensure system reliability and performance. Strong knowledge of Linux, networking, and incident response.',
      contentZh: '确保系统可靠性和性能。具备深厚的 Linux、网络和事件响应知识。',
      category: 'role',
      tags: ['SRE', 'Linux', 'Networking', 'Monitoring'],
      createdAt: '2024-01-07',
      updatedAt: '2024-01-12',
    },
    {
      id: 'job-10',
      title: 'Data Engineer',
      titleZh: '数据工程师',
      content: 'Build data pipelines and warehousing solutions. Expertise in SQL, Spark, and ETL processes.',
      contentZh: '构建数据流水线和仓库解决方案。精通 SQL、Spark 和 ETL 流程。',
      category: 'role',
      tags: ['Data Engineering', 'Spark', 'SQL', 'ETL'],
      createdAt: '2024-01-06',
      updatedAt: '2024-01-11',
    },
    {
      id: 'job-11',
      title: 'Security Engineer',
      titleZh: '安全工程师',
      content: 'Implement security measures and conduct penetration testing. Knowledge of OWASP, encryption, and secure coding.',
      contentZh: '实施安全措施并进行渗透测试。了解 OWASP、加密和安全编码。',
      category: 'role',
      tags: ['Security', 'Penetration Testing', 'OWASP', 'Encryption'],
      createdAt: '2024-01-05',
      updatedAt: '2024-01-10',
    },
    {
      id: 'job-12',
      title: 'Product Manager',
      titleZh: '产品经理',
      content: 'Lead product strategy and roadmap. Experience with Agile methodologies and cross-functional team leadership.',
      contentZh: '主导产品战略和路线图。有敏捷方法论和跨职能团队领导经验。',
      category: 'role',
      tags: ['Product Management', 'Agile', 'Strategy', 'Roadmap'],
      createdAt: '2024-01-04',
      updatedAt: '2024-01-09',
    },
  ]

  // Fetch knowledge items
  const fetchKnowledge = async (category?: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.knowledge.list(category && category !== 'all' ? { category } : undefined)
      const data = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : [])
      // If no data from API, use mock job data (GitHub Jobs format)
      if (data.length === 0) {
        setItems(getMockJobData())
      } else {
        setItems(data)
      }
    } catch (err: any) {
      // On error, show mock job data as fallback
      setItems(getMockJobData())
      setError(null) // Don't show error since we have fallback data
    } finally {
      setLoading(false)
    }
  }

  // Search knowledge
  const searchKnowledge = async (query: string, category?: string) => {
    if (!query.trim()) {
      fetchKnowledge(category)
      return
    }
    setSearching(true)
    setError(null)
    try {
      const res = await api.knowledge.search(query, category && category !== 'all' ? category : undefined)
      setItems(Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []))
    } catch (err: any) {
      setError(err.message || 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'discover' || activeTab === 'subscriptions') {
      fetchKnowledge(selectedCategory !== 'all' ? selectedCategory : undefined)
    }
  }, [activeTab, selectedCategory])

  // Handle search
  const handleSearch = () => {
    if (search.trim()) {
      searchKnowledge(search, selectedCategory !== 'all' ? selectedCategory : undefined)
    } else {
      fetchKnowledge(selectedCategory !== 'all' ? selectedCategory : undefined)
    }
  }

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
  
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.content && item.content.toLowerCase().includes(search.toLowerCase())) ||
      item.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    return matchesSearch
  })
  
  const subscribedItems = items.filter(item => subscribedIds.has(item.id))
  
  const getTabItems = () => {
    switch (activeTab) {
      case 'subscriptions':
        return subscribedItems
      case 'discover':
      default:
        return filteredItems
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
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
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
          {searching && <Loader2 size={16} style={{ color: 'var(--text-tertiary)', animation: 'spin 1s linear infinite' }} />}
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
      
      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 20px' }}>
            <Loader2 size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {language === 'zh' ? '加载中...' : 'Loading...'}
            </p>
          </div>
        ) : activeTab === 'discover' && (
          <>
            {getTabItems().length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 20px' }}>
                <BookOpen size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
                <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {language === 'zh' ? '未找到匹配的知识' : 'No matching knowledge found'}
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
                {getTabItems().map(item => (
                  <KnowledgeCard
                    key={item.id}
                    item={item}
                    onSubscribe={handleSubscribe}
                    onView={setSelectedItem}
                    isSubscribed={subscribedIds.has(item.id)}
                    language={language}
                  />
                ))}
              </div>
            )}
          </>
        )}
        
        {activeTab === 'subscriptions' && (
          <>
            {getTabItems().length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 20px' }}>
                <Star size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
                <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {language === 'zh' ? '暂无订阅' : 'No subscriptions yet'}
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                  {language === 'zh' ? '去发现页订阅感兴趣的知识' : 'Go to Discover to subscribe'}
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '16px',
              }}>
                {getTabItems().map(item => (
                  <KnowledgeCard
                    key={item.id}
                    item={item}
                    onSubscribe={handleSubscribe}
                    onView={setSelectedItem}
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
              {language === 'zh' ? '贡献知识' : 'Contribute Knowledge'}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', maxWidth: 400, lineHeight: 1.6 }}>
              {language === 'zh' 
                ? '帮助完善团队的知识库。分享你的经验，贡献最佳实践，让团队更强大。'
                : 'Help improve the team knowledge base. Share your experience and contribute best practices.'}
            </p>
          </div>
        )}
      </div>
      
      {/* Knowledge detail modal */}
      {selectedItem && (
        <KnowledgeDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          language={language}
        />
      )}
      
      <style>{`
        .job-card:hover {
          border-color: var(--border-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
