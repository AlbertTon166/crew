import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User, AuthToken, LoginCredentials } from '../types/auth'
import { mockUsers, mockTokens } from '../types/auth'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  tokens: AuthToken[]
  login: (credentials: LoginCredentials, remember?: boolean) => { success: boolean; error?: string }
  logout: () => void
  // Quick login for localStorage-based users (bypasses password validation)
  quickLogin: (user: User) => void
  setPassword: (userId: string, password: string) => boolean
  generateToken: (userId: string, userName: string) => AuthToken | null
  revokeToken: (tokenId: string) => boolean
  getUserTokens: (userId: string) => AuthToken[]
  users: User[]
  addUser: (user: User) => void
  updateUser: (userId: string, updates: Partial<User>) => boolean
  deleteUser: (userId: string) => boolean
  auditLogs: AuditLog[]
  addAuditLog: (action: string, userId: string, details?: string) => void
}

interface AuditLog {
  id: string
  timestamp: string
  action: string
  userId: string
  userName?: string
  details?: string
  ip?: string
}

// Use crypto for secure random bytes
const getSecureRandomString = (length: number): string => {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Salted hash for passwords (simplified, use bcrypt in production)
const createSaltedHash = (password: string, salt?: string): { hash: string; salt: string } => {
  const useSalt = salt || getSecureRandomString(16)
  const combined = password + useSalt
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  // Add multiple rounds for better security
  let result = useSalt + hash.toString(16)
  for (let round = 0; round < 1000; round++) {
    result = getSecureRandomString(16) + result + round.toString(16)
  }
  return { hash: result, salt: useSalt }
}

const verifyPassword = (password: string, storedHash: string): boolean => {
  const salt = storedHash.substring(0, 32)
  const { hash } = createSaltedHash(password, salt)
  return hash === storedHash
}

// Token expiration time (7 days by default)
const TOKEN_EXPIRATION_DAYS = 7
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5

interface LoginAttempt {
  username: string
  attempts: number
  firstAttemptTime: number
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [tokens, setTokens] = useState<AuthToken[]>(mockTokens)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loginAttempts, setLoginAttempts] = useState<Record<string, LoginAttempt>>({})

  // Load from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user')
    const savedTokens = localStorage.getItem('auth_tokens')
    const savedUsers = localStorage.getItem('auth_users')
    const savedAuditLogs = localStorage.getItem('auth_audit_logs')
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        // Check if session is expired
        const sessionExpiry = localStorage.getItem('auth_session_expiry')
        if (sessionExpiry && Date.now() > parseInt(sessionExpiry)) {
          // Session expired
          localStorage.removeItem('auth_user')
          localStorage.removeItem('auth_session_expiry')
        } else {
          setUser(parsedUser)
        }
      } catch (e) {
        console.error('Failed to parse saved user', e)
      }
    }
    if (savedTokens) {
      try {
        const parsed = JSON.parse(savedTokens)
        // Filter out expired tokens
        const now = Date.now()
        setTokens(parsed.filter((t: AuthToken) => !t.expiresAt || new Date(t.expiresAt).getTime() > now))
      } catch (e) {
        console.error('Failed to parse saved tokens', e)
      }
    }
    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers))
      } catch (e) {
        console.error('Failed to parse saved users', e)
      }
    }
    if (savedAuditLogs) {
      try {
        setAuditLogs(JSON.parse(savedAuditLogs))
      } catch (e) {
        console.error('Failed to parse audit logs', e)
      }
    }
  }, [])

  // Save to localStorage when state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_session_expiry')
    }
  }, [user])

  useEffect(() => {
    localStorage.setItem('auth_tokens', JSON.stringify(tokens))
  }, [tokens])

  useEffect(() => {
    localStorage.setItem('auth_users', JSON.stringify(users))
  }, [users])

  useEffect(() => {
    localStorage.setItem('auth_audit_logs', JSON.stringify(auditLogs.slice(-100))) // Keep last 100 logs
  }, [auditLogs])

  const addAuditLog = useCallback((action: string, userId: string, details?: string) => {
    const log: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action,
      userId,
      userName: users.find(u => u.id === userId)?.username,
      details,
    }
    setAuditLogs(prev => [...prev, log])
  }, [users])

  const login = useCallback((credentials: LoginCredentials, remember: boolean = false): { success: boolean; error?: string } => {
    const { username, password, token } = credentials

    // Check login attempts
    const now = Date.now()
    const userAttempts = loginAttempts[username.toLowerCase()]
    if (userAttempts) {
      // Reset if window has passed
      if (now - userAttempts.firstAttemptTime > LOGIN_ATTEMPT_WINDOW_MS) {
        delete loginAttempts[username.toLowerCase()]
      } else if (userAttempts.attempts >= MAX_LOGIN_ATTEMPTS) {
        const remainingTime = Math.ceil((LOGIN_ATTEMPT_WINDOW_MS - (now - userAttempts.firstAttemptTime)) / 60000)
        return { success: false, error: `登录尝试过多，请在 ${remainingTime} 分钟后重试` }
      }
    }

    // Find user by username
    const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase())
    
    if (!foundUser) {
      // Record failed attempt
      setLoginAttempts(prev => ({
        ...prev,
        [username.toLowerCase()]: {
          username: username.toLowerCase(),
          attempts: (prev[username.toLowerCase()]?.attempts || 0) + 1,
          firstAttemptTime: prev[username.toLowerCase()]?.firstAttemptTime || now,
        }
      }))
      addAuditLog('LOGIN_FAILED', username, 'User not found')
      return { success: false, error: '用户不存在' }
    }

    let validLogin = false

    // If user has password configured, validate password OR token
    if (foundUser.passwordHash) {
      if (password) {
        // Validate password
        if (verifyPassword(password, foundUser.passwordHash)) {
          validLogin = true
        }
      } else if (token) {
        // Validate token
        const validToken = tokens.find(t => t.token === token && t.userId === foundUser.id && t.isActive)
        if (validToken) {
          // Check token expiration
          if (validToken.expiresAt && new Date(validToken.expiresAt).getTime() < now) {
            addAuditLog('LOGIN_FAILED', foundUser.id, 'Token expired')
            return { success: false, error: '令牌已过期' }
          }
          validLogin = true
        }
      } else {
        return { success: false, error: '请输入密码或令牌' }
      }
    } else {
      // No password configured, only validate token
      if (!token) {
        return { success: false, error: '请输入令牌' }
      }
      const validToken = tokens.find(t => t.token === token && t.userId === foundUser.id && t.isActive)
      if (!validToken) {
        // Record failed attempt
        setLoginAttempts(prev => ({
          ...prev,
          [username.toLowerCase()]: {
            username: username.toLowerCase(),
            attempts: (prev[username.toLowerCase()]?.attempts || 0) + 1,
            firstAttemptTime: prev[username.toLowerCase()]?.firstAttemptTime || now,
          }
        }))
        addAuditLog('LOGIN_FAILED', foundUser.id, 'Invalid token')
        return { success: false, error: '令牌无效或已过期' }
      }
      // Check token expiration
      if (validToken.expiresAt && new Date(validToken.expiresAt).getTime() < now) {
        addAuditLog('LOGIN_FAILED', foundUser.id, 'Token expired')
        return { success: false, error: '令牌已过期' }
      }
      validLogin = true
    }

    if (!validLogin) {
      // Record failed attempt
      setLoginAttempts(prev => ({
        ...prev,
        [username.toLowerCase()]: {
          username: username.toLowerCase(),
          attempts: (prev[username.toLowerCase()]?.attempts || 0) + 1,
          firstAttemptTime: prev[username.toLowerCase()]?.firstAttemptTime || now,
        }
      }))
      addAuditLog('LOGIN_FAILED', foundUser.id, 'Invalid credentials')
      return { success: false, error: '密码或令牌错误' }
    }

    // Clear failed attempts on successful login
    delete loginAttempts[username.toLowerCase()]

    // Set session expiry
    if (remember) {
      // Remember me: 30 days
      localStorage.setItem('auth_session_expiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString())
    } else {
      // Default session: 24 hours
      localStorage.setItem('auth_session_expiry', (Date.now() + 24 * 60 * 60 * 1000).toString())
    }

    setUser(foundUser)
    addAuditLog('LOGIN_SUCCESS', foundUser.id, remember ? 'Remember me' : 'Default session')
    return { success: true }
  }, [users, tokens, loginAttempts, addAuditLog])

  // Quick login - directly set user without password validation
  const quickLogin = useCallback((loginUser: User) => {
    setUser(loginUser)
    localStorage.setItem('auth_user', JSON.stringify(loginUser))
    localStorage.setItem('auth_session_expiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString())
  }, [])

  // Add a new user to the users list
  const addUser = useCallback((newUser: User) => {
    setUsers(prev => [...prev, newUser])
    const savedUsers = localStorage.getItem('auth_users')
    const currentUsers = savedUsers ? JSON.parse(savedUsers) : []
    localStorage.setItem('auth_users', JSON.stringify([...currentUsers, newUser]))
  }, [])

  const logout = useCallback(() => {
    if (user) {
      addAuditLog('LOGOUT', user.id)
    }
    setUser(null)
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_session_expiry')
  }, [user, addAuditLog])

  const setPassword = useCallback((userId: string, password: string): boolean => {
    const { hash, salt } = createSaltedHash(password)
    const passwordHash = salt + ':' + hash
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, passwordHash } : u
    ))
    // Update current user if it's the same
    setUser(prev => prev?.id === userId ? { ...prev, passwordHash } : prev)
    addAuditLog('PASSWORD_CHANGED', userId)
    return true
  }, [addAuditLog])

  const generateToken = useCallback((userId: string, userName: string): AuthToken | null => {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRATION_DAYS)
    
    const newToken: AuthToken = {
      id: Date.now().toString(),
      token: getSecureRandomString(32),
      userId,
      userName,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      isActive: true,
    }
    setTokens(prev => [...prev, newToken])
    addAuditLog('TOKEN_CREATED', userId, `Token for ${userName}`)
    return newToken
  }, [addAuditLog])

  const revokeToken = useCallback((tokenId: string): boolean => {
    const token = tokens.find(t => t.id === tokenId)
    if (token) {
      addAuditLog('TOKEN_REVOKED', token.userId, `Token ${token.token.substring(0, 8)}...`)
    }
    setTokens(prev => prev.map(t => 
      t.id === tokenId ? { ...t, isActive: false } : t
    ))
    return true
  }, [tokens, addAuditLog])

  const getUserTokens = useCallback((userId: string): AuthToken[] => {
    const now = Date.now()
    return tokens.filter(t => t.userId === userId && t.isActive && (!t.expiresAt || new Date(t.expiresAt).getTime() > now))
  }, [tokens])

  const updateUser = useCallback((userId: string, updates: Partial<User>): boolean => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, ...updates } : u
    ))
    // Update current user if it's the same
    setUser(prev => prev?.id === userId ? { ...prev, ...updates } : prev)
    addAuditLog('USER_UPDATED', userId, JSON.stringify(updates))
    return true
  }, [addAuditLog])

  const deleteUser = useCallback((userId: string): boolean => {
    const userToDelete = users.find(u => u.id === userId)
    if (userToDelete?.isAdmin) {
      return false // Cannot delete admin
    }
    setUsers(prev => prev.filter(u => u.id !== userId))
    // Revoke all tokens for this user
    setTokens(prev => prev.map(t => 
      t.userId === userId ? { ...t, isActive: false } : t
    ))
    addAuditLog('USER_DELETED', userId, `Deleted user: ${userToDelete?.username}`)
    return true
  }, [users, addAuditLog])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin || false,
        tokens,
        login,
        logout,
        quickLogin,
        setPassword,
        generateToken,
        revokeToken,
        getUserTokens,
        users,
        addUser,
        updateUser,
        deleteUser,
        auditLogs,
        addAuditLog,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
