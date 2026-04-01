import { useState, useEffect, useRef } from 'react'
import { 
  Send, CheckCircle, XCircle, Loader2, Filter, FolderKanban, 
  FileText, ClipboardCheck, WifiOff, AlertCircle, MessageSquare,
  ChevronRight, Sparkles, Clock, User, Target, Scale, Calendar,
  ArrowRight, RefreshCw, Check, X, AlertTriangle, Plus, Trash2
} from 'lucide-react'
import { useDashboardStore } from '../stores/dashboardStore'
import { useLanguage } from '../context/LanguageContext'
import { useDeployMode } from '../context/DeployModeContext'
import { api } from '../lib/api'

// Requirement interface (from API)
interface Requirement {
  id: string
  projectId: string
  title: string
  description: string
  status: 'pending' | 'clarifying' | 'confirmed' | 'rejected' | 'draft' | string
  priority: 'low' | 'medium' | 'high' | 'P0' | 'P1' | 'P2' | 'P3'
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

// Status config
const statusConfigEn = {
  pending: { label: 'Pending', color: '#64748B', bg: 'rgba(100, 116, 139, 0.12)', icon: Clock },
  clarifying: { label: 'Clarifying', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.12)', icon: AlertCircle },
  confirmed: { label: 'Confirmed', color: '#34D399', bg: 'rgba(52, 211, 153, 0.12)', icon: CheckCircle },
  rejected: { label: 'Rejected', color: '#F87171', bg: 'rgba(248, 113, 113, 0.12)', icon: XCircle },
  draft: { label: 'Draft', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)', icon: FileText },
}

const statusConfigZh = {
  pending: { label: '待处理', color: '#64748B', bg: 'rgba(100, 116, 139, 0.12)', icon: Clock },
  clarifying: { label: '待澄清', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.12)', icon: AlertCircle },
  confirmed: { label: '已确认', color: '#34D399', bg: 'rgba(52, 211, 153, 0.12)', icon: CheckCircle },
  rejected: { label: '已拒绝', color: '#F87171', bg: 'rgba(248, 113, 113, 0.12)', icon: XCircle },
  draft: { label: '草稿', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)', icon: FileText },
}

// Priority options
const priorityOptions = ['P0 - 紧急', 'P1 - 高', 'P2 - 中', 'P3 - 低']
const priorityOptionsEn = ['P0 - Urgent', 'P1 - High', 'P2 - Medium', 'P3 - Low']

// Priority badge
function PriorityBadge({ priority, language }: { priority: string; language: 'en' | 'zh' }) {
  const config: Record<string, { color: string; label: string; labelEn: string }> = {
    P0: { color: '#EF4444', label: '紧急', labelEn: 'Urgent' },
    P1: { color: '#F97316', label: '高', labelEn: 'High' },
    P2: { color: '#EAB308', label: '中', labelEn: 'Medium' },
    P3: { color: '#64748B', label: '低', labelEn: 'Low' },
    high: { color: '#F97316', label: '高', labelEn: 'High' },
    medium: { color: '#EAB308', label: '中', labelEn: 'Medium' },
    low: { color: '#64748B', label: '低', labelEn: 'Low' },
  }
  const cfg = config[priority] || config.medium
  return (
    <span style={{
      fontSize: '10px',
      fontWeight: '600',
      padding: '2px 6px',
      borderRadius: '4px',
      background: `${cfg.color}20`,
      color: cfg.color,
    }}>
      {language === 'zh' ? cfg.label : cfg.labelEn}
    </span>
  )
}

export default function Requirements() {
  const { language } = useLanguage()
  const { projects } = useDashboardStore()
  const { isConnected } = useDeployMode()
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedReq, setSelectedReq] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newReqForm, setNewReqForm] = useState({ title: '', description: '', priority: 'P2' })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch requirements when project changes
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0] as Project)
    }
  }, [projects, selectedProject])

  useEffect(() => {
    if (selectedProject) {
      fetchRequirements()
    }
  }, [selectedProject])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [requirements, selectedReq])

  const fetchRequirements = async () => {
    if (!selectedProject) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.requirements.list({ projectId: selectedProject.id })
      setRequirements(Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []))
    } catch (err: any) {
      setError(err.message || 'Failed to load requirements')
    } finally {
      setLoading(false)
    }
  }

  // Create new requirement
  const handleCreateRequirement = async () => {
    if (!newReqForm.title.trim() || !selectedProject) return
    setSending(true)
    try {
      const res = await api.requirements.create({
        projectId: selectedProject.id,
        title: newReqForm.title,
        description: newReqForm.description,
        priority: newReqForm.priority.toLowerCase(),
      })
      setRequirements(prev => [...prev, res.data])
      setShowCreateModal(false)
      setNewReqForm({ title: '', description: '', priority: 'P2' })
    } catch (err: any) {
      alert(err.message || 'Failed to create requirement')
    } finally {
      setSending(false)
    }
  }

  // Update requirement status
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await api.requirements.update(id, { status })
      setRequirements(prev => prev.map(r => r.id === id ? res.data : r))
    } catch (err: any) {
      alert(err.message || 'Failed to update requirement')
    }
  }

  // Delete requirement
  const handleDelete = async (id: string) => {
    if (!confirm(language === 'zh' ? '确定删除此需求？' : 'Delete this requirement?')) return
    try {
      await api.requirements.delete(id)
      setRequirements(prev => prev.filter(r => r.id !== id))
      if (selectedReq === id) setSelectedReq(null)
    } catch (err: any) {
      alert(err.message || 'Failed to delete requirement')
    }
  }

  // Analyze requirement
  const handleAnalyze = async (id: string) => {
    try {
      await api.requirements.analyze(id)
      // Refresh to get updated data
      fetchRequirements()
    } catch (err: any) {
      alert(err.message || 'Failed to analyze requirement')
    }
  }

  const getStatusConfig = (status: string) => {
    const cfg = language === 'zh' ? statusConfigZh : statusConfigEn
    return cfg[status as keyof typeof cfg] || cfg.pending
  }

  // Stats
  const stats = {
    total: requirements.length,
    pending: requirements.filter(r => r.status === 'pending').length,
    clarifying: requirements.filter(r => r.status === 'clarifying').length,
    confirmed: requirements.filter(r => r.status === 'confirmed').length,
    rejected: requirements.filter(r => r.status === 'rejected').length,
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div 
        className="page-container animate-fade-in"
        style={{ 
          background: 'var(--bg-primary)',
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '80px 20px',
          textAlign: 'center'
        }}>
          <Loader2 size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 24px', animation: 'spin 2s linear infinite' }} />
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {language === 'zh' ? '等待连接...' : 'Waiting for connection...'}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px' }}>
            {language === 'zh' ? '正在尝试连接服务器，请稍候' : 'Attempting to connect to server, please wait'}
          </p>
        </div>
      </div>
    )
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
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {language === 'zh' ? '需求池' : 'Requirements'}
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              {language === 'zh' ? '管理项目需求和优先级' : 'Manage project requirements and priorities'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={fetchRequirements}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={!selectedProject}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                borderRadius: '10px',
                background: selectedProject ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'var(--bg-tertiary)',
                border: 'none',
                color: selectedProject ? 'white' : 'var(--text-tertiary)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: selectedProject ? 'pointer' : 'not-allowed',
              }}
            >
              <Plus size={14} />
              {language === 'zh' ? '添加需求' : 'Add Requirement'}
            </button>
          </div>
        </div>
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

      {/* Main Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', height: 'calc(100vh - 200px)' }} className="requirements-grid">
        {/* Left Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {[
              { key: 'total', label: language === 'zh' ? '全部' : 'Total' },
              { key: 'pending', label: language === 'zh' ? '待处理' : 'Pending' },
              { key: 'clarifying', label: language === 'zh' ? '澄清中' : 'Clarifying' },
              { key: 'confirmed', label: language === 'zh' ? '已确认' : 'Confirmed' },
            ].map(item => (
              <div key={item.key} style={{ 
                padding: '12px', 
                borderRadius: '12px', 
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {stats[item.key as keyof typeof stats]}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Requirement List */}
          <div style={{ 
            flex: 1, 
            overflow: 'auto',
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '12px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px' }}>
              {language === 'zh' ? '需求列表' : 'Requirements'}
            </div>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <Loader2 size={24} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {language === 'zh' ? '加载中...' : 'Loading...'}
                </p>
              </div>
            ) : requirements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <MessageSquare size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {language === 'zh' ? '暂无需求' : 'No requirements yet'}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {language === 'zh' ? '点击右上角添加需求' : 'Click top right to add a requirement'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {requirements.map(req => {
                  const cfg = getStatusConfig(req.status)
                  return (
                    <button
                      key={req.id}
                      onClick={() => setSelectedReq(req.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px',
                        borderRadius: '12px',
                        background: selectedReq === req.id ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-tertiary)',
                        border: selectedReq === req.id ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: cfg.color,
                          marginTop: '6px',
                          flexShrink: 0,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ 
                            fontSize: '13px', 
                            color: 'var(--text-primary)',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {req.title}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                            <span style={{ fontSize: '10px', color: cfg.color, fontWeight: '500' }}>
                              {cfg.label}
                            </span>
                            <PriorityBadge priority={req.priority} language={language} />
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Content */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          {!selectedReq ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.15))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px',
              }}>
                <Sparkles size={32} style={{ color: '#8B5CF6' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                {language === 'zh' ? '需求详情' : 'Requirement Details'}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', textAlign: 'center', maxWidth: '400px' }}>
                {language === 'zh' 
                  ? '从左侧列表选择一个需求查看详情'
                  : 'Select a requirement from the left list to view details'}
              </p>
            </div>
          ) : (
            <>
              {/* Selected requirement detail */}
              {(() => {
                const req = requirements.find(r => r.id === selectedReq)
                if (!req) return null
                const cfg = getStatusConfig(req.status)
                return (
                  <>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: '12px',
                            background: `${cfg.color}20`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <FileText size={18} style={{ color: cfg.color }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                              {req.title}
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '500',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: cfg.bg,
                                color: cfg.color,
                              }}>
                                {cfg.label}
                              </span>
                              <PriorityBadge priority={req.priority} language={language} />
                              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                {new Date(req.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleAnalyze(req.id)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: 'var(--bg-tertiary)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-secondary)',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title={language === 'zh' ? 'AI 分析' : 'AI Analyze'}
                          >
                            <Sparkles size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(req.id)}
                            style={{
                              padding: '8px',
                              borderRadius: '8px',
                              background: 'var(--bg-tertiary)',
                              border: '1px solid var(--border)',
                              color: '#F87171',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title={language === 'zh' ? '删除' : 'Delete'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                      {/* Description */}
                      {req.description && (
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                            {language === 'zh' ? '描述' : 'Description'}
                          </h4>
                          <div style={{
                            padding: '14px',
                            borderRadius: '10px',
                            background: 'var(--bg-tertiary)',
                            fontSize: '14px',
                            color: 'var(--text-primary)',
                            lineHeight: 1.6,
                          }}>
                            {req.description}
                          </div>
                        </div>
                      )}

                      {/* Status actions */}
                      <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                          {language === 'zh' ? '更新状态' : 'Update Status'}
                        </h4>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {['pending', 'clarifying', 'confirmed', 'rejected', 'draft'].map(status => {
                            const sCfg = getStatusConfig(status)
                            const StatusIcon = sCfg.icon
                            return (
                              <button
                                key={status}
                                onClick={() => handleUpdateStatus(req.id, status)}
                                disabled={req.status === status}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '8px 14px',
                                  borderRadius: '8px',
                                  background: req.status === status ? sCfg.bg : 'var(--bg-tertiary)',
                                  border: `1px solid ${req.status === status ? sCfg.color : 'var(--border)'}`,
                                  color: req.status === status ? sCfg.color : 'var(--text-secondary)',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  cursor: req.status === status ? 'not-allowed' : 'pointer',
                                  opacity: req.status === status ? 1 : 0.7,
                                }}
                              >
                                <StatusIcon size={12} />
                                {sCfg.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-tertiary)' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                            {language === 'zh' ? '创建时间' : 'Created'}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                            {new Date(req.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-tertiary)' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                            {language === 'zh' ? '更新时间' : 'Updated'}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                            {new Date(req.updatedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              width: '90%',
              maxWidth: '480px',
              padding: '24px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
              {language === 'zh' ? '添加需求' : 'Add Requirement'}
            </h2>
            
            {/* Title */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? '标题' : 'Title'} *
              </label>
              <input
                type="text"
                value={newReqForm.title}
                onChange={e => setNewReqForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder={language === 'zh' ? '输入需求标题' : 'Enter requirement title'}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            
            {/* Description */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? '描述' : 'Description'}
              </label>
              <textarea
                value={newReqForm.description}
                onChange={e => setNewReqForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={language === 'zh' ? '详细描述需求内容' : 'Describe the requirement in detail'}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            
            {/* Priority */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
                {language === 'zh' ? '优先级' : 'Priority'}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['P0', 'P1', 'P2', 'P3'].map(p => (
                  <button
                    key={p}
                    onClick={() => setNewReqForm(prev => ({ ...prev, priority: p }))}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: newReqForm.priority === p ? `2px solid ${{ P0: '#EF4444', P1: '#F97316', P2: '#EAB308', P3: '#64748B' }[p]}` : '1px solid var(--border)',
                      background: newReqForm.priority === p ? `${ { P0: '#EF4444', P1: '#F97316', P2: '#EAB308', P3: '#64748B' }[p]}15` : 'var(--bg-tertiary)',
                      color: newReqForm.priority === p ? { P0: '#EF4444', P1: '#F97316', P2: '#EAB308', P3: '#64748B' }[p] : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={sending}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleCreateRequirement}
                disabled={!newReqForm.title.trim() || sending}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: newReqForm.title.trim() && !sending
                    ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                    : 'var(--bg-tertiary)',
                  color: newReqForm.title.trim() && !sending ? 'white' : 'var(--text-tertiary)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: newReqForm.title.trim() && !sending ? 'pointer' : 'not-allowed',
                }}
              >
                {sending ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    {language === 'zh' ? '创建中...' : 'Creating...'}
                  </span>
                ) : (
                  language === 'zh' ? '创建' : 'Create'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .requirements-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
