import { BlogViewDto } from '../dto/output/blogViewDto';
import { GetBlogsQueryParams } from '../api/query/get-blogs-query-params';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
export abstract class BlogsQueryRepository {
  abstract getByIdOrNotFoundFail(id: string): Promise<BlogViewDto>;
  abstract getAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto>>;
}
