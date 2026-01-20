import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { CommentViewModel } from '../../posts/api/model/output/commentViewModel';
import { CommentsQueryRepository } from '../infrastructure/comments-queryRepository';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateLikeStatusCommand } from '../../posts/application/useCases/update-like-status.usecase';
@Controller('comments')
export class CommentsController {
  constructor(
    private commentsQueryRepository: CommentsQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Put(':id/like-status')
  async updateLikeStatus(
    @Param('id') id: string,
    @Body() body: string,
  ): Promise<void> {
    return this.commandBus.execute(new UpdateLikeStatusCommand(id, body));
  }
  @Get(':id')
  async getById(@Param('id') id: string): Promise<CommentViewModel> {
    return this.commentsQueryRepository.getByIdOrNotFoundFail(id);
  }
}
