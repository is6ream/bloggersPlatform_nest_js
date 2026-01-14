import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../posts/infrastructure/postRepository';
import { UsersRepository } from 'src/modules/user-accounts/infrastructure/users/usersRepository';
import { InjectModel } from '@nestjs/mongoose';
import { Like } from '../domain/like-entity';
import { LikeModelType } from '../domain/like-entity';
import { PostDocument } from '../../posts/domain/postEntity';
import { LikeStatus } from '../types/like-status';
@Injectable()
export class UpdateLikeStatusCommand {
  constructor(
    public postId: string,
    public userId: string,
    public likeStatus: string,
  ) {}
}

@CommandHandler(UpdateLikeStatusCommand)
export class UpdateLikeStatusUseCase implements ICommandHandler {
  constructor(
    @InjectModel(Like.name)
    private LikeModel: LikeModelType,
    private postRepository: PostRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute(command: UpdateLikeStatusCommand): Promise<any> {
    const post = await this.postRepository.findOrNotFoundFail(command.postId);
    const user = await this.usersRepository.findByIdOrThrowValidationError(
      command.userId,
    );
    const like = await this.LikeModel.findOne({
      userId: command.userId,
      parentId: command.postId,
      parentType: 'Post',
    });

    if (!like) {
      this.LikeModel.createInstance({
        likeStatus: command.likeStatus,
        userId: command.userId,
        postId: command.postId,
        parentType: 'Post',
      });
    }
  }
  private async likesForPostCount(
    post: PostDocument,
    oldLikeStatus: LikeStatus,
    newLikeStatus: LikeStatus,
  ) {
    if (oldLikeStatus === 'Like' && newLikeStatus === 'Dislike') {
      post.likesInfo.likesCount--;
      post.likesInfo.dislikesCount++;
      await this.postRepository.save(post);
      return;
    }
    if (oldLikeStatus === 'Like' && newLikeStatus === 'None') {
      post.likesInfo.likesCount--;
      await this.postRepository.save(post);
      return;
    }
    if (oldLikeStatus === 'Dislike' && newLikeStatus === 'Like') {
      post.likesInfo.likesCount++;
      post.likesInfo.dislikesCount--;
      await this.postRepository.save(post);
      return;
    }
    if (oldLikeStatus === 'Dislike' && newLikeStatus === 'None') {
      post.likesInfo.dislikesCount--;
      await this.postRepository.save(post);
      return;
    }
    if (oldLikeStatus === 'None' && newLikeStatus === 'Like') {
      post.likesInfo.likesCount++;
      await this.postRepository.save(post);
      return;
    }
    if (oldLikeStatus === 'None' && newLikeStatus === 'Dislike') {
      post.likesInfo.dislikesCount++;
      await this.postRepository.save(post);
      return;
    }
  }
}
