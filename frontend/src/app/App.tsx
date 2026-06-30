import { AppRouter } from './router/AppRouter'
import { AuthProvider } from '../features/auth/model/AuthContext'

export function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
