import { apiClient } from './client';
import type { Post, Comment, Paginator, QueryParams, LikeStatus } from './types';

export const postsApi = {
  getAll: (params?: QueryParams) =>
    apiClient.get<Paginator<Post>>('/posts', { params }),

  getById: (id: string) =>
    apiClient.get<Post>(`/posts/${id}`),

  create: (data: {
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
  }) => apiClient.post<Post>('/posts', data),

  update: (
    id: string,
    data: { title: string; shortDescription: string; content: string; blogId: string },
  ) => apiClient.put(`/posts/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/posts/${id}`),

  getComments: (postId: string, params?: QueryParams) =>
    apiClient.get<Paginator<Comment>>(`/posts/${postId}/comments`, { params }),

  addComment: (postId: string, content: string) =>
    apiClient.post<Comment>(`/posts/${postId}/comments`, { content }),

  setLikeStatus: (postId: string, likeStatus: LikeStatus) =>
    apiClient.put(`/posts/${postId}/like-status`, { likeStatus }),
};
