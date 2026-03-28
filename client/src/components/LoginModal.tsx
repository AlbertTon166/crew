import { useState } from 'react'
import { X, Lock, Mail, User, AlertCircle, Check, Sparkles, Eye, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useDemo } from '../context/DemoContext'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login, user, users } = useAuth()
  const { language } = useLanguage()
  const { loadDemoData } = useDemo()
  
  const [mode, setMode] = useState<'register' | 'demo'>('register')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    // Validate
    if (!email.trim()) {
      setError(language === 'zh' ? '请输入邮箱地址' : 'Please enter email')
      setIsLoading(false)
      return
    }
    
    if (!username.trim()) {
      setError(language === 'zh' ? '请输入用户名' : 'Please enter username')
      setIsLoading(false)
      return
    }
    
    // Check if email already exists
    const emailExists = users.some(u => u.email === email.trim())
    if (emailExists) {
      setError(language === 'zh' ? '该邮箱已被注册' : 'Email already registered')
      setIsLoading(false)
      return
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800))

    // In demo mode, just auto-login with the new account
    const newUser = {
      id: `user_${Date.now()}`,
      username: username.trim(),
      email: email.trim(),
      isAdmin: false,
      createdAt: new Date().toISOString(),
    }
    
    // Add to users (in real app this would be an API call)
    const updatedUsers = [...users, newUser]
    localStorage.setItem('auth_users', JSON.stringify(updatedUsers))
    localStorage.setItem('auth_user', JSON.stringify(newUser))
    localStorage.setItem('auth_session_expiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString())
    
    setSuccess(language === 'zh' ? '注册成功！正在进入...' : 'Registration successful! Entering...')
    
    setTimeout(() => {
      window.location.reload()
    }, 1000)
    
    setIsLoading(false)
  }

  const handleDemo = async () => {
    setIsLoading(true)
    await loadDemoData()
    setTimeout(() => {
      onClose()
      window.location.reload()
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
        backdropFilter: 'blur(12px)',
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
          maxWidth: '420px',
          background: 'var(--bg-secondary)',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={20} style={{ color: '#fff' }} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                {language === 'zh' ? '开始使用 CrewForce' : 'Get Started with CrewForce'}
              </h2>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  margin: 0,
                }}
              >
                {mode === 'register' 
                  ? (language === 'zh' ? '注册新账号' : 'Create new account')
                  : (language === 'zh' ? '体验演示版本' : 'Try demo version')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'var(--bg-tertiary)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <X size={18} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              padding: '14px',
              background: mode === 'register' ? 'var(--bg-tertiary)' : 'transparent',
              border: 'none',
              borderBottom: mode === 'register' ? '2px solid var(--primary)' : '2px solid transparent',
              color: mode === 'register' ? 'var(--primary)' : 'var(--text-tertiary)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {language === 'zh' ? '邮箱注册' : 'Email Register'}
          </button>
          <button
            onClick={() => { setMode('demo'); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              padding: '14px',
              background: mode === 'demo' ? 'var(--bg-tertiary)' : 'transparent',
              border: 'none',
              borderBottom: mode === 'demo' ? '2px solid var(--primary)' : '2px solid transparent',
              color: mode === 'demo' ? 'var(--primary)' : 'var(--text-tertiary)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {language === 'zh' ? '游客体验' : 'Demo Mode'}
          </button>
        </div>

        {/* Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} style={{ padding: '24px' }}>
            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}
              >
                {language === 'zh' ? '邮箱' : 'Email'}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)',
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={language === 'zh' ? 'your@email.com' : 'your@email.com'}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>

            {/* Username */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}
              >
                {language === 'zh' ? '用户名' : 'Username'}
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)',
                  }}
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={language === 'zh' ? '选择用户名' : 'Choose username'}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'rgba(248, 113, 113, 0.1)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  borderRadius: '10px',
                  marginBottom: '16px',
                }}
              >
                <AlertCircle size={16} style={{ color: '#F87171' }} />
                <span style={{ fontSize: '13px', color: '#F87171' }}>{error}</span>
              </div>
            )}

            {/* Success */}
            {success && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'rgba(52, 211, 153, 0.1)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  borderRadius: '10px',
                  marginBottom: '16px',
                }}
              >
                <Check size={16} style={{ color: '#34D399' }} />
                <span style={{ fontSize: '13px', color: '#34D399' }}>{success}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                background: isLoading
                  ? 'var(--bg-tertiary)'
                  : 'linear-gradient(135deg, var(--primary), var(--accent-violet))',
                border: 'none',
                borderRadius: '12px',
                color: isLoading ? 'var(--text-tertiary)' : '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {language === 'zh' ? '注册中...' : 'Registering...'}
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  {language === 'zh' ? '创建账号' : 'Create Account'}
                </>
              )}
            </button>
          </form>
        )}

        {/* Demo Mode */}
        {mode === 'demo' && (
          <div style={{ padding: '24px' }}>
            <div
              style={{
                textAlign: 'center',
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))',
                borderRadius: '16px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Eye size={28} style={{ color: '#fff' }} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 8px' }}>
                {language === 'zh' ? '游客体验模式' : 'Demo Mode'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0 }}>
                {language === 'zh' 
                  ? '浏览完整功能示例，了解 CrewForce 如何帮助您管理AI智能体团队' 
                  : 'Browse sample data and see how CrewForce helps you manage AI agent teams'}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                {language === 'zh' ? '示例数据包含：' : 'Sample data includes:'}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { icon: '🤖', text: language === 'zh' ? '5个AI智能体' : '5 AI Agents' },
                  { icon: '📁', text: language === 'zh' ? '3个项目' : '3 Projects' },
                  { icon: '✅', text: language === 'zh' ? '多个已完成任务' : 'Several completed tasks' },
                  { icon: '📋', text: language === 'zh' ? '预置需求池' : 'Pre-loaded requirements' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleDemo}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                background: isLoading
                  ? 'var(--bg-tertiary)'
                  : 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
                border: 'none',
                borderRadius: '12px',
                color: isLoading ? 'var(--text-tertiary)' : '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {language === 'zh' ? '加载中...' : 'Loading...'}
                </>
              ) : (
                <>
                  <Eye size={16} />
                  {language === 'zh' ? '进入演示模式' : 'Enter Demo Mode'}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}
