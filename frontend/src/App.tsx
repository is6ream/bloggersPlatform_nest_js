import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ConfirmEmailPage } from './pages/auth/ConfirmEmailPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { NewPasswordPage } from './pages/auth/NewPasswordPage';
import { BlogsPage } from './pages/BlogsPage';
import { BlogDetailPage } from './pages/BlogDetailPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { AdminPage } from './pages/admin/AdminPage';
import { AdminBlogsPage } from './pages/admin/AdminBlogsPage';
import { AdminPostsPage } from './pages/admin/AdminPostsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { SecurityDevicesPage } from './pages/SecurityDevicesPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/new-password" element={<NewPasswordPage />} />

        <Route
          path="/"
          element={
            <Layout>
              <Navigate to="/blogs" replace />
            </Layout>
          }
        />

        <Route path="/blogs" element={<Layout><BlogsPage /></Layout>} />
        <Route path="/blogs/:id" element={<Layout><BlogDetailPage /></Layout>} />
        <Route path="/posts/:id" element={<Layout><PostDetailPage /></Layout>} />
        <Route path="/security/devices" element={<Layout><SecurityDevicesPage /></Layout>} />

        <Route path="/admin" element={<Layout><AdminPage /></Layout>}>
          <Route index element={<Navigate to="/admin/blogs" replace />} />
          <Route path="blogs" element={<AdminBlogsPage />} />
          <Route path="posts" element={<AdminPostsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/blogs" replace />} />
      </Routes>
    </AuthProvider>
  );
}
