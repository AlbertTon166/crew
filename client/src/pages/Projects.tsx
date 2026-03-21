import { useState } from 'react'
import { 
  Plus, Search, FolderKanban, Clock, 
  CheckCircle, Loader2, X, Bot, Users, ArrowRight, Coins,
  Settings, MessageSquare, Zap, Code, TestTube, Shield, FileText, ChevronDown, Lock, RotateCw, WifiOff
} from 'lucide-react'
import { useDashboardStore } from '../stores/dashboardStore'
import { useLanguage } from '../context/LanguageContext'
import { useDeployMode } from '../context/DeployModeContext'

// Agent role recommendations
const agentRoles = [
  { id: 'planner', label: '规划智能体', labelEn: 'Planner', icon: MessageSquare, color: '#8B5CF6', desc: '分析需求，分解任务' },
  { id: 'frontend', label: '前端开发', labelEn: 'Frontend Dev', icon: Code, color: '#3B82F6', desc: '负责界面和交互' },
  { id: 'backend', label: '后端开发', labelEn: 'Backend Dev', icon: Zap, color: '#10B981', desc: '负责API和数据库' },
  { id: 'reviewer', label: '审核智能体', labelEn: 'Reviewer', icon: Shield, color: '#F59E0B', desc: '代码审查和质量把控' },
  { id: 'tester', label: '测试智能体', labelEn: 'Tester', icon: TestTube, color: '#EF4444', desc: '自动化测试和Bug追踪' },
]

// Notification channels
const notifyChannels = [
  { id: 'email', label: '邮箱', labelEn: 'Email', icon: '📧' },
  { id: 'feishu', label: '飞书', labelEn: 'Feishu', icon: '📱' },
  { id: 'wechat', label: '微信', labelEn: 'WeChat', icon: '💬' },
  { id: 'dingtalk', label: '钉钉', labelEn: 'DingTalk', icon: '🔔' },
]

// API Documentation
const apiDoc = {
  title: '私有API文档',
  titleEn: 'Private API Documentation',
  baseUrl: 'https://api.yourdomain.com/v1',
  auth: 'Bearer Token',
  endpoints: [
    { method: 'GET', path: '/projects', desc: '获取项目列表' },
    { method: 'POST', path: '/projects', desc: '创建新项目' },
    { method: 'GET', path: '/agents', desc: '获取智能体列表' },
    { method: 'POST', path: '/agents/:id/assign', desc: '分配智能体到项目' },
    { method: 'GET', path: '/metrics', desc: '获取系统指标' },
  ]
}

const statusConfigEn: Record<string, { label: string; class: string; color: string }> = {
  pending: { label: 'Pending', class: 'badge badge-pending', color: '#64748B' },
  evaluating: { label: 'Evaluating', class: 'badge badge-evaluating', color: '#8B5CF6' },
  pending_dev: { label: 'Pending Dev', class: 'badge badge-pending-dev', color: '#FBBF24' },
  in_progress: { label: 'In Progress', class: 'badge badge-active', color: '#3B82F6' },
  subtask_pending: { label: 'Decomposing', class: 'badge badge-pending', color: '#64748B' },
  needs_review: { label: 'Needs Review', class: 'badge badge-pending', color: '#64748B' },
  review_passed: { label: 'Review Passed', class: 'badge badge-completed', color: '#34D399' },
  review_failed: { label: 'Review Failed', class: 'badge badge-error', color: '#F87171' },
  completed: { label: 'Completed', class: 'badge badge-completed', color: '#34D399' },
  failed: { label: 'Failed', class: 'badge badge-error', color: '#F87171' },
  deleted: { label: 'Deleted', class: 'badge badge-deleted', color: '#94A3B8' },
}

const statusConfigZh: Record<string, { label: string; class: string; color: string }> = {
  pending: { label: '待处理', class: 'badge badge-pending', color: '#64748B' },
  evaluating: { label: '待评估', class: 'badge badge-evaluating', color: '#8B5CF6' },
  pending_dev: { label: '待开发', class: 'badge badge-pending-dev', color: '#FBBF24' },
  in_progress: { label: '进行中', class: 'badge badge-active', color: '#3B82F6' },
  subtask_pending: { label: '分解中', class: 'badge badge-pending', color: '#64748B' },
  needs_review: { label: '待审核', class: 'badge badge-pending', color: '#64748B' },
  review_passed: { label: '审核通过', class: 'badge badge-completed', color: '#34D399' },
  review_failed: { label: '审核失败', class: 'badge badge-error', color: '#F87171' },
  completed: { label: '已完成', class: 'badge badge-completed', color: '#34D399' },
  failed: { label: '失败', class: 'badge badge-error', color: '#F87171' },
  deleted: { label: '已删除', class: 'badge badge-deleted', color: '#94A3B8' },
}

