import { useState, useEffect, useRef } from 'react'
import { Send, CheckCircle, XCircle, Loader2, Filter, FolderKanban, FileText, ClipboardCheck, WifiOff } from 'lucide-react'
import { useDashboardStore } from '../stores/dashboardStore'
import { useLanguage } from '../context/LanguageContext'
import { useDeployMode } from '../context/DeployModeContext'

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
  const { projects } = useDashboardStore()
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

  // Project documentation
  const projectDocs: Record<string, { title: string; titleZh: string; content: string; contentZh: string }> = {}

  useEffect(() => {
    // Auto-select first project if available
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0] as Project)
    }
  }, [projects, selectedProject])

  useEffect(() => {
    if (selectedProject) {
      // Reset messages when project changes
      setMessages([])
      setStats({ pending: 0, clarifying: 0, confirmed: 0, rejected: 0, total: 0 })
    }
  }, [selectedProject])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

          {/* Project List - Empty State */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', padding: '0 8px' }}>
              {language === 'zh' ? '项目列表' : 'Projects'}
            </div>
            {projects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <FolderKanban size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {language === 'zh' ? '暂无项目' : 'No projects yet'}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  {language === 'zh' ? '创建项目后添加需求' : 'Create a project to add requirements'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => { setSelectedProject(project as Project); setShowDoc(false); setEvaluationResult(null) }}
                    style={{ width: '100%', textAlign: 'left', padding: '14px', borderRadius: '12px', background: selectedProject?.id === project.id ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))' : 'transparent', border: selectedProject?.id === project.id ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    className="project-btn"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedProject?.id === project.id ? 'rgba(99, 102, 241, 0.3)' : 'var(--bg-tertiary)' }}>
                        <FolderKanban size={16} style={{ color: selectedProject?.id === project.id ? '#818CF8' : '#64748B' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{getProjectName(project as Project)}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getProjectDesc(project as Project)}</div>
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
            )}
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

          {/* Messages - Empty State */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <FileText size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
                <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {language === 'zh' ? '暂无需求' : 'No requirements yet'}
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                  {language === 'zh' ? '在下方输入您的第一个需求' : 'Enter your first requirement below'}
                </p>
              </div>
            ) : (
              <>
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
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
            {!isConnected && (
              <div style={{ fontSize: '13px', color: '#F87171', marginBottom: '10px', textAlign: 'center', fontWeight: '500' }}>
                {language === 'zh' ? '⚠️ 产品经理智能体未连接' : '⚠️ Product Manager Agent Not Connected'}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={language === 'zh' ? '输入您的需求...' : 'Type your requirement...'}
                disabled={!isConnected}
                style={{ flex: 1, padding: '14px 18px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', fontSize: '14px', color: 'var(--text-primary)', transition: 'all 0.2s', opacity: isConnected ? 1 : 0.5, cursor: isConnected ? 'text' : 'not-allowed' }}
                className="requirement-input"
              />
              <button onClick={handleSend} disabled={sending || !inputMessage.trim() || !isConnected} className="btn-primary" style={{ padding: '14px 20px', opacity: isConnected ? 1 : 0.5 }}>
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
