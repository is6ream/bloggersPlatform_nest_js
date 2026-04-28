import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { LikeSqlEntity } from 'src/modules/bloggers-platform/likes/domain/like-entity';
import { UsersRepository } from 'src/modules/user-accounts/infrastructure/users/repositories/users-repository';
import { CommentSqlEntity } from '../../domain/commentEntity';
import { CommentsRepository } from '../../infrastructure/comments-repository';
import { LikesRepository } from 'src/modules/bloggers-platform/likes/infrastructure/likes-repository';
@Injectable()
export class UpdateCommentLikeStatusCommand {
  constructor(
    public commentId: string,
    public userId: string,
    public likeStatus: string,
  ) {}
}
@CommandHandler(UpdateCommentLikeStatusCommand)
export class UpdateCommentLikeStatusUseCase implements ICommandHandler<UpdateCommentLikeStatusCommand> {
  constructor(
    private usersRepository: UsersRepository,
    private commentsRepository: CommentsRepository,
    private likesRepository: LikesRepository,
  ) {}

  async execute(command: UpdateCommentLikeStatusCommand): Promise<any> {
    await this.usersRepository.findByIdOrThrowValidationError(command.userId);
    const like = await this.likesRepository.findByUserAndParent(
      command.userId,
      command.commentId,
      'Comment',
    );

    const comment: CommentSqlEntity =
      await this.commentsRepository.findOrNotFoundFail(command.commentId);

    if (!like) {
      const newLike = LikeSqlEntity.createForInsert({
        status: command.likeStatus,
        userId: command.userId,
        parentId: command.commentId,
        parentType: 'Comment',
      });

      comment.updateLikeCounter('None', command.likeStatus);

      await this.likesRepository.save(newLike);
      await this.commentsRepository.save(comment);
      return;
    }

    if (like.status === command.likeStatus) {
      return;
    }

    const oldLikeStatus = like.status;
    like.updateStatus(command.likeStatus);
    comment.updateLikeCounter(oldLikeStatus, command.likeStatus);
    await this.likesRepository.save(like);
    await this.commentsRepository.save(comment);
    return;
  }
}
