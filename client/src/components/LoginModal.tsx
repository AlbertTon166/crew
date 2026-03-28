import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Lock, Mail, AlertCircle, Check, Sparkles, Eye, Loader2, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useDemo } from '../context/DemoContext'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const navigate = useNavigate()
  const { login, user, users, updateUser } = useAuth()
  const { language } = useLanguage()
  const { loadDemoData } = useDemo()
  
  const [mode, setMode] = useState<'register' | 'demo'>('demo')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Auto-generate username from email
  const generateUsername = (email: string) => {
    const localPart = email.split('@')[0]
    const cleanPart = localPart.replace(/[^a-zA-Z0-9]/g, '')
    const randomNum = Math.floor(Math.random() * 9000) + 1000
    return `${cleanPart}${randomNum}`.substring(0, 20)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    // Validate email only
    if (!email.trim()) {
      setError(language === 'zh' ? '请输入邮箱地址' : 'Please enter your email')
      setIsLoading(false)
      return
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError(language === 'zh' ? '请输入有效的邮箱地址' : 'Please enter a valid email address')
      setIsLoading(false)
      return
    }
    
    // Check if email already exists
    const emailExists = users.some(u => u.email === email.trim().toLowerCase())
    if (emailExists) {
      setError(language === 'zh' ? '该邮箱已被注册，请直接登录' : 'Email already registered, please login')
      setIsLoading(false)
      return
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800))

    // Auto-generate username
    const username = generateUsername(email)

    // Create new user
    const newUser = {
      id: `user_${Date.now()}`,
      username: username,
      email: email.trim().toLowerCase(),
      isAdmin: false,
      createdAt: new Date().toISOString(),
    }
    
    // Add user to auth context (this also saves to localStorage via useEffect)
    // We need to directly update the users state and set current user
    const updatedUsers = [...users, newUser]
    
    // Manually trigger the storage update since we're bypassing the context's updateUser
    localStorage.setItem('auth_users', JSON.stringify(updatedUsers))
    
    // Set session expiry
    localStorage.setItem('auth_session_expiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString())
    
    // Set current user in localStorage (AuthContext will pick this up on next render)
    localStorage.setItem('auth_user', JSON.stringify(newUser))
    
    setSuccess(language === 'zh' ? '注册成功！正在进入...' : 'Registration successful! Entering...')
    
    // Close modal and navigate to dashboard
    setTimeout(() => {
      onClose()
      navigate('/dashboard')
    }, 500)
    
    setIsLoading(false)
  }

  const handleDemo = async () => {
    setIsLoading(true)
    await loadDemoData()
    setTimeout(() => {
      onClose()
      navigate('/dashboard')
    }, 500)
    setIsLoading(false)
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'linear-gradient(180deg, #18181B 0%, #09090B 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 28px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Logo */}
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
                position: 'relative'
              }}
            >
              <Lock size={20} style={{ color: '#fff' }} />
              <div 
                style={{
                  position: 'absolute',
                  inset: -4,
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.4))',
                  filter: 'blur(12px)',
                  zIndex: -1
                }}
              />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#FAFAFA',
                  margin: 0,
                  fontFamily: "'Cabinet Grotesk', sans-serif",
                  letterSpacing: '-0.02em'
                }}
              >
                {language === 'zh' ? '开始使用' : 'Get Started'}
              </h2>
              <p
                style={{
                  fontSize: '13px',
                  color: '#71717A',
                  margin: '2px 0 0 0',
                }}
              >
                {mode === 'register' 
                  ? (language === 'zh' ? '创建免费账号' : 'Create free account')
                  : (language === 'zh' ? '无需注册立即体验' : 'Try without signing up')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'
            }}
          >
            <X size={18} style={{ color: '#71717A' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '28px' }}>
          {/* Demo Mode - Primary CTA */}
          <button
            onClick={handleDemo}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '20px',
              background: mode === 'demo' 
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)'
                : 'rgba(30, 41, 59, 0.5)',
              border: mode === 'demo'
                ? '1px solid rgba(99, 102, 241, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              marginBottom: '16px',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {/* Glow effect when active */}
            {mode === 'demo' && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                  flexShrink: 0
                }}
              >
                <Zap size={24} style={{ color: '#fff' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '700', 
                  color: mode === 'demo' ? '#FAFAFA' : '#A1A1AA',
                  fontFamily: "'Cabinet Grotesk', sans-serif",
                  marginBottom: '4px'
                }}>
                  {language === 'zh' ? '快速体验 Demo' : 'Quick Demo'}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: '#71717A'
                }}>
                  {language === 'zh' 
                    ? '浏览示例数据，无需注册' 
                    : 'Browse sample data, no signup needed'}
                </div>
              </div>
              <ChevronRightIcon className="ml-auto" />
            </div>
          </button>

          {/* Divider */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px', 
            margin: '20px 0',
            opacity: 0.5
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
            <span style={{ fontSize: '12px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {language === 'zh' ? '或' : 'or'}
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
          </div>

          {/* Register Form */}
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#A1A1AA',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {language === 'zh' ? '邮箱地址' : 'Email Address'}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#71717A',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={language === 'zh' ? 'your@email.com' : 'your@email.com'}
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 48px',
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    fontSize: '15px',
                    color: '#FAFAFA',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)'
                    e.target.style.background = 'rgba(30, 41, 59, 0.8)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                    e.target.style.boxShadow = 'none'
                    e.target.style.background = 'rgba(30, 41, 59, 0.6)'
                  }}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  background: 'rgba(248, 113, 113, 0.1)',
                  border: '1px solid rgba(248, 113, 113, 0.2)',
                  borderRadius: '12px',
                  marginBottom: '16px',
                }}
              >
                <AlertCircle size={16} style={{ color: '#F87171', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#F87171' }}>{error}</span>
              </div>
            )}

            {/* Success */}
            {success && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  background: 'rgba(52, 211, 153, 0.1)',
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                  borderRadius: '12px',
                  marginBottom: '16px',
                }}
              >
                <Check size={16} style={{ color: '#34D399', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#34D399' }}>{success}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '16px',
                background: isLoading
                  ? 'rgba(30, 41, 59, 0.5)'
                  : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                border: 'none',
                borderRadius: '14px',
                color: isLoading ? '#71717A' : '#fff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontFamily: "'Cabinet Grotesk', sans-serif",
                boxShadow: isLoading ? 'none' : '0 8px 24px rgba(99, 102, 241, 0.35)'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(99, 102, 241, 0.45)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = isLoading ? 'none' : '0 8px 24px rgba(99, 102, 241, 0.35)'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  {language === 'zh' ? '处理中...' : 'Processing...'}
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  {language === 'zh' ? '创建免费账号' : 'Create Free Account'}
                </>
              )}
            </button>
          </form>

          {/* Sample data info */}
          <div style={{
            marginTop: '16px',
            padding: '14px',
            background: 'rgba(52, 211, 153, 0.05)',
            border: '1px solid rgba(52, 211, 153, 0.1)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Eye size={16} style={{ color: '#34D399', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#71717A' }}>
              {language === 'zh' 
                ? '注册只需邮箱，用户名将自动生成' 
                : 'Registration only needs email, username auto-generated'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '12px', color: '#52525B' }}>
            {language === 'zh' 
              ? '点击"快速体验"即表示同意' 
              : 'By clicking Quick Demo, you agree to our'}{' '}
            <a href="#" style={{ color: '#6366F1', textDecoration: 'none' }}>
              {language === 'zh' ? '服务条款' : 'Terms'}
            </a>
            {' '}&{' '}
            <a href="#" style={{ color: '#6366F1', textDecoration: 'none' }}>
              {language === 'zh' ? '隐私政策' : 'Privacy'}
            </a>
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// ChevronRight icon component
function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ color: '#71717A' }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
