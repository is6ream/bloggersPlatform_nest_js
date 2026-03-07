import { apiClient } from './client';
import type { MeResponse } from './types';

export const authApi = {
  login: (loginOrEmail: string, password: string) =>
    apiClient.post<{ accessToken: string }>('/auth/login', { loginOrEmail, password }),

  logout: () => apiClient.post('/auth/logout'),

  register: (login: string, password: string, email: string) =>
    apiClient.post('/auth/registration', { login, password, email }),

  confirmRegistration: (code: string) =>
    apiClient.post('/auth/registration-confirmation', { code }),

  resendConfirmation: (email: string) =>
    apiClient.post('/auth/registration-email-resending', { email }),

  passwordRecovery: (email: string) =>
    apiClient.post('/auth/password-recovery', { email }),

  newPassword: (newPassword: string, recoveryCode: string) =>
    apiClient.post('/auth/new-password', { newPassword, recoveryCode }),

  me: () => apiClient.get<MeResponse>('/auth/me'),
};
