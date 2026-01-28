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
  UseInterceptors,
  Req,
  HttpCode,
} from '@nestjs/common';
import { CommentViewModel } from '../../posts/api/model/output/commentViewModel';
import { CommentsQueryRepository } from '../infrastructure/comments-queryRepository';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from 'src/modules/user-accounts/guards/jwt/jwt-auth.guard';
import { ExtractUserFromRequest } from 'src/modules/user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from 'src/modules/user-accounts/guards/dto/user-context.input.dto';
import { UpdateCommentLikeStatusCommand } from '../application/useCases/update-like-status.usecase';
import { UserExtractorInterceptor } from 'src/core/interceptors/user-extractor.inteceptor';
import { UserId } from 'src/core/decorators/user-id.required.decorator';
import { CommentInputDto } from 'src/modules/bloggers-platform/comments/dto/comment-input.dto';
import { UpdateCommentCommand } from 'src/modules/bloggers-platform/comments/application/useCases/update-comment.usecase';

@Controller('comments')
export class CommentsController {
  constructor(
    private commentsQueryRepository: CommentsQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Get(':id')
  @UseInterceptors(UserExtractorInterceptor)
  async getById(
    @Param('id') commentId: string,
    @UserId() userId?: string,
  ): Promise<CommentViewModel> {
    return this.commentsQueryRepository.getByIdOrNotFoundFail(
      commentId,
      userId,
    );
  }

  @Put('/:id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @Param('id') commentId: string,
    @Body() updateCommentDto: CommentInputDto,
    @ExtractUserFromRequest() userId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdateCommentCommand(commentId, userId, updateCommentDto),
    );
  }

  @Put(':id/like-status')
  @HttpCode(204)
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
