import { Link } from 'react-router-dom'
import { PageLayout } from '../../shared/ui/PageLayout'

export function NotFoundPage() {
  return (
    <PageLayout title="Страница не найдена">
      <Link className="link-button" to="/home">
        На главную
      </Link>
    </PageLayout>
  )
}
