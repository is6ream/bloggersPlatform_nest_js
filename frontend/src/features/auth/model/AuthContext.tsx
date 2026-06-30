import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as authApi from '../api/authApi'
import type { AuthUser, LoginPayload } from './types'
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
} from './tokenStorage'

type AuthContextValue = {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isInitializing: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function resolveCurrentUser(
  token: string | null,
): Promise<{ user: AuthUser | null; accessToken: string | null }> {
  const activeToken = token ?? getStoredAccessToken()

  if (activeToken) {
    try {
      const user = await authApi.getMe(activeToken)
      return { user, accessToken: activeToken }
    } catch {
      clearStoredAccessToken()
    }
  }

  try {
    const refreshed = await authApi.refreshToken()
    setStoredAccessToken(refreshed.accessToken)
    const user = await authApi.getMe(refreshed.accessToken)
    return { user, accessToken: refreshed.accessToken }
  } catch {
    clearStoredAccessToken()
    return { user: null, accessToken: null }
  }
}

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let cancelled = false

    resolveCurrentUser(null).then((session) => {
      if (cancelled) {
        return
      }

      setUser(session.user)
      setAccessToken(session.accessToken)
      setIsInitializing(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const tokens = await authApi.login(payload)
    setStoredAccessToken(tokens.accessToken)
    const nextUser = await authApi.getMe(tokens.accessToken)

    setAccessToken(tokens.accessToken)
    setUser(nextUser)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      clearStoredAccessToken()
      setAccessToken(null)
      setUser(null)
    }
  }, [])

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isInitializing,
      isAuthenticated: user !== null,
      login,
      logout,
    }),
    [user, accessToken, isInitializing, login, logout],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
