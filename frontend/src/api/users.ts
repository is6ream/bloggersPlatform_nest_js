import { apiClient } from './client';
import type { User, Paginator, QueryParams } from './types';

export const usersApi = {
  getAll: (params?: QueryParams) =>
    apiClient.get<Paginator<User>>('/users', { params }),

  create: (data: { login: string; password: string; email: string }) =>
    apiClient.post<User>('/users', data),

  delete: (id: string) =>
    apiClient.delete(`/users/${id}`),
};
