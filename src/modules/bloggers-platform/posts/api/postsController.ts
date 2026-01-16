import { ExtractUserFromRequest } from './../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { CommandBus } from '@nestjs/cqrs';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
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
  UseGuards,
} from '@nestjs/common';
import { GetPostsQueryParams } from './query/get-posts-query-params';
import { PostPaginatedViewDto } from './paginated/paginated.post.view-dto';
import { CreatePostInputDto } from '../dto/input/createPostInputDto';
import { PostViewModel } from './model/postViewModel';
import { PostQueryRepository } from '../infrastructure/postQueryRepository';
import { UpdatePostInputDto } from '../dto/input/updatePostInputDto';
import { CommentViewModel } from './model/commentViewModel';
import { CommentsQueryRepository } from '../../comments/infrastructure/commentsQueryRepository';
import { GetCommentsQueryParams } from './query/qet-comments-query-params';
import { BasicAuthGuard } from 'src/modules/user-accounts/guards/basic/basic-auth.guard';
import { CreatePostCommand } from '../application/useCases/create-post.usecase';
import { UpdatePostCommand } from '../application/useCases/update-post.usecase';
import { DeletePostCommand } from '../application/useCases/delete-post.usecase';
import { JwtAuthGuard } from 'src/modules/user-accounts/guards/jwt/jwt-auth.guard';
import { UpdateLikeStatusCommand } from '../../likes/application/update-like-status.usecase';
import { UserContextDto } from 'src/modules/user-accounts/guards/dto/user-context.dto';

@Controller('posts')
export class PostsController {
  constructor(
    private postQueryRepository: PostQueryRepository,
    private commentsQueryRepository: CommentsQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Put(':id/like-status')
  @UseGuards(JwtAuthGuard)
  async updateLikeStatus(
    @Param('id') id: string,
    @Body() body: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdateLikeStatusCommand(id, user.id, body),
    );
  }

  @Get(':id/comments')
  async getCommentByPostId(
    @Param('id') postId: string,
    @Query() query: GetCommentsQueryParams,
  ): Promise<PaginatedViewDto<CommentViewModel>> {
    return this.commentsQueryRepository.getCommentByPostId(postId, query);
  }

  @Get()
  async getAll(
    @Query() query: GetPostsQueryParams,
  ): Promise<PostPaginatedViewDto> {
    return this.postQueryRepository.getAll(query);
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createPost(@Body() body: CreatePostInputDto): Promise<PostViewModel> {
    const postId = await this.commandBus.execute(new CreatePostCommand(body));
    return this.postQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<PostViewModel> {
    return this.postQueryRepository.getByIdOrNotFoundFail(id);
  }

  @UseGuards(BasicAuthGuard)
  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('id') id: string,
    @Body() body: UpdatePostInputDto,
  ): Promise<void> {
    return this.commandBus.execute(new UpdatePostCommand(id, body));
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new DeletePostCommand(id));
  }
}
