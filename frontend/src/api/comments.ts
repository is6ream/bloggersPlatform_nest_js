import { apiClient } from './client';
import type { Comment, LikeStatus } from './types';

export const commentsApi = {
  getById: (id: string) =>
    apiClient.get<Comment>(`/comments/${id}`),

  update: (id: string, content: string) =>
    apiClient.put(`/comments/${id}`, { content }),

  delete: (id: string) =>
    apiClient.delete(`/comments/${id}`),

  setLikeStatus: (id: string, likeStatus: LikeStatus) =>
    apiClient.put(`/comments/${id}/like-status`, { likeStatus }),
};
