import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/model/AuthContext'
import { PageLayout } from '../../shared/ui/PageLayout'
import { env } from '../../shared/config/env'

export function HomePage() {
  const { user, logout } = useAuth()

  return (
    <PageLayout
      title="Личный кабинет"
      description="Авторизация работает. Сессия восстановится автоматически через refresh-token cookie."
    >
      <div className="meta">
        <span>Пользователь</span>
        <code>{user?.login ?? 'unknown'}</code>
      </div>
      <div className="meta">
        <span>Email</span>
        <code>{user?.email ?? 'unknown'}</code>
      </div>
      <div className="meta">
        <span>API Base URL</span>
        <code>{env.apiBaseUrl}</code>
      </div>
      <div className="meta">
        <span>API Prefix</span>
        <code>{env.apiPrefix}</code>
      </div>
      <div className="actions-row">
        <button className="primary-button" onClick={() => void logout()} type="button">
          Выйти
        </button>
        <Link className="link-button" to="/login">
          Перейти к логину
        </Link>
      </div>
    </PageLayout>
  )
}
