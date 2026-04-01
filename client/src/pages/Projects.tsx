import { useState, useRef, useEffect } from 'react'
import { 
  Plus, Search, FolderKanban, Clock, Grid3X3, List,
  CheckCircle, Loader2, X, Bot, Users, ArrowRight, Coins,
  Settings, MessageSquare, Zap, Code, TestTube, Shield, FileText, 
  ChevronDown, Lock, RotateCw, WifiOff, GripVertical, MoreHorizontal,
  AlertCircle, Play, Pause, SkipForward, Trash2, Edit2, Eye,
  GitBranch, Workflow, AlertTriangle, RefreshCw, Check, Loader, FileTextIcon
} from 'lucide-react'
import { useDashboardStore } from '../stores/dashboardStore'
import { useLanguage } from '../context/LanguageContext'
import { useDeployMode } from '../context/DeployModeContext'
import { updateTaskStatus, canTransition, statusConfig as apiStatusConfig, getNextStatuses } from '../lib/taskApi'
import { api } from '../lib/api'
import ExecutionLogsPanel from '../components/ExecutionLogsPanel'

// Task interface
interface Task {
  id: string
  projectId: string
  title: string
  titleZh: string
  description: string
  descZh: string
  status: 'new' | 'pending' | 'in_progress' | 'needs_review' | 'completed' | 'blocked'
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  assignee?: { id: string; name: string; avatar?: string }
  estimatedHours?: number
  actualHours?: number
  dueDate?: string
  tags: string[]
  // Exception handling
  timeoutSeconds?: number
  maxRetries?: number
  retryInterval?: number
  timeoutStrategy?: 'retry' | 'fallback' | 'interrupt'
  fallbackTaskId?: string
  isHumanInterruptPoint?: boolean
  // Workflow
  workflowPosition?: { x: number; y: number }
  nodeType?: 'task' | 'agent' | 'interrupt' | 'condition' | 'parallel' | 'join'
  dependsOn?: string[]
  createdAt: string
  updatedAt: string
}

// Project interface
interface Project {
  id: string
  name: string
  nameZh: string
  description: string
  descZh: string
  status: string
  tasks: Task[]
  createdAt: string
  updatedAt: string
  dueDate?: string
}

