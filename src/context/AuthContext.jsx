import { createContext, useState, useEffect, useCallback } from 'react'

export const AuthContext = createContext(null)

const TOKEN_KEY   = 'payclutr_token'
const REFRESH_KEY = 'payclutr_refresh'
const USER_KEY    = 'payclutr_user'

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [token, setToken]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser  = localStorage.getItem(USER_KEY)

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }

    setLoading(false)
  }, [])

  const login = useCallback((userData, authToken, refreshToken) => {
    localStorage.setItem(TOKEN_KEY, authToken)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
    setToken(authToken)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((data) => {
    setUser((prev) => {
      const updated = { ...prev, ...data }
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const isAuthenticated = !!user && !!token
  const isAdmin         = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated, isAdmin,
      login, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
