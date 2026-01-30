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
import { LikeStatus } from '../../likes/types/like-status';
import { GetCommentsQueryParams } from './query/qet-comments-query-params';
import { CommentViewModel } from './model/output/commentViewModel';
import { UserExtractorInterceptor } from 'src/core/interceptors/user-extractor.inteceptor';
import { CreateCommentInputDto } from 'src/modules/bloggers-platform/posts/api/model/input/create-comment.input.dto';
import { CreateCommentCommand } from 'src/modules/bloggers-platform/comments/application/useCases/create-comment.usecase';
import { GetPostsQueryParams } from 'src/modules/bloggers-platform/posts/api/query/get-posts-query-params';
import { UserIdOptional } from 'src/core/decorators/user-id.optional.decorator';
import { PostQueryDto } from 'src/modules/bloggers-platform/posts/infrastructure/dto/post-query.dto';
import { PostsQueryRepository } from 'src/modules/bloggers-platform/posts/infrastructure/postQueryRepository';

@Controller('posts')
export class PostsController {
  constructor(
    private postQueryRepository: PostsQueryRepository,
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
    const commentId = await this.commandBus.execute(
      new CreateCommentCommand(postId, user, content),
    );
    return this.commentsQueryRepository.getByIdOrNotFoundFail(
      commentId,
      user.id,
    );
  }

  @Get()
  @UseInterceptors(UserExtractorInterceptor)
  async getAllPosts(
    @Query() query: GetPostsQueryParams,
    @UserIdOptional() userId: string,
  ) {
    return this.postQueryRepository.findAllWithLikes(query);
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createPost(@Body() body: CreatePostInputDto): Promise<PostViewModel> {
    const postId = await this.commandBus.execute(new CreatePostCommand(body));
    //@ts-ignore

    return this.postQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<PostViewModel> {
    //@ts-ignore

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
