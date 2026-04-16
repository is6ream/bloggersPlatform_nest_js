import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogsRawSqlQueryRepository } from '../infrastructure/blogs-raw-sql.query-repository';
import { BlogViewDto } from '../dto/output/blogViewDto';
import { GetBlogsQueryParams } from './query/get-blogs-query-params';
import { BlogPaginatedViewDto } from './paginated/paginated.blog.view-dto';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsQueryRepository: BlogsRawSqlQueryRepository) {}

  @Get()
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<BlogPaginatedViewDto> {
    return this.blogsQueryRepository.getAll(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<BlogViewDto> {
    return this.blogsQueryRepository.getByIdOrNotFoundFail(id);
  }
}
