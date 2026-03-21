import { useState, useEffect, useRef } from 'react'
import { Send, CheckCircle, XCircle, Loader2, Filter, FolderKanban, FileText, ClipboardCheck, WifiOff } from 'lucide-react'
import { useDashboardStore } from '../stores/dashboardStore'
import { useLanguage } from '../context/LanguageContext'
import { useDeployMode } from '../context/DeployModeContext'
import { requirementsApi } from '../api'
import FileUpload from '../components/FileUpload'

interface Requirement {
  id: string
  projectId: string
  content: string
  contentZh: string
  status: 'pending' | 'clarifying' | 'confirmed' | 'rejected'
  source: 'user' | 'pm'
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  name: string
  nameZh: string
  description: string
  descZh: string
  status: string
  createdAt: string
  updatedAt: string
}

const statusConfigEn = {
  pending: { label: 'Pending', color: '#64748B', bg: 'rgba(100, 116, 139, 0.12)' },
  clarifying: { label: 'Clarifying', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.12)' },
  confirmed: { label: 'Confirmed', color: '#34D399', bg: 'rgba(52, 211, 153, 0.12)' },
  rejected: { label: 'Rejected', color: '#F87171', bg: 'rgba(248, 113, 113, 0.12)' },
}

const statusConfigZh = {
  pending: { label: '待处理', color: '#64748B', bg: 'rgba(100, 116, 139, 0.12)' },
  clarifying: { label: '待澄清', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.12)' },
  confirmed: { label: '已确认', color: '#34D399', bg: 'rgba(52, 211, 153, 0.12)' },
  rejected: { label: '已拒绝', color: '#F87171', bg: 'rgba(248, 113, 113, 0.12)' },
}