// Status config
const statusConfig = {
  new: { label: '新建', labelEn: 'New', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.3)' },
  pending: { label: '待领取', labelEn: 'Pending', color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)', border: 'rgba(100, 116, 139, 0.3)' },
  in_progress: { label: '进行中', labelEn: 'In Progress', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)' },
  needs_review: { label: '待审查', labelEn: 'Needs Review', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' },
  completed: { label: '已完成', labelEn: 'Completed', color: '#34D399', bg: 'rgba(52, 211, 153, 0.1)', border: 'rgba(52, 211, 153, 0.3)' },
  blocked: { label: '阻塞中', labelEn: 'Blocked', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)' },
}

const priorityConfig = {
  P0: { label: 'P0', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
  P1: { label: 'P1', color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' },
  P2: { label: 'P2', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)' },
  P3: { label: 'P3', color: '#64748B', bg: 'rgba(100, 116, 139, 0.15)' },
}

const timeoutStrategyConfig = {
  retry: { label: '重试', labelEn: 'Retry', color: '#F59E0B' },
  fallback: { label: '降级', labelEn: 'Fallback', color: '#8B5CF6' },
  interrupt: { label: '中断', labelEn: 'Interrupt', color: '#EF4444' },
}

// Mock data
const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'E-commerce API',
    nameZh: '电商 API',
    description: '电商后端 API 开发',
    descZh: '电商后端API开发',
    status: 'in_progress',
    dueDate: '2026-04-15',
    tasks: [
      { id: 't1', projectId: 'proj-1', title: '设计 RESTful API', titleZh: '设计 RESTful API', description: '完成用户模块 API 设计', descZh: '完成用户模块API设计', status: 'completed', priority: 'P1', assignee: { id: 'a1', name: 'Coder' }, estimatedHours: 8, actualHours: 6, tags: ['API', 'Backend'], timeoutSeconds: 300, maxRetries: 3, retryInterval: 2, timeoutStrategy: 'retry', isHumanInterruptPoint: false, createdAt: '2026-03-20', updatedAt: '2026-03-22' },
      { id: 't2', projectId: 'proj-1', title: '数据库建模', titleZh: '数据库建模', description: '设计商品表结构', descZh: '设计商品表结构', status: 'in_progress', priority: 'P0', assignee: { id: 'a2', name: 'Architect' }, estimatedHours: 12, actualHours: 4, tags: ['Database'], timeoutSeconds: 600, maxRetries: 2, retryInterval: 3, timeoutStrategy: 'fallback', isHumanInterruptPoint: false, createdAt: '2026-03-20', updatedAt: '2026-03-24' },
      { id: 't3', projectId: 'proj-1', title: '单元测试', titleZh: '单元测试', description: '编写 API 单元测试', descZh: '编写API单元测试', status: 'pending', priority: 'P2', assignee: { id: 'a3', name: 'Tester' }, estimatedHours: 16, tags: ['Testing'], timeoutSeconds: 300, maxRetries: 3, retryInterval: 1, timeoutStrategy: 'retry', isHumanInterruptPoint: false, createdAt: '2026-03-21', updatedAt: '2026-03-21' },
      { id: 't4', projectId: 'proj-1', title: '支付集成', titleZh: '支付集成', description: '集成第三方支付', descZh: '集成第三方支付', status: 'blocked', priority: 'P0', assignee: { id: 'a1', name: 'Coder' }, estimatedHours: 24, tags: ['Payment'], timeoutSeconds: 120, maxRetries: 1, retryInterval: 5, timeoutStrategy: 'interrupt', isHumanInterruptPoint: true, createdAt: '2026-03-21', updatedAt: '2026-03-23' },
      { id: 't5', projectId: 'proj-1', title: '性能优化', titleZh: '性能优化', description: '优化数据库查询', descZh: '优化数据库查询', status: 'new', priority: 'P2', tags: ['Performance'], timeoutSeconds: 300, maxRetries: 2, retryInterval: 2, timeoutStrategy: 'fallback', isHumanInterruptPoint: false, createdAt: '2026-03-25', updatedAt: '2026-03-25' },
    ],
    createdAt: '2026-03-20',
    updatedAt: '2026-03-25',
  },
]

// Priority badge
function PriorityBadge({ priority }: { priority: string }) {
  const cfg = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.P3
  return (
    <span style={{
      fontSize: '10px',
      fontWeight: '600',
      padding: '2px 6px',
      borderRadius: '4px',
      background: cfg.bg,
      color: cfg.color,
    }}>
      {cfg.label}
    </span>
  )
}

// Status badge
function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.new
  return (
    <span style={{
      fontSize: '10px',
      fontWeight: '500',
      padding: '3px 8px',
      borderRadius: '6px',
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  )
}

// Task card component
function TaskCard({ task, onDragStart, onClick, onStatusChange, language }: {
  task: Task
  onDragStart: (e: React.DragEvent, task: Task) => void
  onClick: () => void
  onStatusChange?: (taskId: string, newStatus: string) => void
  language: 'en' | 'zh'
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const getAssigneeInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const assigneeColor = task.assignee ? ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B'][Math.abs(task.assignee.id.charCodeAt(0)) % 5] : '#64748B'
  const nextStatuses = getNextStatuses(task.status)
  const hasTransitions = nextStatuses.length > 0

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={(e) => {
        // If showing status menu, don't trigger card click
        if (showStatusMenu) {
          setShowStatusMenu(false)
          return
        }
        onClick()
      }}
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '12px',
        cursor: 'grab',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
      className="task-card"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <PriorityBadge priority={task.priority} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <StatusBadge status={task.status} />
          {hasTransitions && onStatusChange && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowStatusMenu(!showStatusMenu)
              }}
              style={{
                background: 'var(--bg-tertiary)',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 6px',
                cursor: 'pointer',
                fontSize: '10px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <ChevronDown size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Status transition popup */}
      {showStatusMenu && hasTransitions && onStatusChange && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '4px',
            zIndex: 100,
            minWidth: '120px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {nextStatuses.map(status => {
            const cfg = apiStatusConfig[status] || { color: '#64748B', label: status }
            return (
              <button
                key={status}
                onClick={() => {
                  onStatusChange(task.id, status)
                  setShowStatusMenu(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: cfg.color,
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
                {language === 'zh' ? cfg.label : cfg.labelEn}
              </button>
            )
          })}
        </div>
      )}
      
      <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
        {language === 'zh' ? task.titleZh : task.title}
      </p>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
        {task.tags.slice(0, 2).map(tag => (
          <span key={tag} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
            {tag}
          </span>
        ))}
        {task.isHumanInterruptPoint && (
          <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
            ⏸️ 人工确认
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {task.assignee ? (
            <>
              <div style={{ width: 24, height: 24, borderRadius: '8px', background: `${assigneeColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '600', color: assigneeColor }}>
                {getAssigneeInitials(task.assignee.name)}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{task.assignee.name}</span>
            </>
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              {language === 'zh' ? '未分配' : 'Unassigned'}
            </span>
          )}
        </div>
        {task.estimatedHours && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
            <Clock size={10} />
            {task.actualHours || 0}h / {task.estimatedHours}h
          </div>
        )}
      </div>
    </div>
  )
}

// Kanban column
function KanbanColumn({ status, tasks, onDragOver, onDrop, onDragStart, onTaskClick, onStatusChange, draggedTaskLoading, language }: {
  status: keyof typeof statusConfig
  tasks: Task[]
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, status: string) => void
  onDragStart: (e: React.DragEvent, task: Task) => void
  onTaskClick: (task: Task) => void
  onStatusChange: (taskId: string, newStatus: string) => void
  draggedTaskLoading?: boolean
  language: 'en' | 'zh'
}) {
  const cfg = statusConfig[status]
  const [isDragOver, setIsDragOver] = useState(false)
  
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); onDragOver(e) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { setIsDragOver(false); onDrop(e, status) }}
      style={{
        flex: '0 0 280px',
        minWidth: '280px',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: isDragOver ? `${cfg.color}08` : 'var(--bg-secondary)',
        borderRadius: '16px',
        border: isDragOver ? `2px dashed ${cfg.color}` : '1px solid var(--border)',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '3px', background: cfg.color }} />
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {language === 'zh' ? cfg.label : cfg.labelEn}
          </span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '6px', background: cfg.bg, color: cfg.color }}>
          {tasks.length}
        </span>
      </div>
      
      <div style={{ flex: 1, overflow: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            onClick={() => onTaskClick(task)}
            onStatusChange={onStatusChange}
            language={language}
          />
        ))}
        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-tertiary)', fontSize: '12px' }}>
            {language === 'zh' ? '暂无任务' : 'No tasks'}
          </div>
        )}
      </div>
    </div>
  )
}

// Exception settings modal
function ExceptionSettingsModal({ task, onClose, onSave, language }: {
  task: Task
  onClose: () => void
  onSave: (task: Task) => void
  language: 'en' | 'zh'
}) {
  const [form, setForm] = useState({
    timeoutSeconds: task.timeoutSeconds || 300,
    maxRetries: task.maxRetries || 3,
    retryInterval: task.retryInterval || 1,
    timeoutStrategy: (task.timeoutStrategy || 'retry') as 'retry' | 'fallback' | 'interrupt',
    isHumanInterruptPoint: task.isHumanInterruptPoint || false,
  })
  
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border)', width: '90%', maxWidth: '480px', padding: '24px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              {language === 'zh' ? '异常处理设置' : 'Exception Settings'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
              {language === 'zh' ? task.titleZh : task.title}
            </p>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--bg-tertiary)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        
        {/* Timeout */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
            {language === 'zh' ? '超时时间（秒）' : 'Timeout (seconds)'}
          </label>
          <input
            type="number"
            value={form.timeoutSeconds}
            onChange={e => setForm(prev => ({ ...prev, timeoutSeconds: parseInt(e.target.value) || 300 }))}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
          />
        </div>
        
        {/* Retry settings */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
              {language === 'zh' ? '最大重试次数' : 'Max Retries'}
            </label>
            <input
              type="number"
              value={form.maxRetries}
              onChange={e => setForm(prev => ({ ...prev, maxRetries: parseInt(e.target.value) || 0 }))}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
              {language === 'zh' ? '重试间隔（秒）' : 'Retry Interval (s)'}
            </label>
            <input
              type="number"
              value={form.retryInterval}
              onChange={e => setForm(prev => ({ ...prev, retryInterval: parseInt(e.target.value) || 1 }))}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
            />
          </div>
        </div>
        
        {/* Strategy */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>
            {language === 'zh' ? '超时策略' : 'Timeout Strategy'}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(Object.entries(timeoutStrategyConfig) as [string, typeof timeoutStrategyConfig[keyof typeof timeoutStrategyConfig]][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setForm(prev => ({ ...prev, timeoutStrategy: key as 'retry' | 'fallback' | 'interrupt' }))}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: form.timeoutStrategy === key ? `2px solid ${cfg.color}` : '1px solid var(--border)',
                  background: form.timeoutStrategy === key ? `${cfg.color}10` : 'var(--bg-tertiary)',
                  color: form.timeoutStrategy === key ? cfg.color : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                {language === 'zh' ? cfg.label : cfg.labelEn}
              </button>
            ))}
          </div>
        </div>
        
        {/* Human interrupt */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div
              onClick={() => setForm(prev => ({ ...prev, isHumanInterruptPoint: !prev.isHumanInterruptPoint }))}
              style={{
                width: 44, height: 24, borderRadius: '12px',
                background: form.isHumanInterruptPoint ? '#34D399' : 'var(--bg-tertiary)',
                position: 'relative',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: 2,
                left: form.isHumanInterruptPoint ? 22 : 2,
                transition: 'all 0.2s',
              }} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                {language === 'zh' ? '人工确认点' : 'Human Interrupt Point'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                {language === 'zh' ? '执行到这里时暂停，等待人工确认' : 'Pause here and wait for human confirmation'}
              </div>
            </div>
          </label>
        </div>
        
        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
            {language === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button onClick={() => { onSave({ ...task, ...form }); onClose() }} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            {language === 'zh' ? '保存' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Workflow node
function WorkflowNode({ task, onClick, isSelected, language }: { task: Task; onClick: () => void; isSelected: boolean; language: 'en' | 'zh' }) {
  const cfg = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.new
  const priorityCfg = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.P3
  
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-secondary)',
        border: isSelected ? `2px solid ${cfg.color}` : '1px solid var(--border)',
        borderRadius: '12px',
        padding: '14px',
        minWidth: '180px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Priority bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: priorityCfg.color, borderRadius: '12px 12px 0 0' }} />
      
      {/* Status dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{cfg.label}</span>
      </div>
      
      {/* Title */}
      <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
        {language === 'zh' ? task.titleZh : task.title}
      </p>
      
      {/* Exception indicators */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
        <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
          ⏱️ {task.timeoutSeconds}s
        </span>
        <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
          🔁 {task.maxRetries}x
        </span>
        {task.isHumanInterruptPoint && (
          <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
            ⏸️ 人工
          </span>
        )}
      </div>
      
      {/* Assignee */}
      {task.assignee && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: 20, height: 20, borderRadius: '6px', background: `${priorityCfg.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '600', color: priorityCfg.color }}>
            {task.assignee.name[0]}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{task.assignee.name}</span>
        </div>
      )}
    </div>
  )
}

export default function Projects() {
  const { language } = useLanguage()
  const { projects: storeProjects, updateProject } = useDashboardStore()
  const { isConnected } = useDeployMode()
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'workflow'>('kanban')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedWorkflowTask, setSelectedWorkflowTask] = useState<Task | null>(null)
  const [showExceptionModal, setShowExceptionModal] = useState(false)

  // Drag state
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [draggedTaskLoading, setDraggedTaskLoading] = useState(false)

  // Status change popup
  const [statusPopup, setStatusPopup] = useState<{ task: Task; position: { x: number; y: number } } | null>(null)

  // Execution logs panel
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null)

  // API state
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch projects from API
  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        setError(null)
        const data = await api.projects.list()
        setProjects(Array.isArray(data) ? data : (Array.isArray(data?.projects) ? data.projects : []))
        if (storeProjects.length === 0) {
          // Optionally sync to store if empty
        }
      } catch (err: any) {
        console.error('Failed to fetch projects:', err)
        setError(err.message || 'Failed to load projects')
        // Fall back to mock data for development
        setProjects(mockProjects)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])
  
  const getProjectName = (p: Project) => language === 'zh' ? (p.nameZh || p.name) : p.name
  
  const filteredProjects = projects.filter(project => {
    const projName = getProjectName(project)
    return projName.toLowerCase().includes(search.toLowerCase())
  })
  
  const currentProject = filteredProjects[0]
  
  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    // Find the task first
    let taskToUpdate: Task | null = null
    for (const p of projects) {
      const t = p.tasks.find(t => t.id === taskId)
      if (t) {
        taskToUpdate = t
        break
      }
    }

    if (!taskToUpdate) return

    // Check if transition is valid
    if (!canTransition(taskToUpdate.status, newStatus)) {
      console.warn(`Invalid transition from ${taskToUpdate.status} to ${newStatus}`)
      return
    }

    // Optimistic update
    setProjects(prev => prev.map(p => ({
      ...p,
      tasks: p.tasks.map(t => t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t)
    })))

    // Call API
    const result = await updateTaskStatus(taskId, newStatus)

    if (!result.success) {
      // Rollback on failure
      setProjects(prev => prev.map(p => ({
        ...p,
        tasks: p.tasks.map(t => t.id === taskId ? { ...t, status: taskToUpdate!.status } : t)
      })))
      console.error('Failed to update task status:', result.error)
    }
  }
  
  const handleSaveException = (updatedTask: Task) => {
    setProjects(prev => prev.map(p => ({
      ...p,
      tasks: p.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
    })))
    setSelectedWorkflowTask(null)
  }
  
  const filterLabels = {
    all: language === 'zh' ? '全部项目' : 'All Projects',
  }
  
  return (
    <div className="page-container animate-fade-in" style={{ background: 'var(--bg-primary)', backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)', backgroundSize: '40px 40px', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {language === 'zh' ? '项目管理' : 'Projects'}
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              {language === 'zh' ? '拖拽任务卡片切换状态' : 'Drag task cards to change status'}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* View toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border)' }}>
              {[
                { id: 'kanban', icon: Grid3X3, label: language === 'zh' ? '看板' : 'Kanban' },
                { id: 'list', icon: List, label: language === 'zh' ? '列表' : 'List' },
                { id: 'workflow', icon: Workflow, label: language === 'zh' ? '工作流' : 'Workflow' },
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setViewMode(v.id as typeof viewMode)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: viewMode === v.id ? 'var(--primary)' : 'transparent',
                    color: viewMode === v.id ? 'white' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <v.icon size={14} />
                  {v.label}
                </button>
              ))}
            </div>
            
            <button style={{ padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} />
              {language === 'zh' ? '新建项目' : 'New Project'}
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '10px 16px', border: '1px solid var(--border)', maxWidth: '400px' }}>
          <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={language === 'zh' ? '搜索项目...' : 'Search projects...'} style={{ flex: 1, border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }} />
        </div>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' }}>
          <Loader2 size={40} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {language === 'zh' ? '加载中...' : 'Loading...'}
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '16px' }}>
          <AlertCircle size={40} style={{ color: '#EF4444' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); api.projects.list().then(d => setProjects(Array.isArray(d) ? d : (Array.isArray(d?.projects) ? d.projects : []))).catch(e => { setError(e.message); setProjects(mockProjects); }).finally(() => setLoading(false)) }}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontSize: '13px', cursor: 'pointer' }}
          >
            {language === 'zh' ? '重试' : 'Retry'}
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && viewMode === 'kanban' && currentProject && (
        <div style={{ overflow: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px' }}>
            {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map(status => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={currentProject.tasks.filter(t => t.status === status)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e, targetStatus) => {
                  if (draggedTask && draggedTask.status !== targetStatus) {
                    handleTaskStatusChange(draggedTask.id, targetStatus)
                  }
                  setDraggedTask(null)
                }}
                onDragStart={(e, task) => {
                  setDraggedTask(task)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onTaskClick={(task) => {
                  const nextStatuses = getNextStatuses(task.status)
                  if (nextStatuses.length > 0) {
                    // Get click position from event (we'll approximate with mouse position)
                    setStatusPopup({ task, position: { x: window.innerWidth / 2, y: window.innerHeight / 2 } })
                  }
                }}
                onStatusChange={(taskId, newStatus) => handleTaskStatusChange(taskId, newStatus)}
                draggedTaskLoading={draggedTaskLoading}
                language={language}
              />
            ))}
          </div>
        </div>
      )}
      
      {viewMode === 'workflow' && currentProject && !loading && !error && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', padding: '20px', flex: 1, overflow: 'auto' }}>
          {/* Workflow header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                {language === 'zh' ? '工作流视图' : 'Workflow View'}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
                {language === 'zh' ? '点击节点查看详情，点击齿轮设置异常处理' : 'Click node for details, click gear for exception settings'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
                ⏱️ {language === 'zh' ? '超时' : 'Timeout'}
              </span>
              <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
                🔁 {language === 'zh' ? '重试' : 'Retry'}
              </span>
              <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
                ⏸️ {language === 'zh' ? '人工确认' : 'Human'}
              </span>
            </div>
          </div>
          
          {/* Project name header */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}>
                📋
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  {language === 'zh' ? currentProject.nameZh : currentProject.name}
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>
                  {language === 'zh' ? currentProject.descZh : currentProject.description}
                </p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <StatusBadge status={currentProject.status} />
              </div>
            </div>
          </div>
          
          {/* Workflow stages - horizontal flow */}
          <div style={{ 
            display: 'flex', 
            gap: '0', 
            overflowX: 'auto',
            padding: '10px 0 20px 0'
          }}>
            {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((status, idx) => {
              const stageTasks = currentProject.tasks.filter(t => t.status === status)
              const cfg = statusConfig[status]
              const isActive = stageTasks.length > 0
              
              return (
                <div key={status} style={{ 
                  display: 'flex',
                  alignItems: 'flex-start',
                  minWidth: '180px'
                }}>
                  {/* Stage column */}
                  <div style={{
                    flex: 1,
                    background: isActive ? cfg.bg : 'var(--bg-tertiary)',
                    borderRadius: '12px',
                    padding: '12px',
                    border: `1px solid ${isActive ? cfg.border : 'var(--border)'}`,
                    opacity: isActive ? 1 : 0.5,
                  }}>
                    {/* Stage header */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                      paddingBottom: '8px',
                      borderBottom: `1px solid ${isActive ? cfg.border : 'var(--border)'}`
                    }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: isActive ? cfg.color : 'var(--text-tertiary)' }}>
                        {language === 'zh' ? cfg.label : cfg.labelEn}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: isActive ? cfg.color : 'var(--text-tertiary)',
                        color: 'white',
                        fontWeight: '600'
                      }}>
                        {stageTasks.length}
                      </span>
                    </div>
                    
                    {/* Tasks in stage */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {stageTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedWorkflowTask(task)}
                          style={{
                            padding: '10px',
                            background: 'var(--bg-primary)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: selectedWorkflowTask?.id === task.id ? `2px solid ${cfg.color}` : '1px solid var(--border)',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>
                            {language === 'zh' ? task.titleZh : task.title}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <PriorityBadge priority={task.priority} />
                            {task.isHumanInterruptPoint && (
                              <span style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
                                ⏸️ 人工
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {stageTasks.length === 0 && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: 'var(--text-tertiary)', 
                          textAlign: 'center',
                          padding: '16px 0'
                        }}>
                          {language === 'zh' ? '暂无任务' : 'No tasks'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Animated arrow to next stage */}
                  {idx < Object.keys(statusConfig).length - 1 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 8px',
                      height: '100%',
                      position: 'relative'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" style={{ overflow: 'visible' }}>
                        <defs>
                          <linearGradient id={`grad-${status}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={cfg.color} stopOpacity="0.3" />
                            <stop offset="50%" stopColor={cfg.color} stopOpacity="1" />
                            <stop offset="100%" stopColor={cfg.color} stopOpacity="0.3" />
                          </linearGradient>
                        </defs>
                        {/* Arrow line */}
                        <line 
                          x1="0" y1="12" x2="16" y2="12" 
                          stroke={`url(#grad-${status})`} 
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        {/* Animated dot */}
                        <circle r="3" fill={cfg.color}>
                          <animateMotion
                            dur="1.5s"
                            repeatCount="indefinite"
                            path="M 0 12 L 16 12"
                          />
                        </circle>
                        {/* Arrow head */}
                        <polygon 
                          points="14,8 20,12 14,16" 
                          fill={cfg.color}
                          opacity="0.6"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Selected task detail */}
          {selectedWorkflowTask && !showExceptionModal && (
            <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <PriorityBadge priority={selectedWorkflowTask.priority} />
                    <StatusBadge status={selectedWorkflowTask.status} />
                  </div>
                  <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                    {language === 'zh' ? selectedWorkflowTask.titleZh : selectedWorkflowTask.title}
                  </h4>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setSelectedExecutionId(selectedWorkflowTask.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#6366F1',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <FileTextIcon size={14} />
                    {language === 'zh' ? '执行日志' : 'Logs'}
                  </button>
                  <button onClick={() => setSelectedWorkflowTask(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={16} style={{ color: 'var(--text-tertiary)' }} />
                  </button>
                </div>
              </div>
              
              {/* Exception summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' }}>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#F59E0B' }}>{selectedWorkflowTask.timeoutSeconds}s</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{language === 'zh' ? '超时时间' : 'Timeout'}</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#6366F1' }}>{selectedWorkflowTask.maxRetries}x</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{language === 'zh' ? '最大重试' : 'Max Retries'}</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: timeoutStrategyConfig[selectedWorkflowTask.timeoutStrategy || 'retry'].color }}>
                    {language === 'zh' ? timeoutStrategyConfig[selectedWorkflowTask.timeoutStrategy || 'retry'].label : timeoutStrategyConfig[selectedWorkflowTask.timeoutStrategy || 'retry'].labelEn}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{language === 'zh' ? '超时策略' : 'Strategy'}</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: selectedWorkflowTask.isHumanInterruptPoint ? '#EF4444' : '#64748B' }}>
                    {selectedWorkflowTask.isHumanInterruptPoint ? '✓' : '—'}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{language === 'zh' ? '人工确认' : 'Human'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {viewMode === 'list' && !loading && !error && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{language === 'zh' ? '任务' : 'Task'}</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{language === 'zh' ? '状态' : 'Status'}</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{language === 'zh' ? '优先级' : 'Priority'}</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{language === 'zh' ? '异常处理' : 'Exception'}</th>
              </tr>
            </thead>
            <tbody>
              {currentProject?.tasks.map(task => (
                <tr key={task.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setSelectedWorkflowTask(task)}>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {language === 'zh' ? task.titleZh : task.title}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={task.status} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
                        ⏱️ {task.timeoutSeconds}s
                      </span>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
                        🔁 {task.maxRetries}x
                      </span>
                      {task.isHumanInterruptPoint && (
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
                          ⏸️
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Exception settings modal */}
      {showExceptionModal && selectedWorkflowTask && (
        <ExceptionSettingsModal
          task={selectedWorkflowTask}
          onClose={() => { setShowExceptionModal(false); setSelectedWorkflowTask(null) }}
          onSave={handleSaveException}
          language={language}
        />
      )}
      
      <style>{`
        .task-card:hover { border-color: var(--border-hover); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .task-card:active { cursor: grabbing; }
      `}</style>

      {/* Execution Logs Panel */}
      {selectedExecutionId && (
        <ExecutionLogsPanel
          executionId={selectedExecutionId}
          onClose={() => setSelectedExecutionId(null)}
          language={language}
        />
      )}
    </div>
  )
}
