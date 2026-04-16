import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogsRawSqlQueryRepository } from '../infrastructure/blogs-raw-sql.query-repository';
import { BlogViewDto } from '../dto/output/blogViewDto';
import { GetBlogsQueryParams } from './query/get-blogs-query-params';
import { BlogPaginatedViewDto } from './paginated/paginated.blog.view-dto';
import { PostsRawSqlQueryRepository } from '../../posts/infrastructure/posts-raw-sql.query-repository';
import { GetPostsQueryParams } from '../../posts/api/query/get-posts-query-params';
import { PaginatedPostsDto } from '../../posts/infrastructure/dto/paginated-post.dto';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsQueryRepository: BlogsRawSqlQueryRepository,
    private readonly postsQueryRepository: PostsRawSqlQueryRepository,
  ) {}

  @Get()
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<BlogPaginatedViewDto> {
    return this.blogsQueryRepository.getAll(query);
  }

  @Get(':blogId/posts')
  async getPostsForSpecificBlog(
    @Param('blogId') blogId: string,
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedPostsDto> {
    return this.postsQueryRepository.getAllPostsForBlog(blogId, query, undefined);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<BlogViewDto> {
    return this.blogsQueryRepository.getByIdOrNotFoundFail(id);
  }
}
