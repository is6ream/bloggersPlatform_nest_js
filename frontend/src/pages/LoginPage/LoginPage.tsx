import { Navigate } from 'react-router-dom'
import { LoginForm } from '../../features/auth/ui/LoginForm'
import { useAuth } from '../../features/auth/model/AuthContext'
import { PageLayout } from '../../shared/ui/PageLayout'

export function LoginPage() {
  const { isAuthenticated, isInitializing } = useAuth()

  if (!isInitializing && isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  return (
    <PageLayout
      title="Авторизация"
      description="Войди в аккаунт, чтобы получить доступ к защищенным разделам."
    >
      <LoginForm />
    </PageLayout>
  )
}
