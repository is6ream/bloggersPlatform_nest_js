import { apiClient } from './client';
import type { Blog, Post, Paginator, QueryParams } from './types';

export const blogsApi = {
  getAll: (params?: QueryParams) =>
    apiClient.get<Paginator<Blog>>('/blogs', { params }),

  getById: (id: string) =>
    apiClient.get<Blog>(`/blogs/${id}`),

  create: (data: { name: string; description: string; websiteUrl: string }) =>
    apiClient.post<Blog>('/blogs', data),

  update: (id: string, data: { name: string; description: string; websiteUrl: string }) =>
    apiClient.put(`/blogs/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/blogs/${id}`),

  getPosts: (blogId: string, params?: QueryParams) =>
    apiClient.get<Paginator<Post>>(`/blogs/${blogId}/posts`, { params }),

  createPost: (
    blogId: string,
    data: { title: string; shortDescription: string; content: string },
  ) => apiClient.post<Post>(`/blogs/${blogId}/posts`, data),
};
