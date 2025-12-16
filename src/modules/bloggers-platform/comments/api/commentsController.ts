import { Controller, Get, Param } from '@nestjs/common';
import { CommentViewModel } from '../../posts/api/model/commentViewModel';
import { CommentsQueryRepository } from '../infrastructure/commentsQueryRepository';

@Controller('comments')
export class CommentsController {
  constructor(private commentsQueryRepository: CommentsQueryRepository) {}

  @Get(':id')
  async getById(@Param('id') id: string): Promise<CommentViewModel> {
    return this.commentsQueryRepository.getByIdOrNotFoundFail(id);
  }
}
