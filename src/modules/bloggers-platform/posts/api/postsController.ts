import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { GetPostsQueryParams } from './query/get-posts-query-params';
import { PostPaginatedViewDto } from './paginated/paginated.post.view-dto';
import { CreatePostInputDto } from '../dto/input/createPostInputDto';
import { PostViewModel } from './model/postViewModel';
import { PostQueryRepository } from '../infrastructure/postQueryRepository';
import { PostsService } from '../application/posts-service';

@Controller('posts')
export class PostsController {
  constructor(
    private postQueryRepository: PostQueryRepository,
    private postsService: PostsService,
  ) {}

  @Get()
  async getAll(
    @Query() query: GetPostsQueryParams,
  ): Promise<PostPaginatedViewDto> {
    return this.postQueryRepository.getAll(query);
  }

  @Post()
  async createPost(@Body() body: CreatePostInputDto): Promise<PostViewModel> {
    const postId = await this.postsService.createPost(body);

    return this.postQueryRepository.getByIdOrNotFoundFail(postId); //прописать метод findById
  }
}
