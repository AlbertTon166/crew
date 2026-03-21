import { useState, useEffect } from 'react'
import { 
  Plus, Search, FolderKanban, Clock, 
  CheckCircle, Loader2, X, Bot, Users, ArrowRight, Coins,
  Settings, MessageSquare, Zap, Code, TestTube, Shield, FileText, ChevronDown, Lock, RotateCw, Sparkles, Download
} from 'lucide-react'
import { useDashboardStore } from '../stores/dashboardStore'
import { useLanguage } from '../context/LanguageContext'
import { useDeployMode } from '../context/DeployModeContext'
import { projectsApi, tasksApi } from '../api'
import { transformProject, transformTask } from '../api/transformers'
import { exportProject } from '../utils/projectExport'

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
}

export default function Projects() {
  const { language } = useLanguage()
  const { setProjects, setTasks } = useDashboardStore()
  const { isConnected } = useDeployMode()
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  
  // Agent Assignment Modal
  const [showAgentModal, setShowAgentModal] = useState(false)
  const [selectedProjectForAgent, setSelectedProjectForAgent] = useState<any>(null)
  // Agent counts per role: { planner: 1, frontend: 2, ... }
  const [agentCounts, setAgentCounts] = useState<Record<string, number>>({
    planner: 1,
    frontend: 1,
    backend: 1,
    reviewer: 0,
    tester: 0
  })
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['email'])
  const [showApiDoc, setShowApiDoc] = useState(false)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [editingDoc, setEditingDoc] = useState<string | null>(null)

  const mockProjects = [
    { id: '1', name: 'E-commerce Platform', nameZh: '电商平台', description: 'Build a full-stack e-commerce platform', descZh: '构建全栈电商平台', status: 'in_progress', tasks: [], createdAt: '2026-03-10T08:00:00Z', updatedAt: '2026-03-18T10:00:00Z', totalTokens: 450000, agentCount: 3, recommendedAgents: 3, recommendedRoles: [{roleId: 'planner', roleName: '规划智能体', roleNameEn: 'Planner', minCount: 1, description: '需求分析'}, {roleId: 'frontend', roleName: '前端开发', roleNameEn: 'Frontend Dev', minCount: 1, description: '界面开发'}, {roleId: 'backend', roleName: '后端开发', roleNameEn: 'Backend Dev', minCount: 1, description: 'API开发'}], version: 'V1.0.0' },
    { id: '2', name: 'Mobile App Redesign', nameZh: '移动端改版', description: 'Redesign the mobile app UI/UX', descZh: '重新设计移动端UI/UX', status: 'completed', tasks: [], createdAt: '2026-03-05T08:00:00Z', updatedAt: '2026-03-15T16:00:00Z', totalTokens: 280000, agentCount: 2, recommendedAgents: 2, recommendedRoles: [{roleId: 'planner', roleName: '规划智能体', roleNameEn: 'Planner', minCount: 1, description: '需求分析'}, {roleId: 'frontend', roleName: '前端开发', roleNameEn: 'Frontend Dev', minCount: 1, description: '界面开发'}], version: 'V1.0.0' },
    { id: '3', name: 'API Integration', nameZh: 'API集成', description: 'Third-party API integration', descZh: '第三方API集成', status: 'evaluating', tasks: [], createdAt: '2026-03-19T08:00:00Z', updatedAt: '2026-03-19T08:00:00Z', totalTokens: 0, agentCount: 0, recommendedAgents: 1, recommendedRoles: [{roleId: 'planner', roleName: '规划智能体', roleNameEn: 'Planner', minCount: 1, description: '需求分析'}], version: 'V1.0.0' },
    { id: '4', name: 'Data Analytics', nameZh: '数据分析', description: 'Analytics dashboard', descZh: '数据看板', status: 'pending_dev', tasks: [], createdAt: '2026-03-19T08:00:00Z', updatedAt: '2026-03-19T08:00:00Z', totalTokens: 0, agentCount: 0, recommendedAgents: 2, recommendedRoles: [{roleId: 'planner', roleName: '规划智能体', roleNameEn: 'Planner', minCount: 1, description: '需求分析'}, {roleId: 'frontend', roleName: '前端开发', roleNameEn: 'Frontend Dev', minCount: 1, description: '界面开发'}], version: 'V1.0.0' },
  ]

  // Project Build Documentation (same as Requirements page)
  const projectDocs: Record<string, { title: string; titleZh: string; content: string; contentZh: string }> = {
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

  // Add state for export loading
  const [exportingProject, setExportingProject] = useState<string | null>(null)

  useEffect(() => {
    // Load data from API
    const loadData = async () => {
      try {
        const projectsData = await projectsApi.getAll()
        const transformedProjects = (projectsData as any[]).map(transformProject)
        setProjects(transformedProjects)
        
        // Load tasks for each project
        const allTasks: Record<string, any[]> = {}
        for (const project of projectsData as any[]) {
          const tasksData = await tasksApi.getAll(project.id)
          allTasks[project.id] = (tasksData as any[]).map(transformTask)
        }
        setTasks(allTasks)
      } catch (error) {
        console.error('Failed to load from API, using mock data:', error)
        // Fallback to mock data
        setProjects(mockProjects as any)
        setTasks({
          '1': [
            { id: 't1', projectId: '1', title: 'User Module', titleZh: '用户模块', description: 'Implement user registration and login', status: 'completed', assignedAgentId: '3', executions: [], createdAt: '2026-03-10T08:00:00Z', updatedAt: '2026-03-18T10:00:00Z' },
            { id: 't2', projectId: '1', title: 'Product Module', titleZh: '商品模块', description: 'Product list and details', status: 'in_progress', assignedAgentId: '3', executions: [], dependsOn: ['t1'], createdAt: '2026-03-10T09:00:00Z', updatedAt: '2026-03-10T09:00:00Z' },
            { id: 't3', projectId: '1', title: 'Code Review', titleZh: '代码审查', description: 'Review user module code', status: 'needs_review', assignedAgentId: '5', executions: [], dependsOn: ['t1'], createdAt: '2026-03-10T10:00:00Z', updatedAt: '2026-03-10T10:00:00Z' },
          ],
          '2': [{ id: 't4', projectId: '2', title: 'UI Redesign', titleZh: 'UI改版', description: 'Redesign all screens', status: 'completed', assignedAgentId: '3', executions: [], createdAt: '2026-03-05T09:00:00Z', updatedAt: '2026-03-15T16:00:00Z' }],
          '3': [],
          '4': [],
        })
      }
    }
    
    loadData()
  }, [])

  const getProjectName = (p: typeof mockProjects[0]) => language === 'zh' ? p.nameZh : p.name
  const getProjectDesc = (p: typeof mockProjects[0]) => language === 'zh' ? p.descZh : p.description

  const filteredProjects = mockProjects.filter(project => {
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

  const getProjectProgress = (projectId: string) => {
    const projectTasks: any[] = []
    if (projectId === '1') projectTasks.push({ status: 'completed' }, { status: 'in_progress' }, { status: 'needs_review' })
    if (projectId === '2') projectTasks.push({ status: 'completed' })
    if (projectTasks.length === 0) return 0
    const completed = projectTasks.filter(t => t.status === 'completed').length
    return Math.round((completed / projectTasks.length) * 100)
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

  const isEditable = (status: string) => status === 'evaluating' || status === 'pending'

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
          {['all', 'evaluating', 'pending_dev', 'in_progress', 'completed', 'pending'].map((f) => (
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

      {/* Project List */}
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
                      {project.version}
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
                      {project.agentCount} {language === 'zh' ? '个智能体' : 'agents'}
                    </span>
                    {project.totalTokens > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34D399' }}>
                        <Coins size={14} />
                        {formatToken(project.totalTokens)} Token
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Cabinet Grotesk', background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>{getProjectProgress(project.id)}%</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' }}>{language === 'zh' ? '进度' : 'Progress'}</div>
                </div>
                
                <div style={{ width: '100px' }}>
                  <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ width: `${getProjectProgress(project.id)}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent-violet))', borderRadius: '100px', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  </div>
                </div>
                
                {/* Configure Agent Button - Only for pending_dev */}
                {project.status === 'pending_dev' && (
                  <button
                    onClick={() => { 
                      setSelectedProjectForAgent(project); 
                      // Initialize agent counts from recommended roles or defaults
                      const counts: Record<string, number> = { planner: 1 }
                      if (project.recommendedRoles && Array.isArray(project.recommendedRoles)) {
                        project.recommendedRoles.forEach((r: any) => {
                          counts[r.roleId] = r.minCount || 1
                        })
                      } else {
                        counts.frontend = 1
                        counts.backend = 1
                      }
                      setAgentCounts(counts)
                      setShowAgentModal(true) 
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px var(--primary-glow)'
                    }}
                  >
                    <Bot size={16} />
                    {language === 'zh' ? '配置智能体' : 'Configure'}
                  </button>
                )}
                
                <button 
                  onClick={() => toggleExpanded(project.id)} 
                  className="btn-icon" 
                  style={{ width: '44px', height: '44px', transform: expandedProjects.has(project.id) ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                >
                  <ArrowRight size={20} />
                </button>
                
                {/* Export Button */}
                <button 
                  onClick={async () => {
                    setExportingProject(project.id)
                    try {
                      await exportProject(project.id, project.name)
                    } catch (err) {
                      alert(language === 'zh' ? '导出失败' : 'Export failed')
                    } finally {
                      setExportingProject(null)
                    }
                  }}
                  className="btn-icon"
                  disabled={exportingProject === project.id}
                  style={{ width: '44px', height: '44px' }}
                  title={language === 'zh' ? '导出项目' : 'Export Project'}
                >
                  {exportingProject === project.id ? (
                    <Loader2 size={20} className="spinner" />
                  ) : (
                    <Download size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Tasks Preview - Agent Roles */}
            {project.id === '1' && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Users size={16} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{language === 'zh' ? '智能体团队' : 'Agent Team'}</span>
                </div>
                
                {/* Agent Role Cards with nested Tasks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { 
                      role: '前端开发', 
                      roleEn: 'Frontend Dev', 
                      status: 'completed', 
                      color: '#34D399',
                      tasks: [
                        { name: 'Web UI设计', nameEn: 'Web UI Design', status: 'completed' },
                        { name: '交互效果实现', nameEn: 'Animation Effects', status: 'completed' },
                      ]
                    },
                    { 
                      role: '后端开发', 
                      roleEn: 'Backend Dev', 
                      status: 'in_progress', 
                      color: '#FBBF24',
                      tasks: [
                        { name: '用户API开发', nameEn: 'User API', status: 'completed' },
                        { name: '商品模块开发', nameEn: 'Product Module', status: 'in_progress' },
                        { name: '订单系统设计', nameEn: 'Order System', status: 'pending' },
                      ]
                    },
                    { 
                      role: '审核智能体', 
                      roleEn: 'Reviewer', 
                      status: 'pending', 
                      color: '#F87171',
                      tasks: [
                        { name: '代码审查', nameEn: 'Code Review', status: 'pending' },
                      ]
                    },
                  ].map(agent => (
                    <div key={agent.role} style={{ 
                      padding: '14px 16px', 
                      borderRadius: '12px', 
                      background: 'var(--bg-secondary)', 
                      border: `1px solid ${agent.status === 'in_progress' ? agent.color + '30' : agent.status === 'completed' ? '#34D39930' : 'var(--border)'}`,
                    }}>
                      {/* Agent Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: agent.tasks.length > 0 ? '12px' : '0' }}>
                        <div style={{ 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: '8px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: `${agent.color}20`,
                        }}>
                          {agent.status === 'completed' ? (
                            <CheckCircle size={14} style={{ color: '#34D399' }} />
                          ) : agent.status === 'in_progress' ? (
                            <Loader2 size={14} style={{ color: '#FBBF24', animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Clock size={14} style={{ color: '#F87171' }} />
                          )}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {language === 'zh' ? agent.role : agent.roleEn}
                        </span>
                        <span style={{ 
                          fontSize: '10px', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          background: `${agent.color}15`,
                          color: agent.color,
                          fontWeight: '600',
                        }}>
                          {agent.status === 'completed' ? (language === 'zh' ? '已完成' : 'Done') : 
                           agent.status === 'in_progress' ? (language === 'zh' ? '进行中' : 'Running') :
                           (language === 'zh' ? '待处理' : 'Pending')}
                        </span>
                      </div>
                      
                      {/* Tasks under this Agent */}
                      {agent.tasks.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingLeft: '38px' }}>
                          {agent.tasks.map((task, idx) => (
                            <div key={idx} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: 'var(--bg-tertiary)',
                              fontSize: '12px',
                            }}>
                              {task.status === 'completed' ? (
                                <CheckCircle size={11} style={{ color: '#34D399' }} />
                              ) : task.status === 'in_progress' ? (
                                <Loader2 size={11} style={{ color: '#FBBF24', animation: 'spin 1s linear infinite' }} />
                              ) : (
                                <Clock size={11} style={{ color: '#94A3B8' }} />
                              )}
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {language === 'zh' ? task.name : task.nameEn}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expanded Build Documentation */}
            {expandedProjects.has(project.id) && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)', position: 'relative' }}>
                {/* Gear Icon - Top Right */}
                <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                  <button
                    onClick={() => isEditable(project.status) && setEditingDoc(editingDoc === project.id ? null : project.id)}
                    style={{
                      padding: '8px',
                      background: isEditable(project.status) 
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))' 
                        : 'var(--bg-tertiary)',
                      border: isEditable(project.status) 
                        ? '1px solid rgba(99, 102, 241, 0.4)' 
                        : '1px solid var(--border)',
                      borderRadius: '10px',
                      cursor: isEditable(project.status) ? 'pointer' : 'not-allowed',
                      boxShadow: isEditable(project.status) 
                        ? '0 0 20px rgba(99, 102, 241, 0.4), 0 0 40px rgba(139, 92, 246, 0.2)' 
                        : 'none',
                      transition: 'all 0.3s ease',
                      opacity: isEditable(project.status) ? 1 : 0.5,
                    }}
                  >
                    <Settings 
                      size={18} 
                      style={{ 
                        color: isEditable(project.status) ? '#818CF8' : '#64748B',
                        filter: isEditable(project.status) ? 'drop-shadow(0 0 6px rgba(129, 140, 248, 0.8))' : 'none',
                      }} 
                    />
                  </button>
                </div>

                {/* Build Documentation Content */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <FileText size={16} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    {language === 'zh' ? '项目构建文档' : 'Build Documentation'}
                  </span>
                </div>

                {/* Doc Content - Same as Requirements Pool */}
                <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', maxHeight: '300px', overflow: 'auto', paddingRight: '60px' }}>
                  <pre style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
                    {language === 'zh' ? (projectDocs[project.id]?.contentZh || '暂无文档') : (projectDocs[project.id]?.content || 'No documentation available')}
                  </pre>
                </div>

                {/* Edit Mode Overlay */}
                {editingDoc === project.id && (
                  <div style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', background: 'var(--bg-primary)', border: '1px solid var(--primary)', boxShadow: '0 0 20px var(--primary-glow)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <Zap size={16} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)' }}>
                        {language === 'zh' ? '编辑文档内容' : 'Edit Documentation'}
                      </span>
                    </div>
                    <textarea
                      defaultValue={language === 'zh' ? projectDocs[project.id]?.contentZh : projectDocs[project.id]?.content}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        resize: 'vertical',
                        minHeight: '200px',
                        fontFamily: 'inherit',
                        lineHeight: '1.6',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setEditingDoc(null)}
                        style={{ padding: '8px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                      >
                        {language === 'zh' ? '取消' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => setEditingDoc(null)}
                        style={{ padding: '8px 16px', background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}
                      >
                        {language === 'zh' ? '保存' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Non-editable hint */}
                {!isEditable(project.status) && (
                  <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(100, 116, 139, 0.08)', border: '1px solid rgba(100, 116, 139, 0.15)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {language === 'zh' ? '⚠️ 该状态下文档不可编辑' : '⚠️ Documentation is locked in this status'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <FolderKanban size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>{language === 'zh' ? '未找到项目' : 'No projects found'}</p>
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
              {/* Default to evaluating status */}
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <span style={{ fontSize: '13px', color: '#8B5CF6' }}>
                  {language === 'zh' ? '📋 新项目将归类为"待评估"' : '📋 New projects will be categorized as "Evaluating"'}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <button onClick={() => setShowCreateModal(false)} className="btn-secondary" style={{ flex: 1 }}>{language === 'zh' ? '取消' : 'Cancel'}</button>
                <button 
                  onClick={async () => {
                    if (!newProjectName.trim()) return
                    try {
                      const newProject = await projectsApi.create({
                        name: newProjectName,
                        description: newProjectDesc,
                        status: 'pending'
                      })
                      // Refresh list
                      const projectsData = await projectsApi.getAll()
                      setProjects((projectsData as any[]).map(transformProject))
                      setShowCreateModal(false)
                      setNewProjectName('')
                      setNewProjectDesc('')
                    } catch (error) {
                      console.error('Failed to create project:', error)
                    }
                  }}
                  className="btn-primary" 
                  style={{ flex: 1 }}
                >
                  {language === 'zh' ? '创建项目' : 'Create Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Assignment Modal */}
      {showAgentModal && selectedProjectForAgent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', maxWidth: '560px', width: '100%', maxHeight: '90vh', overflow: 'auto', position: 'relative', animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={22} style={{ color: '#fff' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                    {language === 'zh' ? '配置智能体' : 'Configure Agents'}
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>
                    {language === 'zh' ? selectedProjectForAgent.nameZh : selectedProjectForAgent.name}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { 
                  setAgentCounts({ planner: 1, frontend: 1, backend: 1, reviewer: 0, tester: 0 })
                  setSelectedChannels(['email']); 
                }} style={{ padding: '8px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                  <RotateCw size={18} style={{ color: 'var(--text-secondary)' }} />
                </button>
                <button onClick={() => setShowAgentModal(false)} style={{ padding: '8px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                  <X size={18} style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>
            </div>

            {/* Agent Roles Selection - Counter Based */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  {language === 'zh' ? '👥 智能体职员' : '👥 Agent Staff'}
                </label>
                {/* Total count badge */}
                <div style={{ 
                  padding: '6px 12px', 
                  borderRadius: '20px', 
                  background: (() => {
                    const total = Object.values(agentCounts).reduce((a, b) => a + b, 0)
                    const minTotal = selectedProjectForAgent?.recommendedRoles?.reduce((sum: number, r: any) => sum + (r.minCount || 0), 0) || 1
                    return total >= minTotal ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)'
                  })(),
                  border: `1px solid ${(() => {
                    const total = Object.values(agentCounts).reduce((a, b) => a + b, 0)
                    const minTotal = selectedProjectForAgent?.recommendedRoles?.reduce((sum: number, r: any) => sum + (r.minCount || 0), 0) || 1
                    return total >= minTotal ? '#34D399' : '#F87171'
                  })()}`,
                }}>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: '700',
                    color: (() => {
                      const total = Object.values(agentCounts).reduce((a, b) => a + b, 0)
                      const minTotal = selectedProjectForAgent?.recommendedRoles?.reduce((sum: number, r: any) => sum + (r.minCount || 0), 0) || 1
                      return total >= minTotal ? '#34D399' : '#F87171'
                    })()
                  }}>
                    {Object.values(agentCounts).reduce((a, b) => a + b, 0)} / {selectedProjectForAgent?.recommendedRoles?.reduce((sum: number, r: any) => sum + (r.minCount || 0), 0) || 1}
                  </span>
                </div>
              </div>
              
              {/* Role list with counters */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {agentRoles.map((role) => {
                  const count = agentCounts[role.id] || 0
                  const isPlanner = role.id === 'planner'
                  // Get min count from recommended roles
                  const recommendedRole = selectedProjectForAgent?.recommendedRoles?.find((r: any) => r.roleId === role.id)
                  const minCount = recommendedRole?.minCount || 0
                  const RoleIcon = role.icon
                  
                  return (
                    <div
                      key={role.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: count > 0 ? `2px solid ${role.color}` : '1px solid var(--border)',
                        background: count > 0 ? `${role.color}15` : 'var(--bg-tertiary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {/* Role icon */}
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: role.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <RoleIcon size={18} style={{ color: '#fff' }} />
                      </div>
                      
                      {/* Role info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isPlanner && <Lock size={10} style={{ color: '#8B5CF6' }} />}
                          {language === 'zh' ? role.label : role.labelEn}
                          {minCount > 0 && (
                            <span style={{ fontSize: '10px', color: '#8B5CF6', fontWeight: '500' }}>
                              ({language === 'zh' ? `最低${minCount}人` : `min ${minCount}`})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          {role.desc}
                        </div>
                      </div>
                      
                      {/* Counter controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isPlanner ? (
                          // Planner: fixed at 1
                          <div style={{ 
                            padding: '6px 16px', 
                            borderRadius: '8px', 
                            background: role.color,
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: '700'
                          }}>
                            1
                          </div>
                        ) : (
                          // Other roles: +/- buttons
                          <>
                            <button
                              onClick={() => setAgentCounts(prev => ({ ...prev, [role.id]: Math.max(0, (prev[role.id] || 0) - 1) }))}
                              disabled={count <= 0}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: count > 0 ? 'var(--bg-card)' : 'var(--bg-tertiary)',
                                color: count > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: count > 0 ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              -
                            </button>
                            <div style={{ 
                              minWidth: '24px',
                              textAlign: 'center',
                              fontSize: '14px',
                              fontWeight: '700',
                              color: count > 0 ? role.color : 'var(--text-tertiary)'
                            }}>
                              {count}
                            </div>
                            <button
                              onClick={() => setAgentCounts(prev => ({ ...prev, [role.id]: (prev[role.id] || 0) + 1 }))}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              +
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Detailed constraint hint */}
              <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                {(() => {
                  const missing: string[] = []
                  selectedProjectForAgent?.recommendedRoles?.forEach((r: any) => {
                    const current = agentCounts[r.roleId] || 0
                    if (current < r.minCount) {
                      missing.push(`${language === 'zh' ? r.roleName : r.roleNameEn}还差${r.minCount - current}人`)
                    }
                  })
                  if (missing.length === 0) {
                    return (
                      <span style={{ fontSize: '11px', color: '#34D399' }}>
                        ✅ {language === 'zh' ? '已满足最低配置要求' : 'Minimum requirements met'}
                      </span>
                    )
                  }
                  return (
                    <span style={{ fontSize: '11px', color: '#F87171' }}>
                      ⚠️ {missing.join('、')}
                    </span>
                  )
                })()}</div>
            </div>

            {/* Notification Channels */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                {language === 'zh' ? '🔔 提醒渠道' : '🔔 Notification Channels'}
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {notifyChannels.map(channel => {
                  const isSelected = selectedChannels.includes(channel.id)
                  return (
                    <button
                      key={channel.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedChannels(selectedChannels.filter(c => c !== channel.id))
                        } else {
                          setSelectedChannels([...selectedChannels, channel.id])
                        }
                      }}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '12px 8px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: isSelected ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))' : 'var(--bg-tertiary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{channel.icon}</span>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: isSelected ? 'var(--primary)' : 'var(--text-secondary)' }}>
                        {language === 'zh' ? channel.label : channel.labelEn}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* API Documentation Toggle */}
            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={() => setShowApiDoc(!showApiDoc)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={18} style={{ color: 'var(--text-secondary)' }} />
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {language === 'zh' ? '添加私有接口' : 'Add Private API'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                      {language === 'zh' ? '测试接口或数据结构' : 'Test API or Data Structure'}
                    </span>
                  </div>
                </div>
                <ChevronDown size={18} style={{ color: 'var(--text-tertiary)', transform: showApiDoc ? 'rotate(180deg)' : 'none', transition: 'all 0.2s' }} />
              </button>
              
              {showApiDoc && (
                <div style={{ marginTop: '12px', padding: '16px', borderRadius: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Base URL</span>
                    <input 
                      type="text" 
                      defaultValue={apiDoc.baseUrl}
                      style={{ 
                        width: '100%', 
                        marginTop: '4px', 
                        padding: '8px 12px', 
                        background: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#34D399',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Auth</span>
                    <input 
                      type="text" 
                      defaultValue={apiDoc.auth}
                      style={{ 
                        width: '100%', 
                        marginTop: '4px', 
                        padding: '8px 12px', 
                        background: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#FBBF24',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>DATA</span>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6', fontWeight: '500' }}>JSON</span>
                    </div>
                    <textarea 
                      placeholder='{\n  "key": "value"\n}'
                      style={{ 
                        width: '100%',
                        minHeight: '120px',
                        padding: '12px', 
                        background: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        fontFamily: 'monospace',
                        resize: 'vertical',
                        lineHeight: '1.5'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Button */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowAgentModal(false)}
                style={{ flex: 1, padding: '14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  // Update project with selected agents
                  setShowAgentModal(false)
                  // In real app, would call API here
                }}
                style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 16px var(--primary-glow)' }}
              >
                {language === 'zh' ? `确认配置 ${Object.values(agentCounts).reduce((a, b) => a + b, 0)} 个智能体` : `Confirm ${Object.values(agentCounts).reduce((a, b) => a + b, 0)} Agents`}
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
