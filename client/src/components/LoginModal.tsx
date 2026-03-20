import { useState, useEffect } from 'react'
import { X, Lock, Key, User, AlertCircle, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login, user } = useAuth()
  const { language } = useLanguage()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [remember, setRemember] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setUsername('')
      setPassword('')
      setToken('')
      setError('')
    }
  }, [isOpen])

  // If already logged in, close modal
  useEffect(() => {
    if (user && isOpen) {
      onClose()
    }
  }, [user, isOpen, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Validate
    if (!username.trim()) {
      setError(language === 'zh' ? '请输入用户名' : 'Please enter username')
      setIsLoading(false)
      return
    }

    if (!token.trim() && !password.trim()) {
      setError(language === 'zh' ? '请输入密码或令牌' : 'Please enter password or token')
      setIsLoading(false)
      return
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const result = login({
      username: username.trim(),
      password: password.trim() || undefined,
      token: token.trim() || undefined,
    }, remember)

    if (result.success) {
      onClose()
    } else {
      setError(result.error || (language === 'zh' ? '登录失败' : 'Login failed'))
    }
    
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
                {language === 'zh' ? '登录' : 'Login'}
              </h2>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  margin: 0,
                }}
              >
                {language === 'zh' ? '输入令牌或密码访问系统' : 'Enter token or password to access'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Username */}
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
                placeholder={language === 'zh' ? '输入用户名' : 'Enter username'}
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

          {/* Token */}
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
              {language === 'zh' ? '令牌' : 'Token'}
              <span
                style={{
                  marginLeft: '8px',
                  fontSize: '10px',
                  color: 'var(--primary)',
                  fontWeight: '500',
                }}
              >
                {language === 'zh' ? '必填' : 'Required'}
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <Key
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
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={language === 'zh' ? '输入访问令牌' : 'Enter access token'}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
          </div>

          {/* Password */}
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
              {language === 'zh' ? '密码' : 'Password'}
              <span
                style={{
                  marginLeft: '8px',
                  fontSize: '10px',
                  color: 'var(--text-tertiary)',
                  fontWeight: '500',
                }}
              >
                {language === 'zh' ? '(可选)' : '(Optional)'}
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={language === 'zh' ? '有密码时必填' : 'Required if password set'}
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

          {/* Remember Me */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}
              onClick={() => setRemember(!remember)}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  border: `2px solid ${remember ? 'var(--primary)' : 'var(--border)'}`,
                  background: remember ? 'var(--primary)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                {remember && <Check size={12} style={{ color: '#fff' }} />}
              </div>
              {language === 'zh' ? '记住登录（30天）' : 'Remember me (30 days)'}
            </label>
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
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid var(--text-tertiary)',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                {language === 'zh' ? '登录中...' : 'Logging in...'}
              </>
            ) : (
              <>
                <Lock size={16} />
                {language === 'zh' ? '登录' : 'Login'}
              </>
            )}
          </button>

          {/* Demo hint */}
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              background: 'var(--bg-tertiary)',
              borderRadius: '8px',
              fontSize: '11px',
              color: 'var(--text-tertiary)',
            }}
          >
            <strong>Demo:</strong>
            <br />
            Admin: username=<code style={{ color: 'var(--primary)' }}>admin</code>, token=<code style={{ color: 'var(--primary)' }}>atm_sk_abc123def456xyz789</code>
            <br />
            User: username=<code style={{ color: 'var(--primary)' }}>user001</code>, token=<code style={{ color: 'var(--primary)' }}>usr_sk_user001_token2026</code>
          </div>
        </form>
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
