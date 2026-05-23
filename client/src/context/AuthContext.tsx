import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import api from '../api'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AUTH_KEY = 'pt_user'

function readCache(): User | null {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) ?? 'null') } catch { return null }
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readCache)
  const [loading, setLoading] = useState(!readCache())

  const applyUser = (u: User | null) => {
    setUser(u)
    if (u) localStorage.setItem(AUTH_KEY, JSON.stringify(u))
    else localStorage.removeItem(AUTH_KEY)
  }

  useEffect(() => {
    api.get('/auth/me')
      .then(res => applyUser(res.data.user))
      .catch(() => applyUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    applyUser(res.data.user)
  }

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { name, email, password })
    applyUser(res.data.user)
  }

  const logout = async () => {
    await api.post('/auth/logout')
    applyUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
