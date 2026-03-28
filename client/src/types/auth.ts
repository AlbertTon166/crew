// User types
export interface User {
  id: string
  username: string
  email?: string
  passwordHash?: string  // If exists, user has configured password
  isAdmin: boolean
  createdAt: string
  isDemo?: boolean  // Demo user flag
}

// Auth token
export interface AuthToken {
  id: string
  token: string
  userId: string
  userName?: string
  createdAt: string
  expiresAt?: string
  isActive: boolean
}

// Login credentials
export interface LoginCredentials {
  username: string
  password?: string
  token?: string
}

// Auth state
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
}

// Mock users for demo
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    passwordHash: undefined, // Admin uses token only by default
    isAdmin: true,
    createdAt: '2026-01-01',
  },
  {
    id: '2',
    username: 'user001',
    passwordHash: undefined,
    isAdmin: false,
    createdAt: '2026-03-01',
  },
]

// Mock tokens for demo
export const mockTokens: AuthToken[] = [
  {
    id: '1',
    token: 'atm_sk_abc123def456xyz789',
    userId: '1',
    userName: 'admin',
    createdAt: '2026-03-01',
    isActive: true,
  },
  {
    id: '2',
    token: 'usr_sk_user001_token2026',
    userId: '2',
    userName: 'user001',
    createdAt: '2026-03-10',
    isActive: true,
  },
]
