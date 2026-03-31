import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Lock, Mail, AlertCircle, Check, Sparkles, Loader2, User, Eye, EyeOff } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess?: (user: any, token: string) => void
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const navigate = useNavigate()
  const { language } = useLanguage()
  
  const [formMode, setFormMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!email.trim()) {
      setError(language === 'zh' ? '请输入邮箱地址' : 'Please enter email')
      setIsLoading(false)
      return
    }
    if (!password) {
      setError(language === 'zh' ? '请输入密码' : 'Please enter password')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Login failed')
      }

      // Store token
      const tokens = JSON.parse(localStorage.getItem('auth_tokens') || '[]')
      tokens.push({ token: data.data.token, isActive: true })
      localStorage.setItem('auth_tokens', JSON.stringify(tokens))
      localStorage.setItem('auth_user', JSON.stringify(data.data.user))

      setSuccess(language === 'zh' ? '登录成功！' : 'Login successful!')
      setTimeout(() => {
        onClose()
        if (onLoginSuccess) {
          onLoginSuccess(data.data.user, data.data.token)
        } else {
          // Navigate to dashboard after successful login
          window.location.replace('/#/dashboard')
        }
      }, 500)
    } catch (err: any) {
      setError(err.message || (language === 'zh' ? '登录失败' : 'Login failed'))
    } finally {
      setIsLoading(false)
    }
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
    if (!password) {
      setError(language === 'zh' ? '请输入密码' : 'Please enter password')
      setIsLoading(false)
      return
    }
    if (password.length < 6) {
      setError(language === 'zh' ? '密码至少6个字符' : 'Password must be at least 6 characters')
      setIsLoading(false)
      return
    }
    if (password !== confirmPassword) {
      setError(language === 'zh' ? '两次密码不一致' : 'Passwords do not match')
      setIsLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError(language === 'zh' ? '请输入有效的邮箱地址' : 'Please enter a valid email')
      setIsLoading(false)
      return
    }

    if (!username.trim()) {
      setError(language === 'zh' ? '请输入用户名' : 'Please enter username')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), 
          password,
          username: username.trim()
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Registration failed')
      }

      // Store token
      const tokens = JSON.parse(localStorage.getItem('auth_tokens') || '[]')
      tokens.push({ token: data.data.token, isActive: true })
      localStorage.setItem('auth_tokens', JSON.stringify(tokens))
      localStorage.setItem('auth_user', JSON.stringify(data.data.user))

      setSuccess(language === 'zh' ? '注册成功！正在进入...' : 'Registered successfully! Entering...')
      setTimeout(() => {
        onClose()
        if (onLoginSuccess) {
          onLoginSuccess(data.data.user, data.data.token)
        } else {
          // Navigate to dashboard after successful registration
          window.location.replace('/#/dashboard')
        }
      }, 500)
    } catch (err: any) {
      setError(err.message || (language === 'zh' ? '注册失败' : 'Registration failed'))
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = (mode: 'login' | 'register') => {
    setFormMode(mode)
    setError('')
    setSuccess('')
    setPassword('')
    setConfirmPassword('')
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
                {formMode === 'login' ? (language === 'zh' ? '登录账号' : 'Login') : (language === 'zh' ? '注册账号' : 'Register')}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '8px', background: '#27272A', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            <X size={18} color="#71717A" />
          </button>
        </div>

        {/* Form Section */}
        <div style={{ padding: '24px' }}>
          {formMode === 'register' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#A1A1AA', marginBottom: '6px', textTransform: 'uppercase' }}>
                {language === 'zh' ? '用户名' : 'Username'}
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#52525B' }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={language === 'zh' ? '输入用户名' : 'Enter username'}
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
          )}

          <form onSubmit={formMode === 'login' ? handleLogin : handleRegister}>
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

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#A1A1AA', marginBottom: '6px', textTransform: 'uppercase' }}>
                {language === 'zh' ? '密码' : 'Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#52525B' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={language === 'zh' ? '输入密码' : 'Enter password'}
                  style={{
                    width: '100%', padding: '12px 42px 12px 42px',
                    background: '#27272A', border: '1px solid #3F3F46', borderRadius: '10px',
                    fontSize: '14px', color: '#FAFAFA', outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#6366F1')}
                  onBlur={(e) => (e.target.style.borderColor = '#3F3F46')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  {showPassword ? <EyeOff size={16} style={{ color: '#52525B' }} /> : <Eye size={16} style={{ color: '#52525B' }} />}
                </button>
              </div>
            </div>

            {formMode === 'register' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#A1A1AA', marginBottom: '6px', textTransform: 'uppercase' }}>
                  {language === 'zh' ? '确认密码' : 'Confirm Password'}
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#52525B' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={language === 'zh' ? '再次输入密码' : 'Confirm password'}
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
            )}

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
              {isLoading ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : formMode === 'login' ? (
                <Lock size={16} />
              ) : (
                <Sparkles size={16} />
              )}
              {isLoading 
                ? (language === 'zh' ? '处理中...' : 'Processing...')
                : formMode === 'login' 
                  ? (language === 'zh' ? '登录' : 'Login')
                  : (language === 'zh' ? '注册' : 'Register')}
            </button>
          </form>

          {/* Switch between login and register */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span style={{ color: '#71717A', fontSize: '13px' }}>
              {formMode === 'login' 
                ? (language === 'zh' ? '没有账号？' : "Don't have an account?")
                : (language === 'zh' ? '已有账号？' : 'Already have an account?')}
            </span>
            <button
              onClick={() => switchMode(formMode === 'login' ? 'register' : 'login')}
              style={{ background: 'none', border: 'none', color: '#6366F1', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginLeft: '4px' }}
            >
              {formMode === 'login' 
                ? (language === 'zh' ? '注册' : 'Register')
                : (language === 'zh' ? '登录' : 'Login')}
            </button>
          </div>
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
