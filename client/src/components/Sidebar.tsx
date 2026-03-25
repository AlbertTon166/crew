import { useState, useEffect } from 'react'
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
  FileText
} from 'lucide-react'
import { useDashboardStore } from '../stores/dashboardStore'
import { useLanguage } from '../context/LanguageContext'
import { useDeployMode } from '../context/DeployModeContext'
import { useAuth } from '../context/AuthContext'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  openSettingsTab?: string
}

const navItems = [
  { path: '/', icon: LayoutDashboard, color: '#E879F9', cloudOnly: false },
  { path: '/projects', icon: FolderKanban, color: '#22D3EE', cloudOnly: false },
  { path: '/requirements', icon: MessageCircle, color: '#A78BFA', cloudOnly: false },
  { path: '/agents', icon: Bot, color: '#34D399', cloudOnly: false },
  { path: '/knowledge', icon: BookOpen, color: '#FBBF24', cloudOnly: false },
  { path: '/api-keys', icon: Key, color: '#6366F1', cloudOnly: false },
]

const navLabels: Record<string, { en: string; zh: string }> = {
  '/': { en: 'Dashboard', zh: '控制台' },
  '/projects': { en: 'Projects', zh: '项目' },
  '/requirements': { en: 'Requirements', zh: '需求池' },
  '/agents': { en: 'Agents', zh: '智能体' },
  '/knowledge': { en: 'Knowledge', zh: '知识库' },
  '/api-keys': { en: 'API Keys', zh: 'API密钥' },
}

const navDescs: Record<string, { en: string; zh: string }> = {
  '/': { en: 'Overview & stats', zh: '概览与统计' },
  '/projects': { en: 'Manage projects', zh: '管理项目' },
  '/requirements': { en: 'Requirement pool', zh: '需求池' },
  '/agents': { en: 'AI agents', zh: 'AI智能体' },
  '/knowledge': { en: 'Knowledge base', zh: '知识库' },
  '/api-keys': { en: 'API keys management', zh: '管理AI模型密钥' },
}

