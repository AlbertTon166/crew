import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FolderKanban, 
  Bot, 
  BookOpen, 
  MessageCircle,
  X,
  Settings,
  Globe,
  Code,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Key,
  Slack,
  MessageSquare,
  LogOut,
  Trash2,
  Plus,
  Lock,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  Rocket,
  TrendingUp,
  Settings as SettingsIcon
} from 'lucide-react'
import { useDashboardStore } from '../stores/dashboardStore'
import { useLanguage } from '../context/LanguageContext'
import { useDeployMode } from '../context/DeployModeContext'
import { useAuth } from '../context/AuthContext'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  
}

const navItems = [
  { path: '/', icon: LayoutDashboard, color: '#E879F9', cloudOnly: false },
  { path: '/projects', icon: FolderKanban, color: '#22D3EE', cloudOnly: false },
  { path: '/requirements', icon: MessageCircle, color: '#A78BFA', cloudOnly: false },
  { path: '/agents', icon: Bot, color: '#34D399', cloudOnly: false },
  { path: '/knowledge', icon: BookOpen, color: '#FBBF24', cloudOnly: false },
  { path: '/api-keys', icon: Key, color: '#6366F1', cloudOnly: false },
  { path: '/quickstart', icon: Rocket, color: '#F59E0B', cloudOnly: false },
  { path: '/usage', icon: TrendingUp, color: '#34D399', cloudOnly: false },
  { path: '/resources', icon: SettingsIcon, color: '#8B5CF6', cloudOnly: true },
]

const navLabels: Record<string, { en: string; zh: string }> = {
  '/': { en: 'Workspace', zh: '工作区' },
  '/projects': { en: 'Projects', zh: '项目' },
  '/requirements': { en: 'Requirements', zh: '需求池' },
  '/agents': { en: 'Agents', zh: '智能体' },
  '/knowledge': { en: 'Knowledge', zh: '知识库' },
  '/api-keys': { en: 'API Keys', zh: 'API密钥' },
  '/quickstart': { en: 'Quick Start', zh: '快速上手' },
  '/usage': { en: 'Usage Stats', zh: '使用统计' },
  '/resources': { en: 'Resources', zh: '资源管理' },
}

