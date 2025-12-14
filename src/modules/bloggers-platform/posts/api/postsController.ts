import { Controller, Get, Post, Query } from '@nestjs/common';
import { GetPostsQueryParams } from './query/get-posts-query-params';
import { PostPaginatedViewDto } from './paginated/paginated.post.view-dto';
import { CreatePostInputDto } from '../dto/input/createPostInputDto';

@Controller('posts')
export class PostsController {
  constructor(
    private postQueryRepository: 
  ){}

  @Get()
  async getAll(
    @Query() query: GetPostsQueryParams,
  ): Promise<PostPaginatedViewDto> {
    return this.postQueryRepository.getAll(query)
  }

  @Post()
  async createPost(@Body() body: CreatePostInputDto): Promise<>
}