export default function Projects() {
  const { language } = useLanguage()
  const { projects, updateProject } = useDashboardStore()
  const { isConnected } = useDeployMode()
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  
  // Agent Assignment Modal
  const [showAgentModal, setShowAgentModal] = useState(false)
  const [selectedProjectForAgent, setSelectedProjectForAgent] = useState<any>(null)
  const [agentCount, setAgentCount] = useState(2)
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['planner', 'frontend', 'backend'])
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  // Delete Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)

  // Reconstruct Confirmation Modal
  const [showReconstructModal, setShowReconstructModal] = useState(false)
  const [projectToReconstruct, setProjectToReconstruct] = useState<any>(null)

  // Project Build Documentation
  const _projectDocs: Record<string, { title: string; titleZh: string; content: string; contentZh: string }> = {
    '1': {
      title: 'E-commerce Platform - Project Specification',
      titleZh: '电商平台 - 项目规格说明书',
      content: `# Project Overview\n\nA full-stack e-commerce platform with user authentication, product management, and payment processing.\n\n## Core Features\n\n1. **User Authentication**\n   - Phone and email registration\n   - Social login (Google, Facebook)\n   - Two-factor authentication\n\n2. **Product Management**\n   - Product catalog with categories\n   - Search and filtering\n   - Inventory tracking\n\n3. **Shopping Cart**\n   - Persistent cart\n   - Wishlist functionality\n   - Price calculation\n\n4. **Payment Processing**\n   - Stripe integration\n   - Multiple payment methods\n   - Invoice generation\n\n## Technical Stack\n\n- Frontend: React 18, TypeScript, TailwindCSS\n- Backend: Node.js, Express, PostgreSQL\n- Cache: Redis\n- Search: Elasticsearch`,
      contentZh: `# 项目概述\n\n一个全栈电商平台，包含用户认证、商品管理和支付处理。\n\n## 核心功能\n\n1. **用户认证**\n   - 手机号和邮箱注册\n   - 社交登录（Google、Facebook）\n   - 双因素认证\n\n2. **商品管理**\n   - 商品目录和分类\n   - 搜索和筛选\n   - 库存跟踪\n\n3. **购物车**\n   - 持久化购物车\n   - 愿望清单功能\n   - 价格计算\n\n4. **支付处理**\n   - Stripe集成\n   - 多种支付方式\n   - 发票生成\n\n## 技术栈\n\n- 前端：React 18、TypeScript、TailwindCSS\n- 后端：Node.js、Express、PostgreSQL\n- 缓存：Redis\n- 搜索：Elasticsearch`
    },
    '2': {
      title: 'Mobile App Redesign - Project Specification',
      titleZh: '移动端改版 - 项目规格说明书',
      content: `# Mobile App Redesign\n\nRedesign the existing mobile application with improved UX...`,
      contentZh: `# 移动端改版\n\n重新设计现有移动应用，改善用户体验...`
    },
    '3': {
      title: 'API Integration - Project Specification',
      titleZh: 'API集成 - 项目规格说明书',
      content: `# Third-party API Integration\n\nIntegrate external APIs for enhanced functionality...`,
      contentZh: `# 第三方API集成\n\n集成外部API以增强功能...`
    },
    '4': {
      title: 'Data Analytics - Project Specification',
      titleZh: '数据分析 - 项目规格说明书',
      content: `# Analytics Dashboard\n\nBuild a comprehensive analytics dashboard...`,
      contentZh: `# 数据分析看板\n\n构建全面的数据分析看板...`
    }
  }

  const getProjectName = (p: any) => language === 'zh' ? (p.nameZh || p.name) : p.name
  const getProjectDesc = (p: any) => language === 'zh' ? (p.descZh || p.description) : (p.description || '')

  const filteredProjects = projects.filter(project => {
    const projName = getProjectName(project)
    const projDesc = getProjectDesc(project)
    const matchesFilter = filter === 'all' || project.status === filter
    const matchesSearch = projName.toLowerCase().includes(search.toLowerCase()) || projDesc.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusConfig = (status: string) => {
    return language === 'zh' ? statusConfigZh[status] || statusConfigZh.pending : statusConfigEn[status] || statusConfigEn.pending
  }

  const getStatusBadge = (status: string) => {
    const config = getStatusConfig(status)
    return <span className={config.class} style={{ background: `${config.color}15`, color: config.color }}>{config.label}</span>
  }

  const _getProjectProgress = (_projectId: string) => {
    return 0
  }

  const formatToken = (token: number) => {
    if (token >= 1000000) return (token / 1000000).toFixed(1) + 'M'
    if (token >= 1000) return (token / 1000).toFixed(0) + 'K'
    return token.toString()
  }

  const filterLabels = {
    all: language === 'zh' ? '全部' : 'All',
    evaluating: language === 'zh' ? '待评估' : 'Evaluating',
    pending_dev: language === 'zh' ? '待开发' : 'Pending Dev',
    in_progress: language === 'zh' ? '进行中' : 'In Progress',
    completed: language === 'zh' ? '已完成' : 'Completed',
    pending: language === 'zh' ? '待处理' : 'Pending',
    deleted: language === 'zh' ? '已删除' : 'Deleted',
  }

  const toggleExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      return next
    })
  }

  const _isEditable = (status: string) => status === 'evaluating' || status === 'pending'

  // Calculate remaining days for a project
  const getRemainingDays = (project: any) => {
    if (!project.dueDate) {
      return { text: language === 'zh' ? '无截止日期' : 'No due date', isOverdue: false, isEmpty: true }
    }
    const now = new Date()
    const due = new Date(project.dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return { text: language === 'zh' ? '已逾期' : 'Overdue', isOverdue: true, days: Math.abs(diffDays), isEmpty: false }
    }
    return { 
      text: language === 'zh' ? `还剩 ${diffDays} 天` : `${diffDays} days left`, 
      isOverdue: false, 
      days: diffDays, 
      isEmpty: false 
    }
  }

  // Handle delete project
  const handleDeleteProject = (projectId: string) => {
    setProjectToDelete(projectId)
    setShowDeleteModal(true)
  }

  const confirmDeleteProject = () => {
    if (projectToDelete) {
      updateProject(projectToDelete, { 
        status: 'deleted',
        deletedAt: new Date().toISOString()
      })
      setShowDeleteModal(false)
      setProjectToDelete(null)
    }
  }

  // Handle reconstruct project
  const handleReconstructProject = (project: any) => {
    setProjectToReconstruct(project)
    setShowReconstructModal(true)
  }

  const confirmReconstructProject = () => {
    if (projectToReconstruct) {
      // Parse current version and increment major
      const currentVersion = projectToReconstruct.version || 'V1.0.0'
      const versionMatch = currentVersion.match(/V?(\d+)\.(\d+)\.(\d+)/)
      let newMajor = 1
      if (versionMatch) {
        newMajor = parseInt(versionMatch[1]) + 1
      }
      const newVersion = `V${newMajor}.0.0`
      
      updateProject(projectToReconstruct.id, {
        status: 'evaluating',
        version: newVersion,
        tasks: [],
        deletedAt: undefined
      })
      setShowReconstructModal(false)
      setProjectToReconstruct(null)
    }
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
            {language === 'zh' ? '项目管理' : 'Projects'}
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            {language === 'zh' ? '管理团队项目与任务' : 'Manage your team projects and tasks'}
          </p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)} 
          className="btn-primary"
          disabled={!isConnected}
          style={{ 
            opacity: isConnected ? 1 : 0.5,
            cursor: isConnected ? 'pointer' : 'not-allowed'
          }}
        >
          <Plus size={18} />
          <span>{language === 'zh' ? '新建项目' : 'New Project'}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} size={18} />
          <input
            type="text"
            placeholder={language === 'zh' ? '搜索项目...' : 'Search projects...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 16px 12px 46px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '14px', color: 'var(--text-primary)', transition: 'all 0.2s' }}
            className="search-input"
          />
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {['all', 'evaluating', 'pending_dev', 'in_progress', 'completed', 'pending', 'deleted'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{ 
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: filter === f ? 'linear-gradient(135deg, var(--primary), var(--accent-violet))' : 'var(--bg-tertiary)',
                color: '#FFFFFF',
                boxShadow: filter === f ? '0 4px 16px var(--primary-glow)' : 'none',
                minWidth: '100px'
              }}
            >
              {filterLabels[f as keyof typeof filterLabels]}
            </button>
          ))}
        </div>
      </div>

      {/* Project List - Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 48px' }}>
          <FolderKanban size={56} style={{ color: 'var(--text-tertiary)', margin: '0 auto 20px' }} />
          <p style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {language === 'zh' ? '暂无项目' : 'No projects found'}
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', maxWidth: '360px', margin: '0 auto' }}>
            {search ? (language === 'zh' ? '没有找到匹配的项目，请尝试其他关键词' : 'No projects match your search. Try a different keyword.') : 
              (language === 'zh' ? '创建您的第一个项目来开始吧' : 'Create your first project to get started.')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredProjects.map(project => (
            <div key={project.id} className="card animate-slide-up" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                {/* Project Info */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))', border: '1px solid rgba(99, 102, 241, 0.2)', flexShrink: 0 }}>
                    <FolderKanban size={24} style={{ color: '#818CF8' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{getProjectName(project)}</h3>
                      {getStatusBadge(project.status)}
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px', background: 'rgba(100, 116, 139, 0.12)', color: '#64748B' }}>
                        {(project as any).version || 'V1.0.0'}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>{getProjectDesc(project)}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '12px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} />
                        {new Date(project.createdAt).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} />
                        {(project as any).agentCount || 0} {language === 'zh' ? '个智能体' : 'agents'}
                      </span>
                      {(project as any).totalTokens > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34D399' }}>
                          <Coins size={14} />
                          {formatToken((project as any).totalTokens)} Token
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                  {/* Remaining Days Display */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '28px', 
                      fontWeight: '800', 
                      fontFamily: 'Cabinet Grotesk', 
                      background: getRemainingDays(project).isOverdue 
                        ? 'linear-gradient(135deg, #F87171, #EF4444)' 
                        : getRemainingDays(project).isEmpty 
                          ? 'linear-gradient(135deg, var(--text-tertiary), var(--text-secondary))'
                          : 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))', 
                      WebkitBackgroundClip: 'text', 
                      WebkitTextFillColor: 'transparent', 
                      lineHeight: 1 
                    }}>
                      {getRemainingDays(project).isEmpty ? '-' : (getRemainingDays(project).isOverdue ? '!' : getRemainingDays(project).days)}
                    </div>
                    <div style={{ fontSize: '11px', color: getRemainingDays(project).isOverdue ? '#F87171' : 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' }}>
                      {getRemainingDays(project).text}
                    </div>
                  </div>
                  
                  {/* Download Button */}
                  <button className="btn-icon" style={{ width: '44px', height: '44px' }}>
                    <ArrowRight size={20} />
                  </button>
                  
                  {/* Reconstruct Button (for completed and deleted) */}
                  {(project.status === 'completed' || project.status === 'deleted') && (
                    <button 
                      onClick={() => handleReconstructProject(project)} 
                      className="btn-icon" 
                      style={{ width: '44px', height: '44px', background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}
                      title={language === 'zh' ? '重构项目' : 'Reconstruct Project'}
                    >
                      <RotateCw size={18} />
                    </button>
                  )}
                  
                  {/* Delete Button */}
                  <button 
                    onClick={() => handleDeleteProject(project.id)} 
                    className="btn-icon" 
                    style={{ width: '44px', height: '44px', color: '#F87171' }}
                    title={language === 'zh' ? '删除项目' : 'Delete Project'}
                  >
                    <X size={18} />
                  </button>
                  
                  {/* Expand Button */}
                  <button 
                    onClick={() => toggleExpanded(project.id)} 
                    className="btn-icon" 
                    style={{ width: '44px', height: '44px', transform: expandedProjects.has(project.id) ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', animation: 'fadeIn 0.2s ease' }}>
          <div className="card animate-scale-in" style={{ padding: '28px', width: '100%', maxWidth: '480px', margin: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{language === 'zh' ? '创建新项目' : 'Create New Project'}</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn-icon" style={{ width: '36px', height: '36px' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>{language === 'zh' ? '项目名称' : 'Project Name'}</label>
                <input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder={language === 'zh' ? '输入项目名称' : 'Enter project name'} style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '14px', color: 'var(--text-primary)', transition: 'all 0.2s' }} className="input" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>{language === 'zh' ? '项目描述' : 'Description'}</label>
                <textarea value={newProjectDesc} onChange={(e) => setNewProjectDesc(e.target.value)} placeholder={language === 'zh' ? '输入项目描述' : 'Enter project description'} rows={3} style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '14px', color: 'var(--text-primary)', resize: 'vertical', minHeight: '100px', fontFamily: 'inherit', transition: 'all 0.2s' }} className="input" />
              </div>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <span style={{ fontSize: '13px', color: '#8B5CF6' }}>
                  {language === 'zh' ? '📋 新项目将归类为"待评估"' : '📋 New projects will be categorized as "Evaluating"'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <button onClick={() => setShowCreateModal(false)} className="btn-secondary" style={{ flex: 1 }}>{language === 'zh' ? '取消' : 'Cancel'}</button>
                <button className="btn-primary" style={{ flex: 1 }}>{language === 'zh' ? '创建项目' : 'Create Project'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', animation: 'fadeIn 0.2s ease' }}>
          <div className="card animate-scale-in" style={{ padding: '28px', width: '100%', maxWidth: '420px', margin: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#F87171', margin: 0 }}>
                {language === 'zh' ? '确认删除项目' : 'Confirm Delete Project'}
              </h2>
              <button onClick={() => setShowDeleteModal(false)} className="btn-icon" style={{ width: '36px', height: '36px' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {language === 'zh' 
                  ? '确定要删除此项目吗？删除后项目将移至"已删除"标签页，您可以在此处恢复或永久删除。' 
                  : 'Are you sure you want to delete this project? After deletion, the project will be moved to the "Deleted" tab where you can restore or permanently delete it.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button 
                onClick={confirmDeleteProject} 
                className="btn-primary" 
                style={{ flex: 1, background: 'linear-gradient(135deg, #F87171, #EF4444)' }}
              >
                {language === 'zh' ? '确认删除' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reconstruct Confirmation Modal */}
      {showReconstructModal && projectToReconstruct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', animation: 'fadeIn 0.2s ease' }}>
          <div className="card animate-scale-in" style={{ padding: '28px', width: '100%', maxWidth: '480px', margin: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#8B5CF6', margin: 0 }}>
                {language === 'zh' ? '重构项目' : 'Reconstruct Project'}
              </h2>
              <button onClick={() => setShowReconstructModal(false)} className="btn-icon" style={{ width: '36px', height: '36px' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
                {language === 'zh' 
                  ? '确定要重构此项目吗？重构操作将：' 
                  : 'Are you sure you want to reconstruct this project? The reconstruction will:'}
              </p>
              <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '20px', listStyle: 'disc' }}>
                <li>{language === 'zh' ? '将状态重置为"待评估"' : 'Reset status to "Evaluating"'}</li>
                <li>{language === 'zh' ? '版本号递增（如 V1.2.3 → V2.0.0）' : 'Increment version (e.g., V1.2.3 → V2.0.0)'}</li>
                <li>{language === 'zh' ? '清空所有任务' : 'Clear all tasks'}</li>
              </ul>
              <div style={{ marginTop: '16px', padding: '12px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <span style={{ fontSize: '13px', color: '#8B5CF6' }}>
                  {language === 'zh' 
                    ? `📋 当前版本: ${projectToReconstruct.version || 'V1.0.0'} → 新版本: V${(parseInt((projectToReconstruct.version || 'V1.0.0').match(/V?(\d+)/)?.[1] || '1')) + 1}.0.0`
                    : `📋 Current version: ${projectToReconstruct.version || 'V1.0.0'} → New version: V${(parseInt((projectToReconstruct.version || 'V1.0.0').match(/V?(\d+)/)?.[1] || '1')) + 1}.0.0`}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowReconstructModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button 
                onClick={confirmReconstructProject} 
                className="btn-primary" 
                style={{ flex: 1, background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }}
              >
                {language === 'zh' ? '确认重构' : 'Confirm Reconstruct'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .search-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); background: var(--bg-tertiary); }
        .input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); background: var(--bg-tertiary); }
        .input::placeholder { color: var(--text-tertiary); }
        .badge-evaluating { background: rgba(139, 92, 246, 0.15) !important; color: #8B5CF6 !important; }
        .badge-pending-dev { background: rgba(251, 191, 36, 0.15) !important; color: #FBBF24 !important; }
        .badge-deleted { background: rgba(148, 163, 184, 0.15) !important; color: #94A3B8 !important; }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        @media (max-width: 768px) {
          .projects-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
