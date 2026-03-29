import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure/postRepository';
import { UsersRepository } from 'src/modules/user-accounts/infrastructure/users/usersRepository';
import { InjectModel } from '@nestjs/mongoose';
import { Like, LikeDocument } from '../../../likes/domain/like-entity';
import { LikeModelType } from '../../../likes/domain/like-entity';
import { LikeStatus } from 'src/modules/bloggers-platform/likes/types/like-status';

@Injectable()
export class UpdatePostLikeStatusCommand {
  constructor(
    public postId: string,
    public userId: string,
    public likeStatus: LikeStatus,
  ) {}
}

@CommandHandler(UpdatePostLikeStatusCommand)
export class UpdateLikeStatusUseCase implements ICommandHandler<UpdatePostLikeStatusCommand> {
  constructor(
    @InjectModel(Like.name)
    private LikeModel: LikeModelType,
    private postRepository: PostRepository,
    private usersRepository: UsersRepository,
  ) {}
  async execute(command: UpdatePostLikeStatusCommand): Promise<void> {
    const post = await this.postRepository.findOrNotFoundFail(command.postId);

    await this.usersRepository.findByIdOrThrowValidationError(command.userId);

    const like = await this.LikeModel.findOne({
      userId: command.userId,
      parentId: command.postId,
    });

    if (!like) {
      const newLike: LikeDocument = this.LikeModel.createInstance({
        status: command.likeStatus,
        userId: command.userId,
        parentId: command.postId,
        parentType: 'Post',
      });
      post.updateLikeCounter('None', command.likeStatus);

      await newLike.save();
      await this.postRepository.save(post);
      return;
    }

    if (like.status === command.likeStatus) {
      return;
    }

    const oldLikeStatus = like.status;
    like.status = command.likeStatus;
    like.createdAt = new Date();
    post.updateLikeCounter(oldLikeStatus, command.likeStatus);
    await like.save();
    await this.postRepository.save(post);
  }
}
