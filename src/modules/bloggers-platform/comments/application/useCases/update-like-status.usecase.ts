import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { LikesOrmEntity } from 'src/modules/bloggers-platform/likes/domain/like.orm-entity';
import { LikeStatus } from 'src/modules/bloggers-platform/likes/types/like-status';
import { UsersRepository } from 'src/modules/user-accounts/infrastructure/users/repositories/users-repository';
import { CommentsOrmEntity } from '../../domain/comment.orm-entity';
import { LikesRepository } from 'src/modules/bloggers-platform/likes/infrastructure/likes-repository';
import { CommentsRepository } from '../../infrastructure/commentsRepository';

@Injectable()
export class UpdateCommentLikeStatusCommand {
  constructor(
    public commentId: string,
    public userId: string,
    public likeStatus: LikeStatus,
  ) {}
}
@CommandHandler(UpdateCommentLikeStatusCommand)
export class UpdateCommentLikeStatusUseCase implements ICommandHandler<UpdateCommentLikeStatusCommand> {
  constructor(
    private usersRepository: UsersRepository,
    private commentsRepository: CommentsRepository,
    private likesRepository: LikesRepository,
  ) {}

  async execute(command: UpdateCommentLikeStatusCommand): Promise<void> {
    await this.usersRepository.findByIdOrThrowValidationError(command.userId);
    const like = await this.likesRepository.findByUserAndParent(
      command.userId,
      command.commentId,
      'Comment',
    );

    const comment: CommentsOrmEntity =
      await this.commentsRepository.findOrNotFoundFail(command.commentId);

    if (!like) {
      const newLike = LikesOrmEntity.createForComment(
        command.userId,
        command.commentId,
        command.likeStatus,
      );

      comment.updateLikeCounter('None', command.likeStatus);

      await this.likesRepository.save(newLike);
      await this.commentsRepository.save(comment);
      return;
    }

    if (like.hasStatus(command.likeStatus)) {
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
