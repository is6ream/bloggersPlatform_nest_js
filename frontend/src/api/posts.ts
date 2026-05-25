import { apiRequest, buildQueryString } from './client';
import type { LikeStatus, Paginated, PaginationQuery, Post } from '../types/api';

export const postsApi = {
  getById(id: string, token?: string | null) {
    return apiRequest<Post>(`/posts/${id}`, { token });
  },

  getAll(params: PaginationQuery = {}, token?: string | null) {
    return apiRequest<Paginated<Post>>('/posts', {
      query: buildQueryString({
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 10,
        sortBy: params.sortBy ?? 'createdAt',
        sortDirection: params.sortDirection ?? 'desc',
        searchPostNameTerm: params.searchPostNameTerm,
      }),
      token,
    });
  },

  updateLikeStatus(postId: string, likeStatus: LikeStatus, token: string) {
    return apiRequest<void>(`/posts/${postId}/like-status`, {
      method: 'PUT',
      body: { likeStatus },
      token,
    });
  },
};
