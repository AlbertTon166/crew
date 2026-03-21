import { useState, useEffect } from 'react'
import { Search, Shield, BookOpen, X, CheckCircle, Users, Zap, GripVertical, Bot, Plus, WifiOff } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useDeployMode } from '../context/DeployModeContext'

interface JobTemplate {
  id: string
  title: string
  titleZh: string
  industry: string
  industryZh: string
  role: { title: string; titleZh: string; content: string; contentZh: string }
  skills: { title: string; titleZh: string; content: string; contentZh: string }
  knowledge: { title: string; titleZh: string; content: string; contentZh: string }
}

const jobTemplates: JobTemplate[] = [
  {
    id: 'frontend-dev',
    title: 'Frontend Developer',
    titleZh: '前端开发工程师',
    industry: 'Technology',
    industryZh: '科技',
    role: {
      title: 'Frontend Developer Role',
      titleZh: '前端开发工程师角色',
      content: 'You are a senior frontend developer with 8+ years of experience...',
      contentZh: '你是一位拥有8年以上经验的高级前端开发工程师...'
    },
    skills: {
      title: 'Frontend Developer Skills',
      titleZh: '前端开发技能清单',
      content: 'React 18+, TypeScript, Tailwind CSS...',
      contentZh: 'React 18+、TypeScript、Tailwind CSS...'
    },
    knowledge: {
      title: 'Frontend Development Guidelines',
      titleZh: '前端开发规范',
      content: 'File Structure, Naming Conventions, Git Workflow...',
      contentZh: '文件结构、命名规范、Git工作流...'
    }
  },
  {
    id: 'backend-dev',
    title: 'Backend Developer',
    titleZh: '后端开发工程师',
    industry: 'Technology',
    industryZh: '科技',
    role: {
      title: 'Backend Developer Role',
      titleZh: '后端开发工程师角色',
      content: 'You are a senior backend developer with 8+ years of experience...',
      contentZh: '你是一位拥有8年以上经验的高级后端开发工程师...'
    },
    skills: {
      title: 'Backend Developer Skills',
      titleZh: '后端开发技能清单',
      content: 'Node.js/Express, SQL/NoSQL databases, API design...',
      contentZh: 'Node.js/Express、SQL/NoSQL数据库、API设计...'
    },
    knowledge: {
      title: 'Backend Development Guidelines',
      titleZh: '后端开发规范',
      content: 'REST Conventions, Response Format, Error Handling...',
      contentZh: 'REST约定、响应格式、错误处理...'
    }
  },
  {
    id: 'qa-engineer',
    title: 'QA Engineer',
    titleZh: '测试工程师',
    industry: 'Technology',
    industryZh: '科技',
    role: {
      title: 'QA Engineer Role',
      titleZh: '测试工程师角色',
      content: 'You are a QA engineer specializing in automated testing...',
      contentZh: '你是一位专注于自动化测试的QA工程师...'
    },
    skills: {
      title: 'QA Engineer Skills',
      titleZh: '测试工程师技能清单',
      content: 'Test case design, Selenium, Cypress, Playwright...',
      contentZh: '测试用例设计、Selenium、Cypress、Playwright...'
    },
    knowledge: {
      title: 'QA Testing Guidelines',
      titleZh: '测试规范',
      content: 'Bug Report Template, Severity Definitions...',
      contentZh: 'Bug报告模板、严重性定义...'
    }
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    titleZh: '产品经理',
    industry: 'Technology',
    industryZh: '科技',
    role: {
      title: 'Product Manager Role',
      titleZh: '产品经理角色',
      content: 'You are an experienced product manager with 6+ years...',
      contentZh: '你是一位拥有6年以上经验的产品经理...'
    },
    skills: {
      title: 'Product Manager Skills',
      titleZh: '产品经理技能清单',
      content: 'Market analysis, User research, Wireframing...',
      contentZh: '市场分析、用户研究、线框图...'
    },
    knowledge: {
      title: 'Product Management Guidelines',
      titleZh: '产品管理规范',
      content: 'PRD Template, Sprint Planning...',
      contentZh: 'PRD模板、迭代计划...'
    }
  },
  {
    id: 'devops-engineer',
    title: 'DevOps Engineer',
    titleZh: '运维工程师',
    industry: 'Technology',
    industryZh: '科技',
    role: {
      title: 'DevOps Engineer Role',
      titleZh: '运维工程师角色',
      content: 'You are a DevOps engineer with 6+ years of experience...',
      contentZh: '你是一位拥有6年以上经验的运维工程师...'
    },
    skills: {
      title: 'DevOps Engineer Skills',
      titleZh: '运维工程师技能清单',
      content: 'Docker, Kubernetes, Jenkins, Terraform...',
      contentZh: 'Docker、Kubernetes、Jenkins、Terraform...'
    },
    knowledge: {
      title: 'DevOps Guidelines',
      titleZh: '运维规范',
      content: 'CI/CD Pipeline, Infrastructure as Code...',
      contentZh: 'CI/CD流水线、基础设施即代码...'
    }
  }
]

