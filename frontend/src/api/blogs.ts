import { apiRequest, buildQueryString } from './client';
import type { Blog, Paginated, PaginationQuery } from '../types/api';

export const blogsApi = {
  getAll(params: PaginationQuery = {}, token?: string | null) {
    return apiRequest<Paginated<Blog>>('/blogs', {
      query: buildQueryString({
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 10,
        sortBy: params.sortBy ?? 'createdAt',
        sortDirection: params.sortDirection ?? 'desc',
        searchNameTerm: params.searchNameTerm,
      }),
      token,
    });
  },

  getById(id: string) {
    return apiRequest<Blog>(`/blogs/${id}`);
  },

  getPosts(blogId: string, params: PaginationQuery = {}, token?: string | null) {
    return apiRequest<Paginated<import('../types/api').Post>>(
      `/blogs/${blogId}/posts`,
      {
        query: buildQueryString({
          pageNumber: params.pageNumber ?? 1,
          pageSize: params.pageSize ?? 10,
          sortBy: params.sortBy ?? 'createdAt',
          sortDirection: params.sortDirection ?? 'desc',
          searchPostNameTerm: params.searchPostNameTerm,
        }),
        token,
      },
    );
  },
};
