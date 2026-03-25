import { useState, useRef } from 'react'
import { 
  Plus, Search, FolderKanban, Clock, Grid3X3, List,
  CheckCircle, Loader2, X, Bot, Users, ArrowRight, Coins,
  Settings, MessageSquare, Zap, Code, TestTube, Shield, FileText, 
  ChevronDown, Lock, RotateCw, WifiOff, GripVertical, MoreHorizontal,
  AlertCircle, Play, Pause, SkipForward, Trash2, Edit2, Eye
} from 'lucide-react'
import { useDashboardStore } from '../stores/dashboardStore'
import { useLanguage } from '../context/LanguageContext'
import { useDeployMode } from '../context/DeployModeContext'

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

// Mock data for demo
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
      { id: 't1', projectId: 'proj-1', title: '设计 RESTful API', titleZh: '设计 RESTful API', description: '完成用户模块 API 设计', descZh: '完成用户模块API设计', status: 'completed', priority: 'P1', assignee: { id: 'a1', name: 'Coder' }, estimatedHours: 8, actualHours: 6, tags: ['API', 'Backend'], createdAt: '2026-03-20', updatedAt: '2026-03-22' },
      { id: 't2', projectId: 'proj-1', title: '数据库建模', titleZh: '数据库建模', description: '设计商品表结构', descZh: '设计商品表结构', status: 'in_progress', priority: 'P0', assignee: { id: 'a2', name: 'Architect' }, estimatedHours: 12, actualHours: 4, tags: ['Database'], createdAt: '2026-03-20', updatedAt: '2026-03-24' },
      { id: 't3', projectId: 'proj-1', title: '单元测试', titleZh: '单元测试', description: '编写 API 单元测试', descZh: '编写API单元测试', status: 'pending', priority: 'P2', assignee: { id: 'a3', name: 'Tester' }, estimatedHours: 16, tags: ['Testing'], createdAt: '2026-03-21', updatedAt: '2026-03-21' },
      { id: 't4', projectId: 'proj-1', title: '支付集成', titleZh: '支付集成', description: '集成第三方支付', descZh: '集成第三方支付', status: 'blocked', priority: 'P0', assignee: { id: 'a1', name: 'Coder' }, estimatedHours: 24, tags: ['Payment'], createdAt: '2026-03-21', updatedAt: '2026-03-23' },
      { id: 't5', projectId: 'proj-1', title: '性能优化', titleZh: '性能优化', description: '优化数据库查询', descZh: '优化数据库查询', status: 'new', priority: 'P2', tags: ['Performance'], createdAt: '2026-03-25', updatedAt: '2026-03-25' },
    ],
    createdAt: '2026-03-20',
    updatedAt: '2026-03-25',
  },
  {
    id: 'proj-2',
    name: 'Data Pipeline',
    nameZh: '数据管道',
    description: '数据清洗管道',
    descZh: '数据清洗管道',
    status: 'pending',
    tasks: [
      { id: 't6', projectId: 'proj-2', title: '需求分析', titleZh: '需求分析', description: '分析数据源需求', descZh: '分析数据源需求', status: 'new', priority: 'P1', tags: ['Analysis'], createdAt: '2026-03-24', updatedAt: '2026-03-24' },
    ],
    createdAt: '2026-03-24',
    updatedAt: '2026-03-24',
  },
  {
    id: 'proj-3',
    name: 'AI Chatbot',
    nameZh: 'AI 客服',
    description: '智能客服机器人',
    descZh: '智能客服机器人',
    status: 'completed',
    tasks: [
      { id: 't7', projectId: 'proj-3', title: '上线部署', titleZh: '上线部署', description: '部署到生产环境', descZh: '部署到生产环境', status: 'completed', priority: 'P0', assignee: { id: 'a4', name: 'DevOps' }, estimatedHours: 4, actualHours: 3, tags: ['Deploy'], createdAt: '2026-03-15', updatedAt: '2026-03-20' },
    ],
    createdAt: '2026-03-15',
    updatedAt: '2026-03-20',
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
function TaskCard({ task, onDragStart, onClick, language }: { task: Task; onDragStart: (e: React.DragEvent, task: Task) => void; onClick: () => void; language: 'en' | 'zh' }) {
  const getAssigneeInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  
  const assigneeColor = task.assignee ? ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B'][Math.abs(task.assignee.id.charCodeAt(0)) % 5] : '#64748B'
  
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={onClick}
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '12px',
        cursor: 'grab',
        transition: 'all 0.2s ease',
      }}
      className="task-card"
    >
      {/* Priority + Status row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
      </div>
      
      {/* Title */}
      <p style={{ 
        fontSize: '13px', 
        fontWeight: '600', 
        color: 'var(--text-primary)', 
        margin: '0 0 8px 0',
        lineHeight: 1.4,
      }}>
        {language === 'zh' ? task.titleZh : task.title}
      </p>
      
      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
        {task.tags.slice(0, 2).map(tag => (
          <span key={tag} style={{
            fontSize: '9px',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-tertiary)',
          }}>
            {tag}
          </span>
        ))}
      </div>
      
      {/* Footer: Assignee + Hours */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {task.assignee ? (
            <>
              <div style={{
                width: 24, height: 24, borderRadius: '8px',
                background: `${assigneeColor}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', fontWeight: '600', color: assigneeColor,
              }}>
                {getAssigneeInitials(task.assignee.name)}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                {task.assignee.name}
              </span>
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
function KanbanColumn({ 
  status, 
  tasks, 
  onDragOver, 
  onDrop, 
  onDragStart, 
  onTaskClick,
  language 
}: { 
  status: keyof typeof statusConfig
  tasks: Task[]
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, status: string) => void
  onDragStart: (e: React.DragEvent, task: Task) => void
  onTaskClick: (task: Task) => void
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
      {/* Column header */}
      <div style={{ 
        padding: '14px 16px', 
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: 10, height: 10, borderRadius: '3px',
            background: cfg.color,
          }} />
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {language === 'zh' ? cfg.label : cfg.labelEn}
          </span>
        </div>
        <span style={{
          fontSize: '11px',
          fontWeight: '600',
          padding: '2px 8px',
          borderRadius: '6px',
          background: cfg.bg,
          color: cfg.color,
        }}>
          {tasks.length}
        </span>
      </div>
      
      {/* Tasks */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onDragStart={onDragStart}
            onClick={() => onTaskClick(task)}
            language={language}
          />
        ))}
        {tasks.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '24px 12px',
            color: 'var(--text-tertiary)',
            fontSize: '12px',
          }}>
            {language === 'zh' ? '暂无任务' : 'No tasks'}
          </div>
        )}
      </div>
    </div>
  )
}

// Project kanban view
function ProjectKanban({ project, onTaskStatusChange, onTaskClick, language }: {
  project: Project
  onTaskStatusChange: (taskId: string, newStatus: string) => void
  onTaskClick: (task: Task) => void
  language: 'en' | 'zh'
}) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const statuses = ['new', 'pending', 'in_progress', 'needs_review', 'completed', 'blocked'] as const
  
  const getTasksByStatus = (status: string) => {
    return project.tasks.filter(t => t.status === status)
  }
  
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  
  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (draggedTask) {
      onTaskStatusChange(draggedTask.id, newStatus)
      setDraggedTask(null)
    }
  }
  
  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Project header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        marginBottom: '16px',
        padding: '0 4px',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FolderKanban size={18} style={{ color: '#818CF8' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            {language === 'zh' ? project.nameZh : project.name}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>
            {project.tasks.length} {language === 'zh' ? '个任务' : 'tasks'}
          </p>
        </div>
      </div>
      
      {/* Kanban board */}
      <div style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '12px',
      }}>
        {statuses.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={getTasksByStatus(status)}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onTaskClick={onTaskClick}
            language={language}
          />
        ))}
      </div>
    </div>
  )
}

// Task detail modal
function TaskDetailModal({ task, onClose, onStatusChange, language }: {
  task: Task
  onClose: () => void
  onStatusChange: (taskId: string, newStatus: string) => void
  language: 'en' | 'zh'
}) {
  const cfg = statusConfig[task.status as keyof typeof statusConfig]
  
  const handleStatusChange = (newStatus: string) => {
    onStatusChange(task.id, newStatus)
    onClose()
  }
  
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        width: '90%', maxWidth: '560px',
        maxHeight: '85vh',
        overflow: 'auto',
        padding: '24px',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              {language === 'zh' ? task.titleZh : task.title}
            </h2>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'var(--bg-tertiary)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <X size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        
        {/* Description */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            {language === 'zh' ? '描述' : 'Description'}
          </h4>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {language === 'zh' ? task.descZh : task.description}
          </p>
        </div>
        
        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '12px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
              {language === 'zh' ? '负责人' : 'Assignee'}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
              {task.assignee?.name || (language === 'zh' ? '未分配' : 'Unassigned')}
            </div>
          </div>
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '12px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
              {language === 'zh' ? '预计工时' : 'Estimated'}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
              {task.estimatedHours ? `${task.actualHours || 0} / ${task.estimatedHours}h` : '-'}
            </div>
          </div>
        </div>
        
        {/* Status change */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            {language === 'zh' ? '修改状态' : 'Change Status'}
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(['new', 'pending', 'in_progress', 'needs_review', 'completed', 'blocked'] as const).map(s => {
              const sc = statusConfig[s]
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: task.status === s ? `2px solid ${sc.color}` : '1px solid var(--border)',
                    background: task.status === s ? sc.bg : 'transparent',
                    color: task.status === s ? sc.color : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {language === 'zh' ? sc.label : sc.labelEn}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Projects() {
  const { language } = useLanguage()
  const { projects: storeProjects, updateProject } = useDashboardStore()
  const { isConnected } = useDeployMode()
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  // Use mock data for demo
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  
  const getProjectName = (p: Project) => language === 'zh' ? (p.nameZh || p.name) : p.name
  
  const filteredProjects = projects.filter(project => {
    const projName = getProjectName(project)
    return projName.toLowerCase().includes(search.toLowerCase())
  })
  
  const handleTaskStatusChange = (taskId: string, newStatus: string) => {
    setProjects(prev => prev.map(p => ({
      ...p,
      tasks: p.tasks.map(t => 
        t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t
      )
    })))
  }
  
  const filterLabels = {
    all: language === 'zh' ? '全部项目' : 'All Projects',
  }
  
  return (
    <div 
      className="page-container animate-fade-in"
      style={{ 
        background: 'var(--bg-primary)',
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        height: '100%',
      }}
    >
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
            <div style={{
              display: 'flex',
              background: 'var(--bg-secondary)',
              borderRadius: '10px',
              padding: '4px',
              border: '1px solid var(--border)',
            }}>
              <button
                onClick={() => setViewMode('kanban')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: viewMode === 'kanban' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'kanban' ? 'white' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Grid3X3 size={14} />
                {language === 'zh' ? '看板' : 'Kanban'}
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'list' ? 'white' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <List size={14} />
                {language === 'zh' ? '列表' : 'List'}
              </button>
            </div>
            
            <button style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              border: 'none',
              color: 'white',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Plus size={16} />
              {language === 'zh' ? '新建项目' : 'New Project'}
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '10px 16px',
          border: '1px solid var(--border)',
          maxWidth: '400px',
        }}>
          <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={language === 'zh' ? '搜索项目...' : 'Search projects...'}
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
      </div>
      
      {/* Projects */}
      <div style={{ overflow: 'auto', flex: 1 }}>
        {filteredProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px' }}>
            <FolderKanban size={56} style={{ color: 'var(--text-tertiary)', margin: '0 auto 20px' }} />
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {language === 'zh' ? '暂无项目' : 'No projects yet'}
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
              {language === 'zh' ? '创建您的第一个项目开始吧' : 'Create your first project to get started'}
            </p>
          </div>
        ) : viewMode === 'kanban' ? (
          <div>
            {filteredProjects.map(project => (
              <ProjectKanban
                key={project.id}
                project={project}
                onTaskStatusChange={handleTaskStatusChange}
                onTaskClick={setSelectedTask}
                language={language}
              />
            ))}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {language === 'zh' ? '项目名称' : 'Project'}
                  </th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {language === 'zh' ? '状态' : 'Status'}
                  </th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {language === 'zh' ? '任务' : 'Tasks'}
                  </th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {language === 'zh' ? '截止日期' : 'Due Date'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map(project => (
                  <tr key={project.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setSelectedProject(project)}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '10px',
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FolderKanban size={16} style={{ color: '#818CF8' }} />
                        </div>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {getProjectName(project)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '500',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3B82F6',
                      }}>
                        {language === 'zh' ? '进行中' : 'In Progress'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                        {project.tasks.length} {language === 'zh' ? '个任务' : 'tasks'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {project.dueDate || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleTaskStatusChange}
          language={language}
        />
      )}
      
      <style>{`
        .task-card:hover {
          border-color: var(--border-hover);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .task-card:active {
          cursor: grabbing;
        }
      `}</style>
    </div>
  )
}
