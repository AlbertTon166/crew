import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Lock, Mail, User, AlertCircle, Check, Sparkles, Eye, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useDemo } from '../context/DemoContext'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const navigate = useNavigate()
  const { login, users } = useAuth()
  const { language } = useLanguage()
  const { loadDemoData } = useDemo()
  
  const [mode, setMode] = useState<'login' | 'register' | 'demo'>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!email.trim()) {
      setError(language === 'zh' ? '请输入邮箱地址' : 'Please enter email')
      setIsLoading(false)
      return
    }

    // Find user by email
    const foundUser = users.find(u => u.email === email.trim().toLowerCase())
    
    if (!foundUser) {
      setError(language === 'zh' ? '该邮箱未注册，请先注册' : 'Email not registered, please register first')
      setIsLoading(false)
      return
    }

    // Simulate login
    await new Promise(resolve => setTimeout(resolve, 500))
    
    localStorage.setItem('auth_user', JSON.stringify(foundUser))
    localStorage.setItem('auth_session_expiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString())
    
    setSuccess(language === 'zh' ? '登录成功！' : 'Login successful!')
    
    setTimeout(() => {
      onClose()
      navigate('/dashboard')
    }, 500)
    
    setIsLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    if (!email.trim()) {
      setError(language === 'zh' ? '请输入邮箱地址' : 'Please enter email')
      setIsLoading(false)
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError(language === 'zh' ? '请输入有效的邮箱地址' : 'Please enter a valid email')
      setIsLoading(false)
      return
    }
    
    const emailExists = users.some(u => u.email === email.trim().toLowerCase())
    if (emailExists) {
      setError(language === 'zh' ? '该邮箱已被注册，请直接登录' : 'Email already registered, please login')
      setIsLoading(false)
      return
    }

    await new Promise(resolve => setTimeout(resolve, 800))

    const username = generateUsername(email)

    const newUser = {
      id: `user_${Date.now()}`,
      username: username,
      email: email.trim().toLowerCase(),
      isAdmin: false,
      createdAt: new Date().toISOString(),
    }
    
    const updatedUsers = [...users, newUser]
    localStorage.setItem('auth_users', JSON.stringify(updatedUsers))
    localStorage.setItem('auth_user', JSON.stringify(newUser))
    localStorage.setItem('auth_session_expiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString())
    
    setSuccess(language === 'zh' ? '注册成功！正在进入...' : 'Registered successfully! Entering...')
    
    setTimeout(() => {
      onClose()
      navigate('/dashboard')
    }, 500)
    
    setIsLoading(false)
  }

  const handleDemo = async () => {
    setIsLoading(true)
    
    const demoUser = {
      id: 'demo_user',
      username: 'demo_user',
      email: 'demo@demo.local',
      isAdmin: false,
      createdAt: new Date().toISOString(),
      isDemo: true,
    }
    
    localStorage.setItem('auth_user', JSON.stringify(demoUser))
    localStorage.setItem('auth_session_expiry', (Date.now() + 24 * 60 * 60 * 1000).toString())
    
    await loadDemoData()
    
    setTimeout(() => {
      onClose()
      navigate('/dashboard')
    }, 300)
    
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
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#FAFAFA', margin: 0 }}>CrewForce</h2>
              <p style={{ fontSize: '12px', color: '#71717A', margin: 0 }}>
                {mode === 'login' ? (language === 'zh' ? '登录账号' : 'Login') : 
                 mode === 'register' ? (language === 'zh' ? '注册账号' : 'Register') : 
                 (language === 'zh' ? '游客体验' : 'Demo Mode')}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '8px', background: '#27272A', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            <X size={18} color="#71717A" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          {['login', 'register', 'demo'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setMode(tab as any); setError(''); setSuccess(''); }}
              style={{
                flex: 1,
                padding: '14px',
                background: mode === tab ? '#27272A' : 'transparent',
                border: 'none',
                borderBottom: mode === tab ? '2px solid #6366F1' : '2px solid transparent',
                color: mode === tab ? '#FAFAFA' : '#71717A',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {tab === 'login' ? (language === 'zh' ? '登录' : 'Login') : 
               tab === 'register' ? (language === 'zh' ? '注册' : 'Register') : 
               (language === 'zh' ? '体验' : 'Demo')}
            </button>
          ))}
        </div>

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#A1A1AA', marginBottom: '6px', textTransform: 'uppercase' }}>
                {language === 'zh' ? '邮箱' : 'Email'}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#52525B' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={language === 'zh' ? 'your@email.com' : 'your@email.com'}
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px',
                    background: '#27272A', border: '1px solid #3F3F46', borderRadius: '10px',
                    fontSize: '14px', color: '#FAFAFA', outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#6366F1')}
                  onBlur={(e) => (e.target.style.borderColor = '#3F3F46')}
                />
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '10px', marginBottom: '16px' }}>
                <AlertCircle size={16} style={{ color: '#F87171' }} />
                <span style={{ fontSize: '13px', color: '#F87171' }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: isLoading ? '#27272A' : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: isLoading ? '#71717A' : '#fff', fontSize: '14px', fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {isLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={16} />}
              {language === 'zh' ? '登录' : 'Login'}
            </button>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#A1A1AA', marginBottom: '6px', textTransform: 'uppercase' }}>
                {language === 'zh' ? '邮箱' : 'Email'}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#52525B' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={language === 'zh' ? 'your@email.com' : 'your@email.com'}
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px',
                    background: '#27272A', border: '1px solid #3F3F46', borderRadius: '10px',
                    fontSize: '14px', color: '#FAFAFA', outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#6366F1')}
                  onBlur={(e) => (e.target.style.borderColor = '#3F3F46')}
                />
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '10px', marginBottom: '16px' }}>
                <AlertCircle size={16} style={{ color: '#F87171' }} />
                <span style={{ fontSize: '13px', color: '#F87171' }}>{error}</span>
              </div>
            )}

            {success && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '10px', marginBottom: '16px' }}>
                <Check size={16} style={{ color: '#34D399' }} />
                <span style={{ fontSize: '13px', color: '#34D399' }}>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: isLoading ? '#27272A' : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: isLoading ? '#71717A' : '#fff', fontSize: '14px', fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {isLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
              {language === 'zh' ? '创建账号' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Demo Mode */}
        {mode === 'demo' && (
          <div style={{ padding: '24px' }}>
            <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <Eye size={40} style={{ color: '#6366F1', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#FAFAFA', margin: '0 0 8px' }}>
                {language === 'zh' ? '游客体验模式' : 'Demo Mode'}
              </h3>
              <p style={{ fontSize: '13px', color: '#71717A', margin: 0 }}>
                {language === 'zh' ? '浏览示例数据，体验完整功能' : 'Browse sample data and try all features'}
              </p>
            </div>

            <button
              onClick={handleDemo}
              disabled={isLoading}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: isLoading ? '#27272A' : 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                color: isLoading ? '#71717A' : '#fff', fontSize: '14px', fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {isLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Eye size={16} />}
              {language === 'zh' ? '进入演示模式' : 'Enter Demo Mode'}
            </button>
          </div>
        )}
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
