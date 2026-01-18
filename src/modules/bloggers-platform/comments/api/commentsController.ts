import { Controller, Get, Param } from '@nestjs/common';
import { CommentViewModel } from '../../posts/api/model/output/commentViewModel';
import { CommentsQueryRepository } from '../infrastructure/comments-queryRepository';

@Controller('comments')
export class CommentsController {
  constructor(private commentsQueryRepository: CommentsQueryRepository) {}

  @Get(':id')
  async getById(@Param('id') id: string): Promise<CommentViewModel> {
    return this.commentsQueryRepository.getByIdOrNotFoundFail(id);
  }
}
