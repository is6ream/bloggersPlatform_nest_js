import { PostItem } from 'src/modules/bloggers-platform/posts/types/post-item';

export interface PaginatedPostsDto {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: PostItem[];
}
