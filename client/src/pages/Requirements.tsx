import { useState, useEffect, useRef } from 'react'
import { 
  Send, CheckCircle, XCircle, Loader2, Filter, FolderKanban, 
  FileText, ClipboardCheck, WifiOff, AlertCircle, MessageSquare,
  ChevronRight, Sparkles, Clock, User, Target, Scale, Calendar,
  ArrowRight, RefreshCw, Check, X, AlertTriangle
} from 'lucide-react'
import { useDashboardStore } from '../stores/dashboardStore'
import { useLanguage } from '../context/LanguageContext'
import { useDeployMode } from '../context/DeployModeContext'

// Requirement interface
interface Requirement {
  id: string
  projectId: string
  content: string
  contentZh: string
  status: 'pending' | 'clarifying' | 'confirmed' | 'rejected' | 'draft'
  source: 'user' | 'pm'
  rounds: number
  confirmations: ConfirmationBlock[]
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

// PM structured confirmation block
interface ConfirmationBlock {
  id: string
  type: 'context' | 'clarification' | 'missing_info' | 'confirmation' | 'final'
  question: string
  questionZh: string
  options?: string[]
  optionsZh?: string[]
  answer?: string
  answerZh?: string
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

// PM Agent persona
const pmPrompt = {
  welcome: {
    en: "Hi! I'm your PM Agent. To confirm your requirement efficiently, I follow a 3-round process. Please describe what you need.",
    zh: "你好！我是 PM Agent。为了高效确认需求，我会遵循3轮对话流程。请描述你的需求。"
  },
  phase1: {
    question: {
      en: "Got it! To understand better, please tell me:\n1. **What problem** does this solve?\n2. **Which systems/roles** are involved?\n3. **Any reference cases or constraints**?",
      zh: "收到！为了更好理解，请告诉我：\n1. 这个需求**解决什么问题**？\n2. **涉及哪些系统/角色**？\n3. 有无**参考案例或约束条件**？"
    }
  },
  phase2: {
    intro: {
      en: "My understanding so far:",
      zh: "目前我的理解是："
    },
    confirmPrompt: {
      en: "Please confirm or correct:\n• **Goal**: [summary]\n• **Scope**: [in/out]\n• **Priority**: [P0/P1/P2]\n• **Deadline**: [date or TBD]",
      zh: "请确认或纠正：\n• **目标**：[摘要]\n• **范围**：[做什么/不做什么]\n• **优先级**：[P0/P1/P2]\n• **截止时间**：[日期或待定]"
    }
  },
  phase3: {
    missing: {
      en: "To proceed, I need:\n□ [Missing info 1]\n□ [Missing info 2]\n\nPlease fill in, or tell me which can be added later.",
      zh: "还缺以下信息才能排期：\n□ [缺失项1]\n□ [缺失项2]\n\n请补充，或告诉我哪些可以后补。"
    }
  },
  fuzzy: {
    prompt: {
      en: "I couldn't understand this clearly. Could you describe it in a complete sentence?\n**[Who]** + **[does what]** + **[gets what result]**\n\nExample: '让用户可以通过微信登录'",
      zh: "这个描述我还没理解清楚。能否用一个完整的句子描述：\n**[谁]** + **[做什么]** + **[得到什么结果]**\n\n例如：'让用户可以通过微信登录'"
    }
  },
  confirmed: {
    en: "✅ Requirement confirmed! Generating structured summary...",
    zh: "✅ 需求已确认！正在生成结构化摘要..."
  },
  draft: {
    en: "⚠️ This requirement is still unclear after 3 rounds. Marked as draft. You can补充信息后重新激活.",
    zh: "⚠️ 此需求经3轮对话仍不清晰，已标记为草稿。可补充信息后重新激活。"
  }
}

// Priority options
const priorityOptions = ['P0 - 紧急', 'P1 - 高', 'P2 - 中', 'P3 - 低']
const priorityOptionsEn = ['P0 - Urgent', 'P1 - High', 'P2 - Medium', 'P3 - Low']

// Requirement confirmation card
function RequirementConfirmationCard({ 
  req, 
  onAnswer,
  language 
}: { 
  req: Requirement
  onAnswer: (reqId: string, answer: string, type: string) => void
  language: 'en' | 'zh'
}) {
  const lastConfirmation = req.confirmations[req.confirmations.length - 1]
  const isMultiChoice = lastConfirmation?.options && lastConfirmation.options.length > 0
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(139, 92, 246, 0.02))',
      border: '1px solid rgba(139, 92, 246, 0.2)',
      borderRadius: '16px',
      padding: '20px',
      marginTop: '12px',
    }}>
      {/* PM Agent header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '10px',
          background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={16} style={{ color: 'white' }} />
        </div>
        <div>
          <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
            PM Agent
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            {language === 'zh' ? '结构化需求确认' : 'Structured Requirement Confirmation'}
          </div>
        </div>
      </div>

      {/* Question */}
      <div style={{
        background: 'var(--bg-tertiary)',
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '12px',
      }}>
        <p style={{ 
          fontSize: '14px', 
          color: 'var(--text-primary)',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          margin: 0,
        }}>
          {lastConfirmation ? (language === 'zh' ? lastConfirmation.questionZh : lastConfirmation.question) : (language === 'zh' ? pmPrompt.welcome.zh : pmPrompt.welcome.en)}
        </p>
      </div>

      {/* Options or input */}
      {isMultiChoice ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(language === 'zh' ? (lastConfirmation.optionsZh || lastConfirmation.options) : lastConfirmation.options)?.map((opt, i) => (
            <button
              key={i}
              onClick={() => onAnswer(req.id, opt, 'choice')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#8B5CF6'
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = 'var(--bg-tertiary)'
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '6px',
                border: '2px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ChevronRight size={12} style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{opt}</span>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder={language === 'zh' ? '输入你的回答...' : 'Type your answer...'}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value
                if (value.trim()) {
                  onAnswer(req.id, value, 'text')
                  ;(e.target as HTMLInputElement).value = ''
                }
              }
            }}
          />
          <button
            onClick={e => {
              const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement
              if (input?.value.trim()) {
                onAnswer(req.id, input.value.trim(), 'text')
                input.value = ''
              }
            }}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
              border: 'none',
              color: 'white',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            <Send size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

// Final requirement summary card
function RequirementSummaryCard({ req, language }: { req: Requirement; language: 'en' | 'zh' }) {
  const confirmations = req.confirmations
  
  // Extract info from confirmations
  const getField = (type: string) => {
    const c = confirmations.find(c => c.type === type)
    return c ? (language === 'zh' ? c.answerZh : c.answer) : null
  }
  
  const goal = getField('goal') || getField('context') || confirmations[0]?.answer || '-'
  const scope = getField('scope') || '-'
  const priority = getField('priority') || 'P2'
  const deadline = getField('deadline') || (language === 'zh' ? '待定' : 'TBD')
  const target = getField('target') || '-'
  const constraint = getField('constraint') || '-'
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.08), rgba(52, 211, 153, 0.02))',
      border: '1px solid rgba(52, 211, 153, 0.2)',
      borderRadius: '16px',
      padding: '20px',
      marginTop: '12px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '10px',
          background: 'linear-gradient(135deg, #34D399, #10B981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircle size={16} style={{ color: 'white' }} />
        </div>
        <div>
          <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
            {language === 'zh' ? '需求确认单' : 'Requirement Confirmation'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            ID: {req.id.slice(0, 8).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Fields grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {[
          { label: language === 'zh' ? '标题' : 'Title', value: goal, icon: Target },
          { label: language === 'zh' ? '目标' : 'Goal', value: target, icon: Sparkles },
          { label: language === 'zh' ? '范围' : 'Scope', value: scope, icon: Scale },
          { label: language === 'zh' ? '优先级' : 'Priority', value: priority, icon: AlertTriangle, highlight: true },
          { label: language === 'zh' ? '截止时间' : 'Deadline', value: deadline, icon: Calendar },
          { label: language === 'zh' ? '约束条件' : 'Constraints', value: constraint, icon: FileText },
        ].map((field, i) => (
          <div key={i} style={{
            background: 'var(--bg-tertiary)',
            borderRadius: '10px',
            padding: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <field.icon size={12} style={{ color: field.highlight ? '#FBBF24' : 'var(--text-tertiary)' }} />
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {field.label}
              </span>
            </div>
            <div style={{ 
              fontSize: '13px', 
              fontWeight: field.highlight ? '600' : '400',
              color: field.highlight ? '#FBBF24' : 'var(--text-primary)',
            }}>
              {field.value}
            </div>
          </div>
        ))}
      </div>

      {/* Status badge */}
      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '8px',
          background: 'rgba(52, 211, 153, 0.15)',
        }}>
          <Check size={12} style={{ color: '#34D399' }} />
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#34D399' }}>
            {language === 'zh' ? '已确认' : 'Confirmed'}
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
          {language === 'zh' ? '可进入项目规划' : 'Ready for project planning'}
        </span>
      </div>
    </div>
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0] as Project)
    }
  }, [projects, selectedProject])

  useEffect(() => {
    if (selectedProject) {
      setRequirements([])
      setSelectedReq(null)
    }
  }, [selectedProject])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [requirements])

  // Analyze requirement for vagueness
  const analyzeRequirement = (content: string): { isFuzzy: boolean; reason: string } => {
    const hasVerb = /[做|实现|添加|创建|修改|删除|优化|修复|提供|支持]/i.test(content)
    const hasSubject = /[用户|系统|管理员|客户|员工]/i.test(content)
    const hasObject = /[功能|页面|模块|接口|流程|数据]/i.test(content)
    
    if (!hasVerb || (!hasSubject && !hasObject)) {
      return { isFuzzy: true, reason: 'missing_structure' }
    }
    return { isFuzzy: false, reason: '' }
  }

  // Handle answer from PM confirmation
  const handleAnswer = (reqId: string, answer: string, type: string) => {
    setRequirements(prev => prev.map(req => {
      if (req.id !== reqId) return req
      
      const newConfirmation: ConfirmationBlock = {
        id: `cf-${Date.now()}`,
        type: 'confirmation',
        question: 'Your answer',
        questionZh: '你的回答',
        answer: answer,
        answerZh: answer,
      }
      
      const newRounds = req.rounds + 1
      const newConfirmations = [...req.confirmations, newConfirmation]
      
      // Check if confirmed (after enough rounds)
      if (newRounds >= 3 && type === 'choice' && answer.includes('Confirm')) {
        return {
          ...req,
          status: 'confirmed' as const,
          rounds: newRounds,
          confirmations: newConfirmations,
          updatedAt: new Date().toISOString(),
        }
      }
      
      // Generate next question based on round
      let nextConfirmation: ConfirmationBlock
      
      if (req.rounds === 0) {
        // Phase 1: Ask about context
        nextConfirmation = {
          id: `cf-${Date.now()}`,
          type: 'context',
          question: pmPrompt.phase1.question.en,
          questionZh: pmPrompt.phase1.question.zh,
        }
      } else if (req.rounds === 1) {
        // Phase 2: Ask for structured confirmation
        nextConfirmation = {
          id: `cf-${Date.now()}`,
          type: 'confirmation',
          question: pmPrompt.phase2.confirmPrompt.en,
          questionZh: pmPrompt.phase2.confirmPrompt.zh,
          options: ['✅ Confirm & continue', '❌ Needs correction'],
          optionsZh: ['✅ 确认并继续', '❌ 需要修改'],
        }
      } else if (req.rounds === 2) {
        // Phase 3: Ask for missing info
        nextConfirmation = {
          id: `cf-${Date.now()}`,
          type: 'missing_info',
          question: pmPrompt.phase3.missing.en,
          questionZh: pmPrompt.phase3.missing.zh,
          options: ['📋 Add missing info', '⏭️ Add later'],
          optionsZh: ['📋 补充缺失信息', '⏭️ 稍后补充'],
        }
      } else {
        // Too many rounds - mark as draft
        nextConfirmation = {
          id: `cf-${Date.now()}`,
          type: 'final',
          question: pmPrompt.draft.en,
          questionZh: pmPrompt.draft.zh,
        }
        return {
          ...req,
          status: 'draft' as const,
          rounds: newRounds,
          confirmations: [...newConfirmations.slice(0, -1), nextConfirmation],
          updatedAt: new Date().toISOString(),
        }
      }
      
      return {
        ...req,
        status: 'clarifying' as const,
        rounds: newRounds,
        confirmations: [...newConfirmations.slice(0, -1), nextConfirmation],
        updatedAt: new Date().toISOString(),
      }
    }))
  }

  // Submit new requirement
  const handleSend = async () => {
    if (!inputMessage.trim() || !selectedProject) return
    setSending(true)
    
    const analysis = analyzeRequirement(inputMessage)
    
    const newReq: Requirement = {
      id: `req-${Date.now()}`,
      projectId: selectedProject.id,
      content: inputMessage,
      contentZh: inputMessage,
      status: analysis.isFuzzy ? 'clarifying' : 'pending',
      source: 'user',
      rounds: 0,
      confirmations: analysis.isFuzzy ? [{
        id: `cf-${Date.now()}`,
        type: 'clarification',
        question: pmPrompt.fuzzy.prompt.en,
        questionZh: pmPrompt.fuzzy.prompt.zh,
      }] : [{
        id: `cf-${Date.now()}`,
        type: 'context',
        question: pmPrompt.phase1.question.en,
        questionZh: pmPrompt.phase1.question.zh,
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    setRequirements(prev => [...prev, newReq])
    setSelectedReq(newReq.id)
    setInputMessage('')
    setSending(false)
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
          {language === 'zh' ? 'PM Agent 结构化需求确认 · 3轮内明确需求' : 'PM Agent Structured Requirement Confirmation · 3 Rounds to Clarity'}
        </p>
      </div>

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
            
            {requirements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <MessageSquare size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {language === 'zh' ? '暂无需求' : 'No requirements yet'}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {language === 'zh' ? '在右侧输入需求开始对话' : 'Type a requirement on the right to start'}
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
                            {req.content}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                            <span style={{ fontSize: '10px', color: cfg.color, fontWeight: '500' }}>
                              {cfg.label}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                              · {req.rounds}/3
                            </span>
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
                {language === 'zh' ? 'PM Agent 需求确认' : 'PM Agent Requirement Confirmation'}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', textAlign: 'center', maxWidth: '400px' }}>
                {language === 'zh' 
                  ? '在下方输入需求，PM Agent 会通过3轮结构化对话帮你明确需求，确保不遗漏关键信息。'
                  : 'Type a requirement below and PM Agent will clarify it through 3 rounds of structured dialogue.'}
              </p>
              
              {/* Process steps */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                {[
                  { num: '1', label: language === 'zh' ? '开放提问' : 'Open Questions' },
                  { num: '2', label: language === 'zh' ? '结构确认' : 'Confirmation' },
                  { num: '3', label: language === 'zh' ? '信息补全' : 'Fill Gaps' },
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '8px',
                      background: 'rgba(139, 92, 246, 0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: '700', color: '#8B5CF6',
                    }}>
                      {step.num}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {step.label}
                    </span>
                    {i < 2 && <ArrowRight size={14} style={{ color: 'var(--text-tertiary)' }} />}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Selected requirement detail */}
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '12px',
                    background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <User size={18} style={{ color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)', margin: 0 }}>
                      {requirements.find(r => r.id === selectedReq)?.content}
                    </p>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                      {new Date(requirements.find(r => r.id === selectedReq)?.createdAt || '').toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Chat/Confirmation area */}
              <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                {/* User message */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '10px',
                    background: 'var(--bg-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <User size={14} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  <div style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '14px 14px 14px 4px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                  }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
                      {requirements.find(r => r.id === selectedReq)?.content}
                    </p>
                  </div>
                </div>

                {/* PM Confirmation card */}
                <RequirementConfirmationCard 
                  req={requirements.find(r => r.id === selectedReq)!}
                  onAnswer={handleAnswer}
                  language={language}
                />

                {/* Final summary if confirmed */}
                {requirements.find(r => r.id === selectedReq)?.status === 'confirmed' && (
                  <RequirementSummaryCard 
                    req={requirements.find(r => r.id === selectedReq)!}
                    language={language}
                  />
                )}
              </div>
            </>
          )}

          {/* Input area */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={language === 'zh' 
                  ? '描述你的需求，按 Enter 发送...' 
                  : 'Describe your requirement, press Enter to send...'}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  resize: 'none',
                  minHeight: '48px',
                  maxHeight: '120px',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={sending || !inputMessage.trim()}
                style={{
                  width: 48, height: 48,
                  borderRadius: '14px',
                  background: inputMessage.trim() 
                    ? 'linear-gradient(135deg, #8B5CF6, #6366F1)'
                    : 'var(--bg-tertiary)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
                  opacity: inputMessage.trim() ? 1 : 0.5,
                  transition: 'all 0.2s',
                }}
              >
                {sending ? (
                  <Loader2 size={18} style={{ color: 'white', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Send size={18} style={{ color: 'white' }} />
                )}
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '8px', textAlign: 'center' }}>
              {language === 'zh' 
                ? 'PM Agent 会在3轮对话内明确你的需求，超时自动标记为草稿'
                : 'PM Agent will clarify your requirement in 3 rounds, auto-drafts if unclear'}
            </p>
          </div>
        </div>
      </div>

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
