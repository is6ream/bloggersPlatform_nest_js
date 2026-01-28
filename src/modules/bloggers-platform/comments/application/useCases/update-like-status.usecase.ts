import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import {
  Like,
  LikeDocument,
} from 'src/modules/bloggers-platform/likes/domain/like-entity';
import { UsersRepository } from 'src/modules/user-accounts/infrastructure/users/usersRepository';
import { InjectModel } from '@nestjs/mongoose';
import { LikeModelType } from 'src/modules/bloggers-platform/likes/domain/like-entity';
import { CommentDocument } from '../../domain/commentEntity';
import { CommentsRepository } from '../../infrastructure/comments-repository';
@Injectable()
export class UpdateCommentLikeStatusCommand {
  constructor(
    public commentId: string,
    public userId: string,
    public likeStatus: string,
  ) {}
}
//todo решить задачу с сохранением нового статуса реакции пользователя для комментария
@CommandHandler(UpdateCommentLikeStatusCommand)
export class UpdateCommentLikeStatusUseCase implements ICommandHandler<UpdateCommentLikeStatusCommand> {
  constructor(
    @InjectModel(Like.name)
    private LikeModel: LikeModelType,
    private usersRepository: UsersRepository,
    private commentsRepository: CommentsRepository,
  ) {}

  async execute(command: UpdateCommentLikeStatusCommand): Promise<any> {
    const like = await this.LikeModel.findOne({
      userId: command.userId,
      parentId: command.commentId,
    });

    const comment: CommentDocument =
      await this.commentsRepository.findOrNotFoundFail(command.commentId);

    if (!like) {
      const newLike: LikeDocument = this.LikeModel.createInstance({
        likeStatus: command.likeStatus,
        userId: command.userId,
        parentId: command.commentId,
        parentType: 'Comment', //сохраняется некорректный parentType
      });

      console.log(newLike, 'like check if is not exist');

      comment.updateLikeCounter('None', command.likeStatus);

      await this.commentsRepository.likeStatusSave(newLike);
      await this.commentsRepository.save(comment);
      return;
    }

    if (like.status === command.likeStatus) {
      return;
    }

    let oldLikeStatus = like.status;
    like.status = command.likeStatus;
    like.createdAt = new Date();
    comment.updateLikeCounter(oldLikeStatus, command.likeStatus);
    await this.commentsRepository.likeStatusSave(like);
    await this.commentsRepository.save(comment);
    return;
  }
}
