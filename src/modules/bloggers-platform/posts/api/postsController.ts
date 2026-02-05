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
import { CreatePostInputDto } from '../dto/input/createPostInputDto';
import { PostViewModel } from './model/output/postViewModel';
import { UpdatePostInputDto } from '../dto/input/updatePostInputDto';
import { BasicAuthGuard } from 'src/modules/user-accounts/guards/basic/basic-auth.guard';
import { CreatePostCommand } from '../application/useCases/create-post.usecase';
import { UpdatePostCommand } from '../application/useCases/update-post.usecase';
import { DeletePostCommand } from '../application/useCases/delete-post.usecase';
import { JwtAuthGuard } from 'src/modules/user-accounts/guards/jwt/jwt-auth.guard';
import { UpdatePostLikeStatusCommand } from '../application/useCases/update-like-status.usecase';
import { UserContextDto } from 'src/modules/user-accounts/guards/dto/user-context.input.dto';
import { GetCommentsQueryParams } from './query/qet-comments-query-params';
import { CommentViewModel } from './model/output/commentViewModel';
import { UserExtractorInterceptor } from 'src/core/interceptors/user-extractor.inteceptor';
import { CreateCommentInputDto } from 'src/modules/bloggers-platform/posts/api/model/input/create-comment.input.dto';
import { CreateCommentCommand } from 'src/modules/bloggers-platform/comments/application/useCases/create-comment.usecase';
import { GetPostsQueryParams } from 'src/modules/bloggers-platform/posts/api/query/get-posts-query-params';
import { UserIdOptional } from 'src/core/decorators/user-id.optional.decorator';
import { PostsQueryRepository } from 'src/modules/bloggers-platform/posts/infrastructure/postQueryRepository';
import { LikeStatusInputDto } from 'src/modules/bloggers-platform/likes/types/input/like-status.input.dto';

@Controller('posts')
export class PostsController {
  constructor(
    private postQueryRepository: PostsQueryRepository,
    private commandBus: CommandBus,
    private commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Put(':id/like-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateLikeStatus(
    @Param('id') postId: string,
    @Body() body: LikeStatusInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdatePostLikeStatusCommand(postId, user.id, body.likeStatus),
    );
  }
  @Get(':id/comments')
  @UseInterceptors(UserExtractorInterceptor)
  async getCommentsByPostId(
    @Param('id') postId: string,
    @Query() query: GetCommentsQueryParams,
    @UserIdOptional() userId: string,
  ): Promise<PaginatedViewDto<CommentViewModel>> {
    return this.commentsQueryRepository.getCommentByPostId(
      postId,
      query,
      userId,
    );
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Param('id') postId: string,
    @Body() content: CreateCommentInputDto,
    @UserIdOptional() userId: string,
  ): Promise<CommentViewModel> {
    const commentId = await this.commandBus.execute(
      new CreateCommentCommand(postId, userId, content),
    );
    return this.commentsQueryRepository.getByIdOrNotFoundFail(
      commentId,
      userId,
    );
  }

  @Get()
  @UseInterceptors(UserExtractorInterceptor)
  async getAllPosts(
    @Query() query: GetPostsQueryParams,
    @UserIdOptional() userId: string,
  ) {
    return this.postQueryRepository.findAllWithLikes(query, userId);
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createPost(@Body() body: CreatePostInputDto): Promise<PostViewModel> {
    const postId = await this.commandBus.execute(new CreatePostCommand(body));
    return this.postQueryRepository.getCreatedPost(postId);
  }

  @Get(':id')
  @UseInterceptors(UserExtractorInterceptor)
  async getById(
    @Param('id') id: string,
    @UserIdOptional() userId: string,
  ): Promise<PostViewModel> {
    console.log('API CHECK');
    return this.postQueryRepository.getPostById(id, userId);
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
