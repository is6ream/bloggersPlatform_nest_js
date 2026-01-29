import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from 'src/modules/bloggers-platform/comments/infrastructure/comments-repository';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';

@Injectable()
export class DeleteCommentCommand {
  constructor(
    public commentId: string,
    public userId: string,
  ) {}
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentUseCase implements ICommandHandler<DeleteCommentCommand> {
  constructor(private commentRepository: CommentsRepository) {}

  async execute(command: DeleteCommentCommand): Promise<void> {
    const comment = await this.commentRepository.findOrNotFoundFail(
      command.commentId,
    );
    console.log(command.userId, 'userId check in use case');
    if (comment.commentatorInfo.userId !== command.userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Forbidden',
      });
    }

    comment.makeDeleted();
    await this.commentRepository.save(comment);
  }
}
