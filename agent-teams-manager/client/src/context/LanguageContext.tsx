import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

type Language = 'en' | 'zh'

interface Translations {
  [key: string]: {
    [key: string]: string
  }
}

const translations: Translations = {
  // Dashboard
  'dashboard.title': { en: 'Dashboard', zh: '控制台' },
  'dashboard.welcome': { en: 'Welcome back! Here\'s what\'s happening.', zh: '欢迎回来！以下是最新动态。' },
  'dashboard.totalProjects': { en: 'Total Projects', zh: '项目总数' },
  'dashboard.activeProjects': { en: 'Active Projects', zh: '进行中' },
  'dashboard.completed': { en: 'Completed', zh: '已完成' },
  'dashboard.issues': { en: 'Issues', zh: '问题' },
  'dashboard.recentProjects': { en: 'Recent Projects', zh: '最近项目' },
  'dashboard.viewAll': { en: 'View All', zh: '查看全部' },
  'dashboard.agentStatus': { en: 'Agent Status', zh: '智能体状态' },
  'dashboard.manage': { en: 'Manage', zh: '管理' },
  'dashboard.recentActivity': { en: 'Recent Activity', zh: '最近活动' },
  
  // Projects
  'projects.title': { en: 'Projects', zh: '项目管理' },
  'projects.manage': { en: 'Manage your team projects and tasks', zh: '管理团队项目与任务' },
  'projects.newProject': { en: 'New Project', zh: '新建项目' },
  'projects.search': { en: 'Search projects...', zh: '搜索项目...' },
  'projects.all': { en: 'All', zh: '全部' },
  'projects.inProgress': { en: 'In Progress', zh: '进行中' },
  'projects.completed': { en: 'Completed', zh: '已完成' },
  'projects.pending': { en: 'Pending', zh: '待处理' },
  'projects.progress': { en: 'Progress', zh: '进度' },
  'projects.tasks': { en: 'Tasks', zh: '任务' },
  'projects.createNew': { en: 'Create New Project', zh: '创建新项目' },
  'projects.projectName': { en: 'Project Name', zh: '项目名称' },
  'projects.description': { en: 'Description', zh: '项目描述' },
  'projects.cancel': { en: 'Cancel', zh: '取消' },
  'projects.create': { en: 'Create Project', zh: '创建项目' },
  'projects.noProjects': { en: 'No projects found', zh: '未找到项目' },
  
  // Agents
  'agents.title': { en: 'Agents', zh: '智能体' },
  'agents.manage': { en: 'Manage your AI agent team', zh: '管理AI智能体团队' },
  'agents.online': { en: 'Online', zh: '在线' },
  'agents.busy': { en: 'Busy', zh: '忙碌' },
  'agents.error': { en: 'Error', zh: '错误' },
  'agents.offline': { en: 'Offline', zh: '离线' },
  'agents.search': { en: 'Search agents...', zh: '搜索智能体...' },
  'agents.model': { en: 'Model', zh: '模型' },
  'agents.configuration': { en: 'Configuration', zh: '配置' },
  'agents.temperature': { en: 'Temperature', zh: '温度' },
  'agents.enable': { en: 'Enable', zh: '启用' },
  'agents.disable': { en: 'Disable', zh: '禁用' },
  
  // Requirements
  'requirements.title': { en: 'Requirements', zh: '需求池' },
  'requirements.projects': { en: 'Projects', zh: '项目' },
  'requirements.addNew': { en: 'Add', zh: '添加' },
  'requirements.selectProject': { en: 'Select a project', zh: '选择项目' },
  'requirements.total': { en: 'requirements', zh: '条需求' },
  'requirements.typeRequirement': { en: 'Type your requirement...', zh: '输入您的需求...' },
  'requirements.pending': { en: 'Pending', zh: '待处理' },
  'requirements.clarifying': { en: 'Clarifying', zh: '待澄清' },
  'requirements.confirmed': { en: 'Confirmed', zh: '已确认' },
  'requirements.rejected': { en: 'Rejected', zh: '已拒绝' },
  
  // Knowledge
  'knowledge.title': { en: 'Knowledge Base', zh: '知识库' },
  'knowledge.manage': { en: 'Manage agent roles and knowledge', zh: '管理智能体角色与知识' },
  'knowledge.addKnowledge': { en: 'Add Knowledge', zh: '添加知识' },
  'knowledge.search': { en: 'Search...', zh: '搜索...' },
  'knowledge.all': { en: 'All', zh: '全部' },
  'knowledge.role': { en: 'Role', zh: '角色' },
  'knowledge.rule': { en: 'Rule', zh: '规则' },
  'knowledge.document': { en: 'Document', zh: '文档' },
  'knowledge.updated': { en: 'Updated', zh: '更新于' },
  'knowledge.selectItem': { en: 'Select an item to view', zh: '选择一个项目查看' },
  'knowledge.addTitle': { en: 'Add Knowledge', zh: '添加知识' },
  'knowledge.content': { en: 'Content', zh: '内容' },
  
  // Status
  'status.active': { en: 'Active', zh: '进行中' },
  'status.pending': { en: 'Pending', zh: '待处理' },
  'status.completed': { en: 'Completed', zh: '已完成' },
  'status.in_progress': { en: 'In Progress', zh: '进行中' },
  'status.needs_review': { en: 'Needs Review', zh: '待审核' },
  'status.review_passed': { en: 'Review Passed', zh: '审核通过' },
  'status.review_failed': { en: 'Review Failed', zh: '审核失败' },
  'status.failed': { en: 'Failed', zh: '失败' },
  
  // Sidebar
  'sidebar.dashboard': { en: 'Overview & stats', zh: '概览与统计' },
  'sidebar.projects': { en: 'Manage projects', zh: '管理项目' },
  'sidebar.requirements': { en: 'Requirement pool', zh: '需求池' },
  'sidebar.agents': { en: 'AI agents', zh: 'AI智能体' },
  'sidebar.knowledge': { en: 'Knowledge base', zh: '知识库' },
  'sidebar.settings': { en: 'Settings', zh: '设置' },
  'sidebar.configure': { en: 'Configure', zh: '配置' },
  'sidebar.language': { en: 'Language / 语言', zh: '语言 / Language' },
  'sidebar.switchEn': { en: 'Switch to 中文', zh: 'Switch to English' },
  
  // Activity
  'activity.2min': { en: '2 min ago', zh: '2分钟前' },
  'activity.15min': { en: '15 min ago', zh: '15分钟前' },
  'activity.1hour': { en: '1 hour ago', zh: '1小时前' },
  'activity.2hours': { en: '2 hours ago', zh: '2小时前' },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language')
      if (saved === 'en' || saved === 'zh') return saved
    }
    return 'en'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
  }

  const t = (key: string): string => {
    return translations[key]?.[language] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}