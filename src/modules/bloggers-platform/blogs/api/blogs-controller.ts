import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { BlogsService } from '../application/blogs-service';
import { CreateBlogInputDto } from '../dto/input/createBlogInputDto';
import { BlogViewModel } from './model/blogViewModel';
import { BlogsQueryRepository } from '../infrastructure/blogsQueryRepository';
import { GetBlogsQueryParams } from './query/get-blogs-query-params';

import { BlogPaginatedViewDto } from './paginated/paginated.blog.view-dto';
import { UpdateBlogDto } from '../dto/input/updateBlogDto';
import { PostPaginatedViewDto } from '../../posts/api/paginated/paginated.post.view-dto';
import { PostQueryRepository } from '../../posts/infrastructure/postQueryRepository';
import { GetPostsQueryParams } from '../../posts/api/query/get-posts-query-params';
import { CreatePostInputDto } from '../../posts/dto/input/createPostInputDto';
import { PostViewModel } from '../../posts/api/model/postViewModel';
import { PostsService } from '../../posts/application/posts-service';

@Controller('blogs')
export class BlogsController {
  constructor(
    private blogsService: BlogsService,
    private postsService: PostsService,
    private blogsQueryRepository: BlogsQueryRepository,
    private postsQueryRepository: PostQueryRepository,
  ) {}

  @Get()
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<BlogPaginatedViewDto> {
    return this.blogsQueryRepository.getAll(query);
  }

  @Get(':id/posts')
  async getAllPostsForBlog(
    @Param('id') id: string,
    @Query() query: GetPostsQueryParams,
  ): Promise<PostPaginatedViewDto> {
    return this.postsQueryRepository.getAllPostsForBlog(id, query);
  }

  @Post(':id/posts')
  async createPostForSpecificBlog(
    @Param('id') id: string,
    @Body() body: CreatePostInputDto,
  ): Promise<PostViewModel> {
    return this.postsService.
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

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id') id: string,
    @Body() body: UpdateBlogDto,
  ): Promise<void> {
    return this.blogsService.updateBlog(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: string): Promise<void> {
    return this.blogsService.deleteBlog(id);
  }
}