export default function Sidebar({ isOpen = false, onClose, openSettingsTab }: SidebarProps) {
  const { agents } = useDashboardStore()
  const { language, setLanguage } = useLanguage()
  const { mode } = useDeployMode()
  const { user, isAuthenticated, isAdmin, logout, tokens, generateToken, revokeToken, setPassword, users, deleteUser, auditLogs } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const [settingsTab, setSettingsTab] = useState('profile')
  
  // Handle external settings tab trigger
  useEffect(() => {
    if (openSettingsTab) {
      setShowSettings(true)
      setSettingsTab(openSettingsTab)
    }
  }, [openSettingsTab])
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
          onClick={() => setShowSettings(true)}
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

      {/* Settings Modal */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '900px',
            height: '80vh',
            maxHeight: '700px',
            background: 'var(--bg-secondary)',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            display: 'flex',
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Settings Sidebar */}
            <div style={{
              width: '240px',
              borderRight: '1px solid var(--border)',
              padding: '20px',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                  {language === 'zh' ? '设置' : 'Settings'}
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  style={{
                    padding: '6px',
                    background: 'var(--bg-tertiary)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} style={{ color: 'var(--text-tertiary)' }} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {visibleSettings.map(cat => {
                  const Icon = cat.icon
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSettingsTab(cat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: settingsTab === cat.id ? 'var(--primary)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left'
                      }}
                    >
                      <Icon size={16} style={{ color: settingsTab === cat.id ? '#fff' : 'var(--text-secondary)' }} />
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: settingsTab === cat.id ? '#fff' : 'var(--text-secondary)'
                      }}>
                        {language === 'zh' ? cat.label : cat.labelEn}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Settings Content */}
            <div style={{
              flex: 1,
              padding: '24px',
              overflowY: 'auto'
            }}>
              {settingsTab === 'profile' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
                    {language === 'zh' ? '个人资料' : 'Profile'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                        {language === 'zh' ? '显示名称' : 'Display Name'}
                      </label>
                      <input
                        type="text"
                        defaultValue="Admin"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          fontSize: '14px',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                        {language === 'zh' ? '邮箱' : 'Email'}
                      </label>
                      <input
                        type="email"
                        defaultValue="admin@example.com"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          fontSize: '14px',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'notifications' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
                    {language === 'zh' ? '通知设置' : 'Notifications'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { label: '项目状态变更通知', labelEn: 'Project Status Changes', enabled: true },
                      { label: '智能体错误告警', labelEn: 'Agent Error Alerts', enabled: true },
                      { label: '每日报告推送', labelEn: 'Daily Report Push', enabled: false },
                      { label: '新需求提醒', labelEn: 'New Requirement Alerts', enabled: true },
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: '10px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                          {language === 'zh' ? item.label : item.labelEn}
                        </span>
                        <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: item.enabled ? 'var(--primary)' : 'var(--bg-secondary)', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: item.enabled ? '22px' : '2px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Account Settings */}
              {settingsTab === 'account' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
                    {language === 'zh' ? '账户' : 'Account'}
                  </h3>
                  
                  {isAuthenticated ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Current User Info */}
                      <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={24} style={{ color: '#fff' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {user?.username}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                              {user?.isAdmin ? (language === 'zh' ? '管理员' : 'Admin') : (language === 'zh' ? '普通用户' : 'User')}
                            </div>
                          </div>
                          {user?.isAdmin && (
                            <span style={{ marginLeft: 'auto', padding: '4px 8px', background: 'rgba(232, 121, 249, 0.15)', color: 'var(--primary)', borderRadius: '6px', fontSize: '10px', fontWeight: '600' }}>
                              ADMIN
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Password Configuration */}
                      <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <Lock size={18} style={{ color: 'var(--primary)' }} />
                          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {language === 'zh' ? '密码配置' : 'Password'}
                          </span>
                        </div>
                        {user?.passwordHash ? (
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                            {language === 'zh' ? '已配置密码' : 'Password configured'}
                          </p>
                        ) : (
                          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                            {language === 'zh' ? '设置密码后可通过密码或令牌登录' : 'Set password to login with password or token'}
                          </p>
                        )}
                        <button
                          onClick={() => setShowPasswordModal(true)}
                          style={{
                            padding: '8px 16px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            width: '100%'
                          }}
                        >
                          {user?.passwordHash ? (language === 'zh' ? '更新密码' : 'Update Password') : (language === 'zh' ? '设置密码' : 'Set Password')}
                        </button>
                      </div>

                      {/* Logout */}
                      <button
                        onClick={() => { logout(); setShowSettings(false); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '12px',
                          background: 'rgba(248, 113, 113, 0.1)',
                          border: '1px solid rgba(248, 113, 113, 0.3)',
                          borderRadius: '10px',
                          color: '#F87171',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        <LogOut size={16} />
                        {language === 'zh' ? '退出登录' : 'Logout'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px' }}>
                      <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={32} style={{ color: 'var(--text-tertiary)' }} />
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        {language === 'zh' ? '请登录以访问完整功能' : 'Please login to access all features'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Token Management (Admin only) */}
              {settingsTab === 'tokens' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
                    {language === 'zh' ? '令牌管理' : 'Token Management'}
                  </h3>
                  
                  {!isAdmin ? (
                    <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                      <Lock size={32} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {language === 'zh' ? '只有管理员可以管理令牌' : 'Only admin can manage tokens'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Generate Token */}
                      <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <Key size={18} style={{ color: 'var(--primary)' }} />
                          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {language === 'zh' ? '生成新令牌' : 'Generate New Token'}
                          </span>
                        </div>
                        {!showTokenInput ? (
                          <button
                            onClick={() => setShowTokenInput(true)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              padding: '10px 16px',
                              background: 'var(--primary)',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              width: '100%'
                            }}
                          >
                            <Plus size={14} />
                            {language === 'zh' ? '生成令牌' : 'Generate Token'}
                          </button>
                        ) : (
                          <div>
                            <input
                              type="text"
                              value={tokenUsername}
                              onChange={(e) => setTokenUsername(e.target.value)}
                              placeholder={language === 'zh' ? '输入用户名' : 'Enter username'}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: 'var(--text-primary)',
                                marginBottom: '8px'
                              }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  if (tokenUsername.trim()) {
                                    const newTok = generateToken(Date.now().toString(), tokenUsername.trim())
                                    if (newTok) {
                                      setGeneratedToken(newTok.token)
                                    }
                                  }
                                }}
                                style={{
                                  flex: 1,
                                  padding: '8px 12px',
                                  background: 'var(--primary)',
                                  border: 'none',
                                  borderRadius: '8px',
                                  color: '#fff',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                {language === 'zh' ? '生成' : 'Generate'}
                              </button>
                              <button
                                onClick={() => { setShowTokenInput(false); setTokenUsername(''); setGeneratedToken(''); }}
                                style={{
                                  flex: 1,
                                  padding: '8px 12px',
                                  background: 'var(--bg-secondary)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '8px',
                                  color: 'var(--text-secondary)',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                {language === 'zh' ? '取消' : 'Cancel'}
                              </button>
                            </div>
                            {generatedToken && (
                              <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                                  {language === 'zh' ? '新令牌：' : 'New Token:'}
                                </div>
                                <code style={{ fontSize: '11px', color: 'var(--primary)', wordBreak: 'break-all' }}>
                                  {generatedToken}
                                </code>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Token List */}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                          {language === 'zh' ? '活跃令牌' : 'Active Tokens'} ({tokens.filter(t => t.isActive).length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {tokens.filter(t => t.isActive).map(token => (
                            <div key={token.id} style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                  {token.userName || token.userId}
                                </span>
                                <button
                                  onClick={() => revokeToken(token.id)}
                                  style={{
                                    padding: '4px',
                                    background: 'rgba(248, 113, 113, 0.1)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Trash2 size={14} style={{ color: '#F87171' }} />
                                </button>
                              </div>
                              <code style={{ fontSize: '10px', color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>
                                {token.token.substring(0, 20)}...
                              </code>
                            </div>
                          ))}
                          {tokens.filter(t => t.isActive).length === 0 && (
                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                              {language === 'zh' ? '暂无活跃令牌' : 'No active tokens'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Management (Admin only) */}
              {settingsTab === 'users' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
                    {language === 'zh' ? '用户管理' : 'User Management'}
                  </h3>
                  
                  {!isAdmin ? (
                    <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                      <Lock size={32} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {language === 'zh' ? '只有管理员可以管理用户' : 'Only admin can manage users'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* User List */}
                      {users.map(u => (
                        <div key={u.id} style={{ padding: '14px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>{u.username.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{u.username}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{u.isAdmin ? (language === 'zh' ? '管理员' : 'Admin') : (language === 'zh' ? '普通用户' : 'User')}</div>
                              </div>
                            </div>
                            {!u.isAdmin && (
                              <button
                                onClick={() => {
                                  if (window.confirm(language === 'zh' ? `确定删除用户 ${u.username}？` : `Delete user ${u.username}?`)) {
                                    deleteUser(u.id)
                                  }
                                }}
                                style={{
                                  padding: '6px',
                                  background: 'rgba(248, 113, 113, 0.1)',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                }}
                              >
                                <Trash2 size={14} style={{ color: '#F87171' }} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Audit Logs (Admin only) */}
              {settingsTab === 'audit' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
                    {language === 'zh' ? '审计日志' : 'Audit Logs'}
                  </h3>
                  
                  {!isAdmin ? (
                    <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                      <Lock size={32} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {language === 'zh' ? '只有管理员可以查看审计日志' : 'Only admin can view audit logs'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                      {auditLogs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                          {language === 'zh' ? '暂无日志' : 'No logs yet'}
                        </div>
                      ) : auditLogs.slice().reverse().map(log => (
                        <div key={log.id} style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '600', color: log.action.includes('SUCCESS') ? '#34D399' : log.action.includes('FAILED') ? '#F87171' : 'var(--text-primary)' }}>
                              {log.action}
                            </span>
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>
                              {new Date(log.timestamp).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)' }}>
                            {log.userName || log.userId}
                            {log.details && ` - ${log.details}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Security Settings */}
              {settingsTab === 'security' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
                    {language === 'zh' ? '安全设置' : 'Security'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <Shield size={20} style={{ color: 'var(--accent-emerald)' }} />
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {language === 'zh' ? '双因素认证' : 'Two-Factor Auth'}
                        </span>
                      </div>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {language === 'zh' ? '当前状态：未启用' : 'Status: Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'appearance' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
                    {language === 'zh' ? '外观' : 'Appearance'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase' }}>
                        {language === 'zh' ? '主题' : 'Theme'}
                      </label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {[
                          { id: 'dark', label: '🌙 Dark', labelEn: '🌙 Dark' },
                          { id: 'light', label: '☀️ Light', labelEn: '☀️ Light' },
                          { id: 'auto', label: '⚡ Auto', labelEn: '⚡ Auto' },
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => applyTheme(t.id as 'dark' | 'light' | 'auto')}
                            style={{
                              flex: 1,
                              padding: '12px',
                              background: theme === t.id ? 'var(--primary)' : 'var(--bg-tertiary)',
                              border: theme === t.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                              borderRadius: '10px',
                              color: theme === t.id ? '#fff' : 'var(--text-secondary)',
                              fontSize: '13px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {language === 'zh' ? t.label : t.labelEn}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase' }}>
                        {language === 'zh' ? '主色调' : 'Accent Color'}
                      </label>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {[
                          { color: '#E879F9', name: '紫色', nameEn: 'Purple' },
                          { color: '#3B82F6', name: '蓝色', nameEn: 'Blue' },
                          { color: '#10B981', name: '绿色', nameEn: 'Green' },
                          { color: '#F59E0B', name: '橙色', nameEn: 'Orange' },
                          { color: '#EF4444', name: '红色', nameEn: 'Red' },
                        ].map(c => (
                          <button
                            key={c.color}
                            onClick={() => applyAccentColor(c.color)}
                            title={language === 'zh' ? c.name : c.nameEn}
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '12px',
                              background: c.color,
                              cursor: 'pointer',
                              border: accentColor === c.color ? '3px solid #fff' : '3px solid transparent',
                              boxShadow: accentColor === c.color ? `0 0 16px ${c.color}80` : 'none',
                              transition: 'all 0.2s',
                              transform: accentColor === c.color ? 'scale(1.1)' : 'scale(1)'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'integrations' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
                    {language === 'zh' ? '集成' : 'Integrations'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { name: 'Slack', nameZh: 'Slack', desc: language === 'zh' ? '团队协作工具' : 'Team collaboration', connected: true },
                      { name: 'Discord', nameZh: 'Discord', desc: language === 'zh' ? '社区交流平台' : 'Community platform', connected: false },
                      { name: 'GitHub', nameZh: 'GitHub', desc: language === 'zh' ? '代码托管服务' : 'Code hosting', connected: true },
                      { name: 'Notion', nameZh: 'Notion', desc: language === 'zh' ? '文档协作工具' : 'Documentation', connected: false },
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
                            {language === 'zh' ? item.nameZh : item.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                            {item.desc}
                          </div>
                        </div>
                        <button
                          style={{
                            padding: '6px 14px',
                            background: item.connected ? 'var(--bg-secondary)' : 'var(--primary)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: item.connected ? 'var(--text-secondary)' : '#fff',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          {item.connected ? (language === 'zh' ? '已连接' : 'Connected') : (language === 'zh' ? '连接' : 'Connect')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {settingsTab === 'api' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
                    {language === 'zh' ? 'API配置' : 'API Configuration'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                        {language === 'zh' ? 'API地址' : 'API Endpoint'}
                      </label>
                      <input
                        type="text"
                        defaultValue="https://api.aipm.example.com/v1"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          fontSize: '14px',
                          color: 'var(--text-primary)',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                        {language === 'zh' ? '请求超时(秒)' : 'Request Timeout (s)'}
                      </label>
                      <input
                        type="number"
                        defaultValue="30"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          fontSize: '14px',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'channels' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
                    {language === 'zh' ? '通知渠道' : 'Notification Channels'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { name: 'Email', nameZh: '邮箱', icon: '📧', enabled: true },
                      { name: 'Feishu', nameZh: '飞书', icon: '📱', enabled: true },
                      { name: 'WeChat', nameZh: '微信', icon: '💬', enabled: false },
                      { name: 'DingTalk', nameZh: '钉钉', icon: '🔔', enabled: false },
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '20px' }}>{item.icon}</span>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {language === 'zh' ? item.nameZh : item.name}
                          </span>
                        </div>
                        <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: item.enabled ? 'var(--primary)' : 'var(--bg-secondary)', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: item.enabled ? '22px' : '2px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {settingsTab === 'data' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
                    {language === 'zh' ? '数据管理' : 'Data Management'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                        {language === 'zh' ? '导出数据' : 'Export Data'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                        {language === 'zh' ? '导出所有项目、智能体和配置数据' : 'Export all projects, agents and configuration data'}
                      </div>
                      <button style={{
                        padding: '8px 16px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}>
                        {language === 'zh' ? '导出JSON' : 'Export JSON'}
                      </button>
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#F87171', marginBottom: '8px' }}>
                        {language === 'zh' ? '危险区域' : 'Danger Zone'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                        {language === 'zh' ? '清除所有数据此操作不可恢复' : 'Clear all data - This action cannot be undone'}
                      </div>
                      <button style={{
                        padding: '8px 16px',
                        background: '#EF4444',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}>
                        {language === 'zh' ? '清除所有数据' : 'Clear All Data'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Password Configuration Modal */}
      {showPasswordModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPasswordModal(false)
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '400px',
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                {language === 'zh' ? '设置密码' : 'Set Password'}
              </h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={{
                  padding: '6px',
                  background: 'var(--bg-tertiary)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <X size={16} style={{ color: 'var(--text-tertiary)' }} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {passwordSuccess ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <CheckCircle size={48} style={{ color: '#34D399', marginBottom: '12px' }} />
                  <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '16px' }}>
                    {language === 'zh' ? '密码设置成功！' : 'Password set successfully!'}
                  </p>
                  <button
                    onClick={() => { setShowPasswordModal(false); setPasswordSuccess(false); }}
                    style={{
                      padding: '10px 20px',
                      background: 'var(--primary)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    OK
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      {language === 'zh' ? '新密码' : 'New Password'}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      {language === 'zh' ? '确认密码' : 'Confirm Password'}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  {passwordError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'rgba(248, 113, 113, 0.1)', borderRadius: '8px', marginBottom: '16px' }}>
                      <AlertCircle size={14} style={{ color: '#F87171' }} />
                      <span style={{ fontSize: '12px', color: '#F87171' }}>{passwordError}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setShowPasswordModal(false)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'var(--bg-tertiary)',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      {language === 'zh' ? '取消' : 'Cancel'}
                    </button>
                    <button
                      onClick={() => {
                        if (newPassword.length < 6) {
                          setPasswordError(language === 'zh' ? '密码至少6位' : 'Password must be at least 6 characters')
                          return
                        }
                        if (newPassword !== confirmPassword) {
                          setPasswordError(language === 'zh' ? '两次密码不一致' : 'Passwords do not match')
                          return
                        }
                        if (user) {
                          setPassword(user.id, newPassword)
                          setPasswordSuccess(true)
                          setNewPassword('')
                          setConfirmPassword('')
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      {language === 'zh' ? '保存' : 'Save'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
