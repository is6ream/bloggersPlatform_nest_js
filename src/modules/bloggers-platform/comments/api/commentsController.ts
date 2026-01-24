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
    @Req() req: Request
  ): Promise<CommentViewModel> {
    // @ts-ignore
    return this.commentsQueryRepository.getByIdOrNotFoundFail(commentId, req.user?.id);
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