const industries = [
  { id: 'all', label: '全部', labelEn: 'All' },
  { id: 'Technology', label: '科技', labelEn: 'Technology' },
  { id: 'Finance', label: '金融', labelEn: 'Finance' },
  { id: 'Healthcare', label: '医疗', labelEn: 'Healthcare' },
  { id: 'E-commerce', label: '电商', labelEn: 'E-commerce' },
]

export default function Knowledge() {
  const { language } = useLanguage()
  const { isConnected } = useDeployMode()
  const [jobs] = useState<JobTemplate[]>(jobTemplates)
  const [selectedJob, setSelectedJob] = useState<JobTemplate | null>(null)
  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [showConfig, setShowConfig] = useState(false)
  const [addedJobs, setAddedJobs] = useState<string[]>([])
  const [draggedJob, setDraggedJob] = useState<JobTemplate | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newJobForm, setNewJobForm] = useState({
    title: '',
    titleZh: '',
    industry: 'Technology',
    industryZh: '科技',
    role: { title: '', titleZh: '', content: '', contentZh: '' },
    skills: { title: '', titleZh: '', content: '', contentZh: '' },
    knowledge: { title: '', titleZh: '', content: '', contentZh: '' }
  })

  // Simulate some jobs already assigned to agents
  useEffect(() => {
    setAddedJobs(['frontend-dev'])
  }, [])

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.titleZh.includes(search)
    const matchesIndustry = industryFilter === 'all' || job.industry === industryFilter
    return matchesSearch && matchesIndustry
  })

  const availableJobs = filteredJobs.filter(job => !addedJobs.includes(job.id))
  const configuredJobs = jobs.filter(job => addedJobs.includes(job.id))

  const getJobTitle = (job: JobTemplate) => language === 'zh' ? job.titleZh : job.title
  const getIndustryLabel = (industry: string) => {
    const ind = industries.find(i => i.id === industry)
    return language === 'zh' ? (ind?.label || industry) : (ind?.labelEn || industry)
  }

  const isJobAssignedToAgent = (jobId: string) => jobId === 'frontend-dev'

  const handleAddJob = (job: JobTemplate) => {
    if (!addedJobs.includes(job.id)) {
      setAddedJobs([...addedJobs, job.id])
    }
    setSelectedJob(job)
    setShowConfig(true)
  }

  const handleRemoveJob = (jobId: string) => {
    if (isJobAssignedToAgent(jobId)) return
    setAddedJobs(addedJobs.filter(id => id !== jobId))
    if (selectedJob?.id === jobId) {
      setSelectedJob(null)
      setShowConfig(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, job: JobTemplate) => {
    setDraggedJob(job)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (draggedJob && !addedJobs.includes(draggedJob.id)) {
      handleAddJob(draggedJob)
    }
    setDraggedJob(null)
  }

  const handleDragEnd = () => {
    setDraggedJob(null)
    setIsDragOver(false)
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {language === 'zh' ? '知识库配置' : 'Knowledge Base'}
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            {language === 'zh' ? '选择岗位模板，自动配置角色/技能/知识库' : 'Select job templates to auto-configure role, skills, and knowledge'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 16px var(--primary-glow)'
            }}
          >
            <Plus size={18} />
            {language === 'zh' ? '新建岗位' : 'Create Job'}
          </button>
          {addedJobs.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(16, 185, 129, 0.1))',
              border: '1px solid rgba(52, 211, 153, 0.3)'
            }}>
              <CheckCircle size={18} style={{ color: '#34D399' }} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#34D399' }}>
                {addedJobs.length} {language === 'zh' ? '个岗位已配置' : 'jobs configured'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="card animate-slide-up stagger-1" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} size={18} />
            <input
              type="text"
              placeholder={language === 'zh' ? '搜索岗位...' : 'Search jobs...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 46px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '14px', color: 'var(--text-primary)' }}
              className="job-search"
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {industries.map(ind => (
              <button
                key={ind.id}
                onClick={() => setIndustryFilter(ind.id)}
                style={{
                  padding: '10px 16px', fontSize: '13px', fontWeight: '600', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: industryFilter === ind.id ? 'linear-gradient(135deg, var(--primary), var(--accent-violet))' : 'var(--bg-tertiary)',
                  color: '#FFFFFF', boxShadow: industryFilter === ind.id ? '0 4px 12px var(--primary-glow)' : 'none'
                }}
              >
                {language === 'zh' ? ind.label : ind.labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: showConfig && selectedJob ? '340px 1fr' : '1fr', gap: '20px', transition: 'all 0.3s ease' }} className="knowledge-grid">
        {/* Left Panel */}
        <div className="animate-slide-up stagger-2">
          {/* Available Jobs */}
          <div className="card" style={{ padding: '8px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 12px', marginBottom: '4px' }}>
              {language === 'zh' ? '可添加岗位' : 'Available Jobs'} ({availableJobs.length})
            </div>
            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
              {availableJobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}>
                  <CheckCircle size={24} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <p style={{ fontSize: '13px' }}>{language === 'zh' ? '所有岗位已添加' : 'All jobs added'}</p>
                </div>
              ) : (
                availableJobs.map(job => (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, job)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '12px',
                      background: 'transparent', cursor: 'grab', transition: 'all 0.2s', marginBottom: '4px',
                      opacity: draggedJob?.id === job.id ? 0.5 : 1
                    }}
                    className="job-item-draggable"
                  >
                    <GripVertical size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-tertiary)', marginBottom: '2px' }}>{getIndustryLabel(job.industry)}</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{getJobTitle(job)}</div>
                    </div>
                    <button
                      onClick={() => handleAddJob(job)}
                      style={{
                        padding: '6px 12px', fontSize: '11px', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))', color: '#FFFFFF',
                        boxShadow: '0 2px 8px var(--primary-glow)', flexShrink: 0
                      }}
                    >
                      {language === 'zh' ? '添加' : 'Add'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Drop Zone - Selected Jobs */}
          <div
            className="card"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              padding: '16px',
              border: isDragOver ? '2px dashed var(--primary)' : '2px dashed var(--border)',
              background: isDragOver ? 'rgba(232, 121, 249, 0.05)' : 'transparent',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(16, 185, 129, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={16} style={{ color: '#34D399' }} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {language === 'zh' ? '已选岗位' : 'Selected Jobs'} ({configuredJobs.length})
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {language === 'zh' ? '拖拽岗位到此处批量添加' : 'Drag jobs here to batch add'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '80px' }}>
              {configuredJobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed var(--border)', borderRadius: '12px', color: 'var(--text-tertiary)' }}>
                  <Users size={20} style={{ opacity: 0.3, marginBottom: '6px' }} />
                  <p style={{ fontSize: '12px', margin: 0 }}>{language === 'zh' ? '拖拽或点击添加岗位' : 'Drag or click to add jobs'}</p>
                </div>
              ) : (
                configuredJobs.map(job => {
                  const isAssigned = isJobAssignedToAgent(job.id)
                  const isSelected = selectedJob?.id === job.id
                  return (
                    <div
                      key={job.id}
                      onClick={() => { setSelectedJob(job); setShowConfig(true) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '12px',
                        background: isSelected ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))' : 'var(--bg-tertiary)',
                        border: isSelected ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--border)',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      className="selected-job-item"
                    >
                      <GripVertical size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {getJobTitle(job)}
                          {isAssigned && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: '600', padding: '2px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
                              <Bot size={10} />
                              {language === 'zh' ? '已分配' : 'Assigned'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{getIndustryLabel(job.industry)}</div>
                      </div>
                      {!isAssigned && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveJob(job.id) }}
                          style={{ padding: '4px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--text-tertiary)', display: 'flex' }}
                          className="remove-btn"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Config Details */}
        {showConfig && selectedJob && (
          <div className="card animate-slide-up" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6', textTransform: 'uppercase' }}>
                  {getIndustryLabel(selectedJob.industry)}
                </span>
                {isJobAssignedToAgent(selectedJob.id) && (
                  <span style={{ fontSize: '10px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
                    {language === 'zh' ? '已分配给智能体' : 'Assigned to Agent'}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, fontFamily: 'Cabinet Grotesk' }}>
                {getJobTitle(selectedJob)}
              </h2>
            </div>

            {/* Three Column Config */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }} className="config-grid">
              {/* Role */}
              <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={18} style={{ color: '#FFFFFF' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{language === 'zh' ? '角色' : 'Role'}</div>
                    <div style={{ fontSize: '11px', color: '#8B5CF6' }}>{language === 'zh' ? selectedJob.role.titleZh : selectedJob.role.title}</div>
                  </div>
                </div>
                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', maxHeight: '180px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                  {language === 'zh' ? selectedJob.role.contentZh : selectedJob.role.content}
                </div>
              </div>

              {/* Skills */}
              <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #FBBF24, #F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={18} style={{ color: '#FFFFFF' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{language === 'zh' ? '技能' : 'Skills'}</div>
                    <div style={{ fontSize: '11px', color: '#FBBF24' }}>{language === 'zh' ? selectedJob.skills.titleZh : selectedJob.skills.title}</div>
                  </div>
                </div>
                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', maxHeight: '180px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                  {language === 'zh' ? selectedJob.skills.contentZh : selectedJob.skills.content}
                </div>
              </div>

              {/* Knowledge */}
              <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #10B981, #14B8A6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={18} style={{ color: '#FFFFFF' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{language === 'zh' ? '知识库' : 'Knowledge'}</div>
                    <div style={{ fontSize: '11px', color: '#10B981' }}>{language === 'zh' ? selectedJob.knowledge.titleZh : selectedJob.knowledge.title}</div>
                  </div>
                </div>
                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-primary)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', maxHeight: '180px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                  {language === 'zh' ? selectedJob.knowledge.contentZh : selectedJob.knowledge.content}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              {!isJobAssignedToAgent(selectedJob.id) && (
                <button
                  onClick={() => handleRemoveJob(selectedJob.id)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  {language === 'zh' ? '移除此岗位' : 'Remove This Job'}
                </button>
              )}
              <button onClick={() => setShowConfig(false)} className="btn-secondary">
                {language === 'zh' ? '关闭' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!showConfig && filteredJobs.length > 0 && (
        <div className="card animate-slide-up stagger-3" style={{ padding: '48px', textAlign: 'center', marginTop: '20px' }}>
          <Users size={48} style={{ color: 'var(--text-tertiary)', opacity: 0.3, marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {language === 'zh' ? '选择岗位查看配置' : 'Select a job to view configuration'}
          </h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
            {language === 'zh' ? '点击岗位或拖拽到下方区域添加' : 'Click a job or drag to the area below to add'}
          </p>
        </div>
      )}

      {/* Create Job Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={22} style={{ color: '#fff' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                    {language === 'zh' ? '新建岗位' : 'Create Job'}
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>
                    {language === 'zh' ? '创建空白岗位，后续配置角色/技能/知识库' : 'Create blank job, configure role/skills/knowledge later'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '8px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
              >
                <X size={18} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Title */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {language === 'zh' ? '岗位名称 (中文)' : 'Job Title (Chinese)'}
                  </label>
                  <input
                    type="text"
                    value={newJobForm.titleZh}
                    onChange={(e) => setNewJobForm({ ...newJobForm, titleZh: e.target.value, title: e.target.value })}
                    placeholder={language === 'zh' ? '例如：前端开发工程师' : 'e.g. Frontend Developer'}
                    style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '14px', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {language === 'zh' ? '岗位名称 (English)' : 'Job Title (English)'}
                  </label>
                  <input
                    type="text"
                    value={newJobForm.title}
                    onChange={(e) => setNewJobForm({ ...newJobForm, title: e.target.value })}
                    placeholder={language === 'zh' ? '例如：Frontend Developer' : 'e.g. Frontend Developer'}
                    style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '14px', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              {/* Industry */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {language === 'zh' ? '行业' : 'Industry'}
                </label>
                <select
                  value={newJobForm.industry}
                  onChange={(e) => {
                    const ind = industries.find(i => i.id === e.target.value)
                    setNewJobForm({ ...newJobForm, industry: e.target.value, industryZh: ind?.label || '科技' })
                  }}
                  style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '14px', color: 'var(--text-primary)' }}
                >
                  {industries.filter(i => i.id !== 'all').map(ind => (
                    <option key={ind.id} value={ind.id}>{language === 'zh' ? ind.label : ind.labelEn}</option>
                  ))}
                </select>
              </div>

              {/* Config Placeholders - Empty */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Shield size={16} style={{ color: '#8B5CF6' }} />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>{language === 'zh' ? '角色' : 'Role'}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '12px' }}>
                    {language === 'zh' ? '暂无配置' : 'Not configured'}
                  </div>
                </div>
                <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Zap size={16} style={{ color: '#FBBF24' }} />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>{language === 'zh' ? '技能' : 'Skills'}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '12px' }}>
                    {language === 'zh' ? '暂无配置' : 'Not configured'}
                  </div>
                </div>
                <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <BookOpen size={16} style={{ color: '#10B981' }} />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>{language === 'zh' ? '知识库' : 'Knowledge'}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '12px' }}>
                    {language === 'zh' ? '暂无配置' : 'Not configured'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1, padding: '14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  {language === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    if (!newJobForm.title || !newJobForm.titleZh) return
                    const newJob: JobTemplate = { ...newJobForm, id: `custom-${Date.now()}` }
                    jobTemplates.push(newJob)
                    setAddedJobs([...addedJobs, newJob.id])
                    setShowCreateModal(false)
                    setNewJobForm({
                      title: '', titleZh: '', industry: 'Technology', industryZh: '科技',
                      role: { title: '', titleZh: '', content: '', contentZh: '' },
                      skills: { title: '', titleZh: '', content: '', contentZh: '' },
                      knowledge: { title: '', titleZh: '', content: '', contentZh: '' }
                    })
                  }}
                  style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 16px var(--primary-glow)' }}
                >
                  {language === 'zh' ? '创建岗位' : 'Create Job'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .job-search:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
        .job-item-draggable:hover { background: var(--bg-tertiary) !important; }
        .selected-job-item:hover { border-color: var(--border-hover) !important; }
        .remove-btn:hover { color: #F87171 !important; background: rgba(248, 113, 113, 0.1) !important; }
        @media (max-width: 1024px) { .config-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 768px) { 
          .config-grid { grid-template-columns: 1fr !important; }
          .knowledge-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
