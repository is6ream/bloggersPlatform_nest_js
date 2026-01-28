import { CommentInputDto } from 'src/modules/bloggers-platform/comments/dto/comment-input.dto';
import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { CommentsRepository } from 'src/modules/bloggers-platform/comments/infrastructure/comments-repository';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';
import { Comment } from 'src/modules/bloggers-platform/comments/domain/commentEntity';

@Injectable()
export class UpdateCommentCommand {
  constructor(
    public commentId: string,
    public userId: string,
    public updateContentDto: CommentInputDto,
  ) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase implements ICommandHandler<UpdateCommentCommand> {
  constructor(private commentsRepository: CommentsRepository) {}

  async execute(command: UpdateCommentCommand): Promise<void> {
    const comment = await this.commentsRepository.findOrNotFoundFail(
      command.commentId,
    );
    //не в том формате поступает userID
    console.log(comment.commentatorInfo.userId, 'user id check in comment');
    console.log(command.userId, 'incoming to this command user id');

    if (comment.commentatorInfo.userId !== command.userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Forbidden',
      });
    }

    comment.content = command.updateContentDto as unknown as string;
    await this.commentsRepository.save(comment);
  }
}
