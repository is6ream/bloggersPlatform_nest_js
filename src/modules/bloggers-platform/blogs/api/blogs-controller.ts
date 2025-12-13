import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BlogsService } from '../application/blogs-service';
import { CreateBlogInputDto } from '../dto/input/createBlogInputDto';
import { BlogViewModel } from './model/blogViewModel';
import { BlogsQueryRepository } from '../infrastructure/blogsQueryRepository';
import { GetBlogsQueryParams } from './query/get-blogs-query-params';

import { BlogPaginatedViewDto } from './paginated/paginated.blog.view-dto';
@Controller('blogs')
export class BlogsController {
  constructor(
    private blogsService: BlogsService,
    private blogsQueryRepository: BlogsQueryRepository,
  ) {}

  @Get()
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<BlogPaginatedViewDto> {
    return this.blogsQueryRepository.getAll(query);
  }

  @Post()
  async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogViewModel> {
    const blogId = await this.blogsService.createBlog(body);

    return this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<BlogViewModel> {
    return this.blogsQueryRepository.getByIdOrNotFoundFail(id);
  }
}
