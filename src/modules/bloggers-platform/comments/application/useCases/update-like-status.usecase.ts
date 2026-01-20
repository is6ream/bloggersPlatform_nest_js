import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { Like, LikeDocument } from 'src/modules/bloggers-platform/likes/domain/like-entity';
import { UsersRepository } from 'src/modules/user-accounts/infrastructure/users/usersRepository';
import { InjectModel } from '@nestjs/mongoose';
import { LikeModelType } from 'src/modules/bloggers-platform/likes/domain/like-entity';
import { CommentDocument } from '../../domain/commentEntity';
import { CommentsRepository } from '../../infrastructure/comments-repository';
@Injectable()
export class UpdateLikeStatusCommand {
  constructor(
    public commentId: string,
    public userId: string,
    public likeStatus: string,
  ) {}
}

@CommandHandler(UpdateLikeStatusCommand)
export class UpdateLikeStatusUseCase implements ICommandHandler<UpdateLikeStatusCommand> {
  constructor(
    @InjectModel(Like.name)
    private LikeModel: LikeModelType,
    private usersRepository: UsersRepository,
    private commentsRepository: CommentsRepository,
  ) {}

  async execute(command: UpdateLikeStatusCommand): Promise<any> {
    let comment: CommentDocument =
      await this.commentsRepository.findOrNotFoundFail(command.commentId);
    const user = await this.usersRepository.findByIdOrThrowValidationError(
      command.userId,
    );

    const like = await this.LikeModel.findOne({
      userId: command.userId,
      parentId: command.commentId,
    });

    if (!like) {
      const newLike: LikeDocument = this.LikeModel.createInstance({
        likeStatus: command.likeStatus,
        userId: command.userId,
        parentId: command.commentId,
        parentType: 'Comment',
      });
      comment.updateLikeCounter('None', command.likeStatus);
  }
}
