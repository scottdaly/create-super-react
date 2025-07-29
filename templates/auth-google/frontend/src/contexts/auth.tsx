import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiFetch } from '../http'

type User = { id: string; email: string } | null
type AuthContextType = {
  user: User
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)

  const refresh = async () => {
    const res = await apiFetch('/api/auth/session')
    setUser(res.ok ? await res.json() : null)
  }

  useEffect(() => { refresh() }, [])

  const logout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    await refresh()
  }

  return (
    <AuthContext.Provider value={{ user, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}