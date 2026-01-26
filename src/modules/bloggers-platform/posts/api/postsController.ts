import { CommentsQueryRepository } from './../../comments/infrastructure/comments-queryRepository';
import { ExtractUserFromRequest } from './../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { CommandBus } from '@nestjs/cqrs';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Req,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Delete,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GetPostsQueryParams } from './query/get-posts-query-params';
import { PostPaginatedViewDto } from './paginated/paginated.post.view-dto';
import { CreatePostInputDto } from '../dto/input/createPostInputDto';
import { PostViewModel } from './model/output/postViewModel';
import { PostQueryRepository } from '../infrastructure/postQueryRepository';
import { UpdatePostInputDto } from '../dto/input/updatePostInputDto';
import { BasicAuthGuard } from 'src/modules/user-accounts/guards/basic/basic-auth.guard';
import { CreatePostCommand } from '../application/useCases/create-post.usecase';
import { UpdatePostCommand } from '../application/useCases/update-post.usecase';
import { DeletePostCommand } from '../application/useCases/delete-post.usecase';
import { JwtAuthGuard } from 'src/modules/user-accounts/guards/jwt/jwt-auth.guard';
import { UpdatePostLikeStatusCommand } from '../application/useCases/update-like-status.usecase';
import { UserContextDto } from 'src/modules/user-accounts/guards/dto/user-context.input.dto';
import { LikeStatus } from '../../likes/types/like-status';
import { GetCommentsQueryParams } from './query/qet-comments-query-params';
import { CommentViewModel } from './model/output/commentViewModel';
import { UserExtractorInterceptor } from 'src/core/interceptors/user-extractor.inteceptor';
import { Request } from 'express';
import { LikeStatusInputDto } from 'src/modules/bloggers-platform/likes/types/input/like-status.input.dto';
import { UpdateCommentLikeStatusCommand } from 'src/modules/bloggers-platform/comments/application/useCases/update-like-status.usecase';
import { CreateCommentInputDto } from 'src/modules/bloggers-platform/posts/api/model/input/create-comment.input.dto';
import { CreateCommentCommand } from 'src/modules/bloggers-platform/comments/application/useCases/create-comment.usecase';

@Controller('posts')
export class PostsController {
  constructor(
    private postQueryRepository: PostQueryRepository,
    private commandBus: CommandBus,
    private commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Put(':id/like-status')
  @UseGuards(JwtAuthGuard)
  async updateLikeStatus(
    @Param('id') postId: string,
    @Body() body: LikeStatus,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdatePostLikeStatusCommand(postId, user.id, body),
    );
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

  @Get(':id/comments')
  @UseInterceptors(UserExtractorInterceptor)
  async getCommentByPostId(
    @Param('id') postId: string,
    @Query() query: GetCommentsQueryParams,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<PaginatedViewDto<CommentViewModel>> {
    return this.commentsQueryRepository.getCommentByPostId(
      postId,
      query,
      user.id,
    );
  }
  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Param('id') postId: string,
    @Body() content: CreateCommentInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<CommentViewModel> {
    console.log('comment create API check');
    const commentId = await this.commandBus.execute(
      new CreateCommentCommand(postId, user, content),
    );
    return this.commentsQueryRepository.getByIdOrNotFoundFail(
      commentId,
      user.id,
    );
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
