import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { GetPostsQueryParams } from './query/get-posts-query-params';
import { PostPaginatedViewDto } from './paginated/paginated.post.view-dto';
import { CreatePostInputDto } from '../dto/input/createPostInputDto';
import { PostViewModel } from './model/postViewModel';
import { PostQueryRepository } from '../infrastructure/postQueryRepository';
import { PostsService } from '../application/posts-service';
import { UpdatePostInputDto } from '../dto/input/updatePostInputDto';
import { CommentViewModel } from './model/commentViewModel';

@Controller('posts')
export class PostsController {
  constructor(
    private postQueryRepository: PostQueryRepository,
    private postsService: PostsService,
  ) {}

  @Get(':id')
  async getCommentByPostId(
    @Param('id') postId: string,
  ): Promise<CommentViewModel> {
    
  }

  @Get()
  async getAll(
    @Query() query: GetPostsQueryParams,
  ): Promise<PostPaginatedViewDto> {
    return this.postQueryRepository.getAll(query);
  }

  @Post()
  async createPost(@Body() body: CreatePostInputDto): Promise<PostViewModel> {
    const postId = await this.postsService.createPost(body);

    return this.postQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<PostViewModel> {
    return this.postQueryRepository.getByIdOrNotFoundFail(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('id') id: string,
    @Body() body: UpdatePostInputDto,
  ): Promise<void> {
    return this.postsService.updatePost(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: string): Promise<void> {
    return this.postsService.deletePost(id);
  }
}
