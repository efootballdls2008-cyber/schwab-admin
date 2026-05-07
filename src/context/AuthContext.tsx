import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { adminLogin } from '../services/authService'
import type { AdminUser } from '../types'

const STORAGE_KEY = 'cs_admin_user'

interface AuthContextValue {
  admin: AdminUser | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? (JSON.parse(stored) as AdminUser) : null
    } catch { return null }
  })

  useEffect(() => {
    if (admin) localStorage.setItem(STORAGE_KEY, JSON.stringify(admin))
    else localStorage.removeItem(STORAGE_KEY)
  }, [admin])

  const login = async (email: string, password: string): Promise<boolean> => {
    const result = await adminLogin(email, password)
    if (result) { setAdmin(result); return true }
    return false
  }

  const logout = () => { 
    setAdmin(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('admin_token')
  }

  return (
    <AuthContext.Provider value={{ admin, login, logout, isAuthenticated: admin !== null }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAdmin must be used within AuthProvider')
  return ctx
}
