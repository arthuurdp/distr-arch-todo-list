import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, refreshSession, session, setUnauthorizedHandler } from '@/lib/api'
import type { AuthResponse, User } from '@/lib/api'

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => session.mayExist())

  const endSession = useCallback(() => {
    session.clear()
    setUser(null)
  }, [])

  const startSession = useCallback(({ token, user }: AuthResponse) => {
    session.start(token)
    setUser(user)
  }, [])

  const logout = useCallback(async () => {
    await api.logout().catch(() => {})
    endSession()
  }, [endSession])

  useEffect(() => {
    setUnauthorizedHandler(endSession)
    if (!session.mayExist()) return

    refreshSession()
      .then((restored) => (restored ? setUser(restored.user) : endSession()))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [endSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => startSession(await api.login({ email, password })),
      register: async (name, email, password) =>
        startSession(await api.register({ name, email, password })),
      logout,
    }),
    [user, loading, startSession, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return context
}
