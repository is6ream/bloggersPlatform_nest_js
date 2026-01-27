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
import { CreateCommentInputDto } from '../../posts/api/model/input/create-comment.input.dto';
import { CreateCommentCommand } from '../application/useCases/create-comment.usecase';
import { UserExtractorInterceptor } from 'src/core/interceptors/user-extractor.inteceptor';
import { Request } from 'express';
import { UserId } from 'src/core/decorators/user-id.decorator';
@Controller('comments')
export class CommentsController {
  constructor(
    private commentsQueryRepository: CommentsQueryRepository,
    private commandBus: CommandBus,
  ) {}

  //todo передать userId из интерцептора в контроллер
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
