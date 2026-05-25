import { apiRequest } from './client';
import type { Me } from '../types/api';

export type LoginResponse = { accessToken: string };

export const authApi = {
  login(loginOrEmail: string, password: string) {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { loginOrEmail, password },
      skipAuthRedirect: true,
    });
  },

  refresh() {
    return apiRequest<LoginResponse>('/auth/refresh-token', {
      method: 'POST',
      useRefresh: true,
      skipAuthRedirect: true,
    });
  },

  logout() {
    return apiRequest<void>('/auth/logout', { method: 'POST', skipAuthRedirect: true });
  },

  me(token: string) {
    return apiRequest<Me>('/auth/me', { token });
  },

  registration(data: { login: string; password: string; email: string }) {
    return apiRequest<void>('/auth/registration', {
      method: 'POST',
      body: data,
      skipAuthRedirect: true,
    });
  },

  registrationConfirmation(code: string) {
    return apiRequest<void>('/auth/registration-confirmation', {
      method: 'POST',
      body: { code },
      skipAuthRedirect: true,
    });
  },

  registrationEmailResending(email: string) {
    return apiRequest<void>('/auth/registration-email-resending', {
      method: 'POST',
      body: { email },
      skipAuthRedirect: true,
    });
  },

  passwordRecovery(email: string) {
    return apiRequest<void>('/auth/password-recovery', {
      method: 'POST',
      body: { email },
      skipAuthRedirect: true,
    });
  },

  newPassword(recoveryCode: string, newPassword: string) {
    return apiRequest<void>('/auth/new-password', {
      method: 'POST',
      body: { recoveryCode, newPassword },
      skipAuthRedirect: true,
    });
  },
};
