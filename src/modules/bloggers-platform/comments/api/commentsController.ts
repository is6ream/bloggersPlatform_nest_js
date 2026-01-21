import { LikeStatusInputDto } from './../../likes/types/input/like-status.input.dto';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommentViewModel } from '../../posts/api/model/output/commentViewModel';
import { CommentsQueryRepository } from '../infrastructure/comments-queryRepository';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from 'src/modules/user-accounts/guards/jwt/jwt-auth.guard';
import { ExtractUserFromRequest } from 'src/modules/user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from 'src/modules/user-accounts/guards/dto/user-context.input.dto';
import { UpdateCommentLikeStatusCommand } from '../application/useCases/update-like-status.usecase';
import { CreateCommentInputDto } from '../../posts/api/model/input/create-comment.input.dto';
import { CreateCommentCommand } from '../application/useCases/create-comment.usecase';
import { GetCommentsQueryParams } from '../../posts/api/query/qet-comments-query-params';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';

@Controller('comments')
export class CommentsController {
  constructor(
    private commentsQueryRepository: CommentsQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Get(':id')
  async getById(@Param('id') id: string): Promise<CommentViewModel> {
    return this.commentsQueryRepository.getByIdOrNotFoundFail(id);
  }

  @Get(':id/comments')
  async getCommentByPostId(
    @Param('id') postId: string,
    @Query() query: GetCommentsQueryParams,
  ): Promise<PaginatedViewDto<CommentViewModel>> {
    return this.commentsQueryRepository.getCommentByPostId(postId, query);
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
    return this.commentsQueryRepository.getByIdOrNotFoundFail(commentId);
  }

  @Put(':id/like-status')
  @UseGuards(JwtAuthGuard)
  async updateLikeStatus(
    @Param('id') commentId: string,
    @Body() body: LikeStatusInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdateCommentLikeStatusCommand(commentId, user.id, body.likeStatus),
    );
  }
}
