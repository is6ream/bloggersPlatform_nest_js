import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import { AppLayout } from '../components/layout/AppLayout';
import { BlogPage } from '../pages/BlogPage';
import { BlogsPage } from '../pages/BlogsPage';
import { LoginPage } from '../pages/LoginPage';
import { NewPasswordPage } from '../pages/NewPasswordPage';
import { PasswordRecoveryPage } from '../pages/PasswordRecoveryPage';
import { PostPage } from '../pages/PostPage';
import { ProfilePage } from '../pages/ProfilePage';
import { RegistrationConfirmationPage } from '../pages/RegistrationConfirmationPage';
import { RegistrationEmailResendingPage } from '../pages/RegistrationEmailResendingPage';
import { RegistrationPage } from '../pages/RegistrationPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    ),
    children: [
      { index: true, element: <Navigate to="/blogs" replace /> },
      { path: 'blogs', element: <BlogsPage /> },
      { path: 'blogs/:blogId', element: <BlogPage /> },
      { path: 'posts/:postId', element: <PostPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'registration', element: <RegistrationPage /> },
      { path: 'registration-confirmation', element: <RegistrationConfirmationPage /> },
      { path: 'registration-email-resending', element: <RegistrationEmailResendingPage /> },
      { path: 'password-recovery', element: <PasswordRecoveryPage /> },
      { path: 'new-password', element: <NewPasswordPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
]);