const navDescs: Record<string, { en: string; zh: string }> = {
  '/': { en: 'Workspace overview', zh: '工作区概览' },
  '/projects': { en: 'Manage projects', zh: '管理项目' },
  '/requirements': { en: 'Requirement pool', zh: '需求池' },
  '/agents': { en: 'AI agents', zh: 'AI智能体' },
  '/knowledge': { en: 'Knowledge base', zh: '知识库' },
  '/api-keys': { en: 'API keys management', zh: '管理AI模型密钥' },
  '/quickstart': { en: 'Get started guide', zh: '5分钟快速上手' },
  '/usage': { en: 'Token & cost analytics', zh: 'Token消耗与成本分析' },
  '/resources': { en: 'Shared keys & server management', zh: '共享密钥与服务器管理' },
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { agents } = useDashboardStore()
  const { language, setLanguage } = useLanguage()
  const navigate = useNavigate()
  const { mode } = useDeployMode()
  const { user, isAuthenticated, isAdmin, logout, tokens, generateToken, revokeToken, setPassword, users, deleteUser, auditLogs } = useAuth()
  
const [theme, setTheme] = useState<'dark' | 'light' | 'auto'>('dark')
  const [accentColor, setAccentColor] = useState('#E879F9')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [tokenUsername, setTokenUsername] = useState('')
  const [generatedToken, setGeneratedToken] = useState('')
  const onlineAgents = agents.filter(a => a.status === 'online').length

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en')
  }

  const applyTheme = (newTheme: 'dark' | 'light' | 'auto') => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.setAttribute('data-theme', 'dark')
    } else if (newTheme === 'light') {
      root.setAttribute('data-theme', 'light')
    } else {
      root.removeAttribute('data-theme')
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        root.setAttribute('data-theme', 'light')
      }
    }
  }

  const applyAccentColor = (color: string) => {
    setAccentColor(color)
    localStorage.setItem('accentColor', color)
    const root = document.documentElement
    root.style.setProperty('--primary', color)
    // Calculate hover color (slightly darker)
    const hoverColor = color.replace(/^#/, (r, g, b) => {
      const ri = parseInt(r, 16)
      const gi = parseInt(g, 16)
      const bi = parseInt(b, 16)
      const darker = Math.max(0, Math.floor(ri * 0.85)).toString(16).padStart(2, '0')
      const darkerg = Math.max(0, Math.floor(gi * 0.85)).toString(16).padStart(2, '0')
      const darkerb = Math.max(0, Math.floor(bi * 0.85)).toString(16).padStart(2, '0')
      return `#${darker}${darkerg}${darkerb}`
    })
    root.style.setProperty('--primary-hover', hoverColor)
    root.style.setProperty('--primary-glow', `${color}40`)
  }

  // Load saved theme and accent color on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | 'auto' | null
    const savedAccent = localStorage.getItem('accentColor')
    
    if (savedTheme) {
      applyTheme(savedTheme)
    }
    if (savedAccent) {
      applyAccentColor(savedAccent)
    }
  }, [])

  const settingsCategories = [
    { id: 'account', label: '账户', labelEn: 'Account', icon: User, cloudOnly: false },
    { id: 'notifications', label: '通知设置', labelEn: 'Notifications', icon: Bell, cloudOnly: false },
    { id: 'security', label: '安全设置', labelEn: 'Security', icon: Shield, cloudOnly: false },
    { id: 'tokens', label: '令牌管理', labelEn: 'Tokens', icon: Key, cloudOnly: false },
    { id: 'users', label: '用户管理', labelEn: 'Users', icon: Users, cloudOnly: true },
    { id: 'audit', label: '审计日志', labelEn: 'Audit Logs', icon: FileText, cloudOnly: true },
    { id: 'appearance', label: '外观', labelEn: 'Appearance', icon: Palette, cloudOnly: false },
    { id: 'integrations', label: '集成', labelEn: 'Integrations', icon: Slack, cloudOnly: false },
    { id: 'api', label: 'API配置', labelEn: 'API Config', icon: Key, cloudOnly: false },
    { id: 'channels', label: '通知渠道', labelEn: 'Channels', icon: MessageSquare, cloudOnly: false },
    { id: 'data', label: '数据管理', labelEn: 'Data', icon: Database, cloudOnly: false },
  ]

  // Filter settings based on deploy mode
  const visibleSettings = settingsCategories.filter(cat => !cat.cloudOnly || mode === 'cloud')

  return (
    <aside 
      className={`sidebar ${isOpen ? 'open' : ''}`}
      style={{ 
        width: '280px',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease'
      }}
    >
      {/* Logo */}
      <div style={{ 
        padding: '16px 16px 16px 14px', 
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Logo mark */}
        <div 
          style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0F172A 0%, #1a2332 100%)',
            border: '1px solid rgba(52, 211, 153, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
            boxShadow: '0 0 16px rgba(52, 211, 153, 0.1), inset 0 1px 0 rgba(255,255,255,0.03)'
          }}
        >
          {/* Crew Logo SVG */}
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="crewGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399"/>
                <stop offset="100%" stopColor="#8B5CF6"/>
              </linearGradient>
            </defs>
            {/* Outer hexagon */}
            <path d="M24 4L42 14V34L24 44L6 34V14L24 4Z" stroke="url(#crewGrad)" strokeWidth="1.5" fill="none" opacity="0.5"/>
            {/* Middle hexagon */}
            <path d="M24 10L36 18V30L24 38L12 30V18L24 10Z" fill="url(#crewGrad)" opacity="0.2"/>
            {/* Inner hexagon */}
            <path d="M24 15L31 20.5V27.5L24 33L17 27.5V20.5L24 15Z" fill="url(#crewGrad)" opacity="0.65"/>
            {/* Center dot */}
            <circle cx="24" cy="24" r="2.5" fill="white"/>
            {/* Nodes - top, 4 corners */}
            <circle cx="24" cy="5" r="1.5" fill="#34D399"/>
            <circle cx="41.5" cy="14" r="1.5" fill="#34D399"/>
            <circle cx="41.5" cy="34" r="1.5" fill="#8B5CF6"/>
            <circle cx="24" cy="43" r="1.5" fill="#8B5CF6"/>
            <circle cx="6.5" cy="34" r="1.5" fill="#34D399"/>
            <circle cx="6.5" cy="14" r="1.5" fill="#8B5CF6"/>
          </svg>
        </div>

        {/* Text */}
        <div style={{ minWidth: 0 }}>
          <h1 style={{ 
            fontSize: '17px', 
            fontWeight: '700', 
            fontFamily: 'Cabinet Grotesk, system-ui, sans-serif', 
            letterSpacing: '-0.02em',
            margin: 0,
            background: 'linear-gradient(90deg, #34D399 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Crew</h1>
          <p style={{ 
            fontSize: '10px', 
            color: 'var(--text-tertiary)',
            margin: '2px 0 0 0',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>Agent Teams Orchestrator</p>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ 
        flex: 1, 
        padding: '16px 12px',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.filter(item => !item.cloudOnly || mode === 'cloud').map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                borderRadius: '14px',
                textDecoration: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              className="nav-item"
            >
              {({ isActive }) => (
                <>
                  {/* Active background glow */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(135deg, ${item.color}15, transparent)`,
                      borderRadius: 'inherit'
                    }} />
                  )}
                  
                  {/* Icon container */}
                  <div 
                    style={{ 
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: isActive ? item.color : 'var(--bg-tertiary)',
                      boxShadow: isActive ? `0 4px 16px ${item.color}40` : 'none',
                      position: 'relative',
                      zIndex: 1,
                      flexShrink: 0
                    }}
                    className="nav-icon"
                  >
                    <item.icon 
                      size={20} 
                      style={{ 
                        color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                        transition: 'color 0.3s'
                      }} 
                    />
                  </div>
                  
                  {/* Text content */}
                  <div style={{ 
                    flex: 1,
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <div style={{ 
                      fontSize: '14px',
                      fontWeight: isActive ? '600' : '500',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontFamily: 'Satoshi, sans-serif',
                      transition: 'color 0.3s'
                    }}>
                      {language === 'en' ? navLabels[item.path].en : navLabels[item.path].zh}
                    </div>
                    <div style={{ 
                      fontSize: '12px',
                      color: isActive ? item.color : 'var(--text-tertiary)',
                      transition: 'color 0.3s',
                      marginTop: '2px'
                    }}>
                      {language === 'en' ? navDescs[item.path].en : navDescs[item.path].zh}
                    </div>
                  </div>
                  
                  {/* Active indicator - left bar */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '24px',
                      background: item.color,
                      borderRadius: '0 4px 4px 0',
                      boxShadow: `0 0 12px ${item.color}`,
                      zIndex: 2
                    }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div style={{ 
        padding: '16px 12px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Agent Status Card */}
        <div style={{ 
          borderRadius: '16px',
          padding: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          backdropFilter: 'blur(20px)'
        }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ 
              fontSize: '13px', 
              fontWeight: '600', 
              color: 'var(--text-primary)'
            }}>
              {language === 'en' ? 'Agent Status' : '智能体状态'}
            </span>
            <div className="flex items-center gap-2">
              <div style={{ 
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#34D399',
                boxShadow: '0 0 10px #34D399',
                animation: 'pulse 2s infinite'
              }} />
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '600',
                color: '#34D399'
              }}>
                {onlineAgents} {language === 'en' ? 'online' : '在线'}
              </span>
            </div>
          </div>
          
          {/* Agent status bars */}
          <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
            {agents.slice(0, 5).map(agent => (
              <div
                key={agent.id}
                style={{ 
                  flex: 1,
                  height: '4px',
                  borderRadius: '100px',
                  background: agent.status === 'online' ? '#34D399' : 
                             agent.status === 'busy' ? '#FBBF24' : 
                             agent.status === 'error' ? '#F87171' : 'var(--bg-tertiary)',
                  boxShadow: agent.status === 'online' ? '0 0 6px rgba(52, 211, 153, 0.5)' : 'none',
                  transition: 'all 0.3s'
                }}
                title={`${agent.name}: ${agent.status}`}
              />
            ))}
          </div>
        </div>

        {/* Language Switcher */}
        <button 
          onClick={toggleLanguage}
          style={{ 
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            borderRadius: '14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          className="hover-lift"
        >
          <div style={{ 
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)'
          }}>
            <Globe size={18} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ 
              fontSize: '13px', 
              fontWeight: '500',
              color: 'var(--text-secondary)'
            }}>
              Language / 语言
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: 'var(--text-tertiary)'
            }}>
              {language === 'en' ? 'Switch to 中文' : 'Switch to English'}
            </div>
          </div>
          <div style={{ 
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '700',
            background: 'var(--primary)',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px var(--primary-glow)'
          }}>
            {language.toUpperCase()}
          </div>
        </button>

        {/* Settings Button */}
        <button 
          onClick={() => navigate('/settings')}
          style={{ 
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            borderRadius: '14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          className="hover-lift"
        >
          <div style={{ 
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)'
          }}>
            <Settings size={18} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ 
              fontSize: '13px', 
              fontWeight: '500',
              color: 'var(--text-secondary)'
            }}>
              {language === 'en' ? 'Settings' : '设置'}
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: 'var(--text-tertiary)'
            }}>
              {language === 'en' ? 'Configure' : '配置'}
            </div>
          </div>
        </button>
      </div>

      {/* Nav item hover styles */}
      <style>{`
        @keyframes neonRainbow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .nav-item:hover .nav-icon {
          transform: scale(1.05);
        }
        
        .nav-item:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        
        .hover-lift:hover {
          transform: translateY(-2px);
          border-color: var(--border-hover);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .mobile-close-btn {
            display: flex !important;
          }
          
          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            width: 280px !important;
          }
          
          .sidebar.open {
            transform: translateX(0);
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
          }
        }
        
        @media (max-width: 1024px) {
          .sidebar {
            width: 260px;
          }
        }
      `}</style>


      {/* Settings Modal - moved to /settings page */}

      {/* Settings Modal - moved to /settings page */}
    </aside>
  )
}