export default function Requirements() {
  const { language } = useLanguage()
  const { setProjects } = useDashboardStore()
  const { isConnected } = useDeployMode()
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [messages, setMessages] = useState<Requirement[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [stats, setStats] = useState({ pending: 0, clarifying: 0, confirmed: 0, rejected: 0, total: 0 })
  const [showDoc, setShowDoc] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const mockProjects: Project[] = [
    { id: '1', name: 'E-commerce Platform', nameZh: '电商平台', description: 'Full-stack e-commerce', descZh: '全栈电商平台', status: 'in_progress', createdAt: '2026-03-10T08:00:00Z', updatedAt: '2026-03-18T10:00:00Z' },
    { id: '2', name: 'Mobile App', nameZh: '移动端App', description: 'React Native development', descZh: 'React Native 开发', status: 'pending', createdAt: '2026-03-15T08:00:00Z', updatedAt: '2026-03-15T08:00:00Z' },
  ]

  const mockMessages: Record<string, Requirement[]> = {
    '1': [
      { id: 'm1', projectId: '1', content: 'I want a user registration and login feature with phone and email support', contentZh: '我想要一个用户注册登录功能，支持手机号和邮箱', status: 'confirmed', source: 'user', createdAt: '2026-03-10T08:00:00Z', updatedAt: '2026-03-10T08:00:00Z' },
      { id: 'm2', projectId: '1', content: 'Got it! Your requirement has been confirmed. I will create tasks: User registration API, SMS/Email verification, Login authentication, Token management', contentZh: '收到！您的需求已确认。我会创建以下任务：用户注册API、短信/邮箱验证码、登录验证、Token管理', status: 'pending', source: 'pm', createdAt: '2026-03-10T08:05:00Z', updatedAt: '2026-03-10T08:05:00Z' },
    ],
    '2': [
      { id: 'm3', projectId: '2', content: 'Need to develop a chat feature', contentZh: '需要开发一个聊天功能', status: 'clarifying', source: 'user', createdAt: '2026-03-15T09:00:00Z', updatedAt: '2026-03-15T09:00:00Z' },
      { id: 'm4', projectId: '2', content: 'Got it! For the chat feature, I need to clarify: 1. Single chat or group chat? 2. Need to support images/files? 3. Message encryption required?', contentZh: '好的，关于聊天功能，我需要确认：1. 是单聊还是群聊？2. 需要支持图片/文件吗？3. 消息需要加密吗？', status: 'pending', source: 'pm', createdAt: '2026-03-15T09:05:00Z', updatedAt: '2026-03-15T09:05:00Z' },
    ],
  }

  // Mock project documentation
  const projectDocs: Record<string, { title: string; titleZh: string; content: string; contentZh: string }> = {
    '1': {
      title: 'E-commerce Platform - Project Specification',
      titleZh: '电商平台 - 项目规格说明书',
      content: `# Project Overview\n\nA full-stack e-commerce platform with user authentication, product management, and payment processing.\n\n## Core Features\n\n1. **User Authentication**\n   - Phone and email registration\n   - Social login (Google, Facebook)\n   - Two-factor authentication\n\n2. **Product Management**\n   - Product catalog with categories\n   - Search and filtering\n   - Inventory tracking\n\n3. **Shopping Cart**\n   - Persistent cart\n   - Wishlist functionality\n   - Price calculation\n\n4. **Payment Processing**\n   - Stripe integration\n   - Multiple payment methods\n   - Invoice generation\n\n## Technical Stack\n\n- Frontend: React 18, TypeScript, TailwindCSS\n- Backend: Node.js, Express, PostgreSQL\n- Cache: Redis\n- Search: Elasticsearch`,
      contentZh: `# 项目概述\n\n一个全栈电商平台，包含用户认证、商品管理和支付处理。\n\n## 核心功能\n\n1. **用户认证**\n   - 手机号和邮箱注册\n   - 社交登录（Google、Facebook）\n   - 双因素认证\n\n2. **商品管理**\n   - 商品目录和分类\n   - 搜索和筛选\n   - 库存跟踪\n\n3. **购物车**\n   - 持久化购物车\n   - 愿望清单功能\n   - 价格计算\n\n4. **支付处理**\n   - Stripe集成\n   - 多种支付方式\n   - 发票生成\n\n## 技术栈\n\n- 前端：React 18、TypeScript、TailwindCSS\n- 后端：Node.js、Express、PostgreSQL\n- 缓存：Redis\n- 搜索：Elasticsearch`
    },
    '2': {
      title: 'Mobile App - Project Specification',
      titleZh: '移动端App - 项目规格说明书',
      content: `# Mobile App Specification\n\nA React Native mobile application for...`,
      contentZh: `# 移动端App规格说明书\n\n一个React Native移动应用...`
    }
  }

  useEffect(() => {
    // Load projects from API
    const loadData = async () => {
      try {
        const { default: projectsApi } = await import('../api')
        const projectsData = await projectsApi.projects.getAll()
        const transformed = projectsData.map((p: any) => ({
          id: p.id,
          name: p.name,
          nameZh: p.name,
          description: p.description,
          descZh: p.description,
          status: p.status,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }))
        setProjects(transformed as any)
        if (transformed.length > 0) {
          setSelectedProject(transformed[0])
        }
      } catch (error) {
        console.error('Failed to load projects:', error)
        setProjects(mockProjects as any)
        setSelectedProject(mockProjects[0])
      }
    }
    
    loadData()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      // Try to load from API first
      const loadRequirements = async () => {
        try {
          const data = await requirementsApi.getByProject(selectedProject.id)
          if (data && data.length > 0) {
            setMessages(data.map((r: any) => ({
              id: r.id,
              projectId: r.project_id,
              content: r.content,
              contentZh: r.title,
              status: 'confirmed',
              source: 'user',
              createdAt: r.created_at,
              updatedAt: r.created_at,
            })))
            return
          }
        } catch (error) {
          console.error('Failed to load requirements:', error)
        }
        
        // Fallback to mock
        const projectMessages = mockMessages[selectedProject.id] || []
        setMessages(projectMessages)
      }
      
      loadRequirements()
      
      const s = { pending: 0, clarifying: 0, confirmed: 0, rejected: 0, total: 0 }
      setStats(s)
    }
  }, [selectedProject])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle file upload
  const handleFileUpload = async (file: File, content: string) => {
    if (!selectedProject) return
    
    setSending(true)
    try {
      const result = await requirementsApi.upload(selectedProject.id, {
        title: file.name,
        content: content,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      })
      
      // Add to messages
      const newMsg: Requirement = {
        id: result.id,
        projectId: selectedProject.id,
        content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        contentZh: file.name,
        status: 'confirmed',
        source: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setMessages(prev => [...prev, newMsg])
    } catch (error) {
      console.error('Upload failed:', error)
      alert(language === 'zh' ? '上传失败' : 'Upload failed')
    } finally {
      setSending(false)
    }
  }

  const handleSend = async () => {
    if (!inputMessage.trim()) return
    setSending(true)
    await new Promise(r => setTimeout(r, 1000))
    const newMsg: Requirement = {
      id: `m${Date.now()}`,
      projectId: selectedProject?.id || '1',
      content: inputMessage,
      contentZh: inputMessage,
      status: 'pending',
      source: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, newMsg])
    setInputMessage('')
    setSending(false)
  }

  const handleEvaluate = async () => {
    if (!selectedProject) return
    setEvaluating(true)
    setEvaluationResult(null)
    
    // Simulate evaluation process
    await new Promise(r => setTimeout(r, 2000))
    
    // Mock evaluation result - passes if confirmed requirements > 0
    const confirmedCount = messages.filter(m => m.source === 'user' && m.status === 'confirmed').length
    if (confirmedCount > 0) {
      setEvaluationResult('pass')
      // Auto move project to pending_dev
      if (selectedProject.status === 'evaluating') {
        const updated = mockProjects.map(p => 
          p.id === selectedProject.id ? { ...p, status: 'pending_dev' } : p
        )
        setProjects(updated as any)
        // Update selected project
        setSelectedProject({ ...selectedProject, status: 'pending_dev' })
      }
    } else {
      setEvaluationResult('fail')
    }
    setEvaluating(false)
  }

  const getStatusConfig = (status: string) => {
    return language === 'zh' ? statusConfigZh[status as keyof typeof statusConfigZh] : statusConfigEn[status as keyof typeof statusConfigEn]
  }

  const getProjectName = (p: Project) => language === 'zh' ? p.nameZh : p.name
  const getProjectDesc = (p: Project) => language === 'zh' ? p.descZh : p.description

  const currentDoc = selectedProject ? projectDocs[selectedProject.id] : null

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
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
          {language === 'zh' ? '需求池' : 'Requirements'}
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
          {language === 'zh' ? '管理项目需求和对话' : 'Manage project requirements and conversations'}
        </p>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', height: showDoc ? 'calc(100vh - 280px)' : 'calc(100vh - 200px)' }} className="requirements-grid">
        {/* Left Sidebar - Projects */}
        <div className="card animate-slide-up stagger-1" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {Object.entries(language === 'zh' ? statusConfigZh : statusConfigEn).map(([key, cfg]) => (
              <div key={key} style={{ padding: '12px', borderRadius: '12px', background: cfg.bg, border: `1px solid ${cfg.color}20` }}>
                <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'Cabinet Grotesk', color: cfg.color, lineHeight: 1 }}>{stats[key as keyof typeof stats]}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cfg.label}</div>
              </div>
            ))}
          </div>

          {/* Project List */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', padding: '0 8px' }}>
              {language === 'zh' ? '项目列表' : 'Projects'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {mockProjects.map(project => (
                <button
                  key={project.id}
                  onClick={() => { setSelectedProject(project); setShowDoc(false); setEvaluationResult(null) }}
                  style={{ width: '100%', textAlign: 'left', padding: '14px', borderRadius: '12px', background: selectedProject?.id === project.id ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))' : 'transparent', border: selectedProject?.id === project.id ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  className="project-btn"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedProject?.id === project.id ? 'rgba(99, 102, 241, 0.3)' : 'var(--bg-tertiary)' }}>
                      <FolderKanban size={16} style={{ color: selectedProject?.id === project.id ? '#818CF8' : '#64748B' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{getProjectName(project)}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getProjectDesc(project)}</div>
                    </div>
                  </div>
                  {/* Action Icons */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowDoc(!showDoc); setEvaluationResult(null) }}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px', borderRadius: '6px', background: showDoc ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-tertiary)', border: 'none', cursor: 'pointer', fontSize: '10px', color: showDoc ? '#818CF8' : 'var(--text-tertiary)' }}
                      title={language === 'zh' ? '查看文档' : 'View Doc'}
                    >
                      <FileText size={12} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEvaluate() }}
                      disabled={evaluating}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px', borderRadius: '6px', background: evaluationResult === 'pass' ? 'rgba(52, 211, 153, 0.2)' : evaluationResult === 'fail' ? 'rgba(248, 113, 113, 0.2)' : 'var(--bg-tertiary)', border: 'none', cursor: evaluating ? 'wait' : 'pointer', fontSize: '10px', color: evaluationResult === 'pass' ? '#34D399' : evaluationResult === 'fail' ? '#F87171' : 'var(--text-tertiary)' }}
                      title={language === 'zh' ? '评估项目' : 'Evaluate'}
                    >
                      <ClipboardCheck size={12} />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="card animate-slide-up stagger-2" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                {selectedProject ? getProjectName(selectedProject) : (language === 'zh' ? '选择项目' : 'Select a project')}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
                {stats.total} {language === 'zh' ? '条需求' : 'requirements'}
              </p>
            </div>
            <button className="btn-icon" style={{ width: '36px', height: '36px' }}>
              <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>

          {/* Doc Panel */}
          {showDoc && currentDoc && (
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(99, 102, 241, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <FileText size={16} style={{ color: '#818CF8' }} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {language === 'zh' ? '项目构建文档' : 'Project Spec'}
                </span>
              </div>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-primary)', maxHeight: '200px', overflow: 'auto' }}>
                <pre style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
                  {language === 'zh' ? currentDoc.contentZh : currentDoc.content}
                </pre>
              </div>
            </div>
          )}

          {/* Evaluation Result */}
          {evaluationResult && (
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: evaluationResult === 'pass' ? 'rgba(52, 211, 153, 0.08)' : 'rgba(248, 113, 113, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {evaluationResult === 'pass' ? (
                  <>
                    <CheckCircle size={16} style={{ color: '#34D399' }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#34D399' }}>
                      {language === 'zh' ? '✓ 评估通过！项目已移至"待开发"分类' : '✓ Evaluation passed! Project moved to "Pending Development"'}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} style={{ color: '#F87171' }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#F87171' }}>
                      {language === 'zh' ? '✗ 评估未通过。请先确认至少一条需求。' : '✗ Evaluation failed. Please confirm at least one requirement first.'}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: msg.source === 'user' ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'linear-gradient(135deg, #10B981, #14B8A6)', boxShadow: msg.source === 'user' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                  <span style={{ color: 'white', fontSize: '12px', fontWeight: '700' }}>{msg.source === 'user' ? 'U' : 'AI'}</span>
                </div>
                <div style={{ flex: 1, maxWidth: '80%' }}>
                  <div style={{ padding: '14px 18px', borderRadius: '16px', borderTopLeftRadius: '4px', background: msg.source === 'user' ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'var(--bg-tertiary)', color: '#F8FAFC', fontSize: '14px', lineHeight: '1.6' }}>
                    {language === 'zh' && msg.contentZh ? msg.contentZh : msg.content}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', paddingLeft: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{new Date(msg.createdAt).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}</span>
                    {msg.source === 'user' && (
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '100px', background: getStatusConfig(msg.status).bg, color: getStatusConfig(msg.status).color }}>
                        {getStatusConfig(msg.status).label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={language === 'zh' ? '输入您的需求...' : 'Type your requirement...'}
                style={{ flex: 1, padding: '14px 18px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', fontSize: '14px', color: 'var(--text-primary)', transition: 'all 0.2s' }}
                className="requirement-input"
              />
              
              {/* File Upload Button */}
              <FileUpload 
                onUpload={handleFileUpload} 
                disabled={sending}
                language={language}
              />
              
              <button onClick={handleSend} disabled={sending || !inputMessage.trim()} className="btn-primary" style={{ padding: '14px 20px' }}>
                {sending ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .project-btn:hover { background: var(--bg-tertiary) !important; }
        .requirement-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        /* Mobile Responsive */
        @media (max-width: 1024px) {
          .requirements-grid {
            grid-template-columns: 280px 1fr !important;
          }
        }
        
        @media (max-width: 768px) {
          .requirements-grid {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto 1fr !important;
            height: auto !important;
            min-height: calc(100vh - 180px);
          }
        }
      `}</style>
    </div>
  )
}
