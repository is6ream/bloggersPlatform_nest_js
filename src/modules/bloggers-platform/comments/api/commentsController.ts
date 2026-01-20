import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { CommentViewModel } from '../../posts/api/model/output/commentViewModel';
import { CommentsQueryRepository } from '../infrastructure/comments-queryRepository';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateLikeStatusCommand } from '../../posts/application/useCases/update-like-status.usecase';
import { JwtAuthGuard } from 'src/modules/user-accounts/guards/jwt/jwt-auth.guard';
import { ExtractUserFromRequest } from 'src/modules/user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from 'src/modules/user-accounts/guards/dto/user-context.input.dto';
import { LikeStatusInputDto } from '../../likes/types/like-status.input.dto';
@Controller('comments')
export class CommentsController {
  constructor(
    private commentsQueryRepository: CommentsQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Put(':id/like-status')
  @UseGuards(JwtAuthGuard)
  async updateLikeStatus(
    @Param('id') commentId: string,
    @Body() body: LikeStatusInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdateLikeStatusCommand(commentId, user.id, body.likeStatus), 
    );
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<CommentViewModel> {
    return this.commentsQueryRepository.getByIdOrNotFoundFail(id);
  }
}
