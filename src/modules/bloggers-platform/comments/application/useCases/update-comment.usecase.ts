import { CommentInputDto } from 'src/modules/bloggers-platform/comments/dto/comment-input.dto';
import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from 'src/modules/bloggers-platform/comments/infrastructure/comments-repository';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';

@Injectable()
export class UpdateCommentCommand {
  constructor(
    public commentId: string,
    public updateContentDto: CommentInputDto,
    public userId?: string,
  ) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase implements ICommandHandler<UpdateCommentCommand> {
  constructor(private commentsRepository: CommentsRepository) {}

  async execute(command: UpdateCommentCommand): Promise<void> {
    const comment = await this.commentsRepository.findOrNotFoundFail(
      command.commentId,
    );

    if (comment.commentatorInfo.userId !== command.userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Forbidden',
      });
    }

    comment.content = command.updateContentDto.content as unknown as string;
    await this.commentsRepository.save(comment);
  }
}
