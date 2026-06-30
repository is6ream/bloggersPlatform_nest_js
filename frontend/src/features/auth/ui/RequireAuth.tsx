import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../model/AuthContext'

export function RequireAuth() {
  const { isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) {
    return <p>Проверяем сессию...</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
