import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from '../../pages/HomePage/HomePage'
import { LoginPage } from '../../pages/LoginPage/LoginPage'
import { NotFoundPage } from '../../pages/NotFoundPage/NotFoundPage'
import { RequireAuth } from '../../features/auth/ui/RequireAuth'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/home" element={<HomePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
