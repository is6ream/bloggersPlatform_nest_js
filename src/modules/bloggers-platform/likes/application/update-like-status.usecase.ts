import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../posts/infrastructure/postRepository';
import { UsersRepository } from 'src/modules/user-accounts/infrastructure/users/usersRepository';
import { InjectModel } from '@nestjs/mongoose';
import { Like, LikeDocument } from '../domain/like-entity';
import { LikeModelType } from '../domain/like-entity';
import { PostDocument } from '../../posts/domain/postEntity';
@Injectable()
export class UpdateLikeStatusCommand {
  constructor(
    public postId: string,
    public userId: string,
    public likeStatus: string,
  ) {}
}

@CommandHandler(UpdateLikeStatusCommand)
export class UpdateLikeStatusUseCase implements ICommandHandler<UpdateLikeStatusCommand> {
  constructor(
    @InjectModel(Like.name)
    private LikeModel: LikeModelType,
    private postRepository: PostRepository,
    private usersRepository: UsersRepository,
  ) {}
  async execute(command: UpdateLikeStatusCommand): Promise<any> {
    let post: PostDocument = await this.postRepository.findOrNotFoundFail(
      command.postId,
    );
    const user = await this.usersRepository.findByIdOrThrowValidationError(
      command.userId,
    );

    const like = await this.LikeModel.findOne({
      userId: command.userId,
      parentId: command.postId,
    });

    if (!like) {
      const newLike: LikeDocument = this.LikeModel.createInstance({
        likeStatus: command.likeStatus,
        userId: command.userId,
        postId: command.postId,
        parentType: 'Post',
      });
      post.updateLikeCounter('None', command.likeStatus);

      await this.postRepository.likeStatusSave(newLike); //некорретно сохраняется likeEntity
      await this.postRepository.save(post); //нет полей extendedLikeInfo в postEntity после обновления
      return;
    }

    if (like.status === command.likeStatus) {
      return;
    }

    let oldLikeStatus = like.status;
    like.status = command.likeStatus;
    like.createdAt = new Date();
    post.updateLikeCounter(oldLikeStatus, command.likeStatus);
    await this.postRepository.likeStatusSave(like);
    await this.postRepository.save(post);
    return;
  }
}
