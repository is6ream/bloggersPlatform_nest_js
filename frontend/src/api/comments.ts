import { apiRequest, buildQueryString } from './client';
import type { Comment, LikeStatus, Paginated, PaginationQuery } from '../types/api';

export const commentsApi = {
  getByPostId(postId: string, params: PaginationQuery = {}, token?: string | null) {
    return apiRequest<Paginated<Comment>>(`/posts/${postId}/comments`, {
      query: buildQueryString({
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 10,
        sortBy: params.sortBy ?? 'createdAt',
        sortDirection: params.sortDirection ?? 'desc',
      }),
      token,
    });
  },

  create(postId: string, content: string, token: string) {
    return apiRequest<Comment>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: { content },
      token,
    });
  },

  update(commentId: string, content: string, token: string) {
    return apiRequest<void>(`/comments/${commentId}`, {
      method: 'PUT',
      body: { content },
      token,
    });
  },

  remove(commentId: string, token: string) {
    return apiRequest<void>(`/comments/${commentId}`, {
      method: 'DELETE',
      token,
    });
  },

  updateLikeStatus(commentId: string, likeStatus: LikeStatus, token: string) {
    return apiRequest<void>(`/comments/${commentId}/like-status`, {
      method: 'PUT',
      body: { likeStatus },
      token,
    });
  },
};
