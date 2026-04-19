import { createContext, useState, useEffect, useCallback, useRef } from 'react'
import { getMe } from '../api/endpoints.js'

export const AuthContext = createContext(null)

const TOKEN_KEY   = 'payclutr_token'
const REFRESH_KEY = 'payclutr_refresh'
const USER_KEY    = 'payclutr_user'

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [token, setToken]   = useState(null)
  const [loading, setLoading] = useState(true)
  const tokenRef = useRef(null)

  const refreshUser = useCallback(async () => {
    if (!tokenRef.current) return
    try {
      const fresh = await getMe()
      setUser(fresh)
      localStorage.setItem(USER_KEY, JSON.stringify(fresh))
    } catch {
      // silently ignore — token may be expired
    }
  }, [])

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser  = localStorage.getItem(USER_KEY)

    if (storedToken && storedUser) {
      try {
        tokenRef.current = storedToken
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

  // Refresh user profile on window focus and every 60s
  useEffect(() => {
    const onFocus = () => refreshUser()
    window.addEventListener('focus', onFocus)
    const interval = setInterval(refreshUser, 60000)
    return () => {
      window.removeEventListener('focus', onFocus)
      clearInterval(interval)
    }
  }, [refreshUser])

  const login = useCallback((userData, authToken, refreshToken) => {
    localStorage.setItem(TOKEN_KEY, authToken)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
    tokenRef.current = authToken
    setToken(authToken)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    tokenRef.current = null
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
