import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../posts/infrastructure/postRepository';
import { UsersRepository } from 'src/modules/user-accounts/infrastructure/users/usersRepository';
import { InjectModel } from '@nestjs/mongoose';
import { Like, LikeDocument } from '../domain/like-entity';
import { LikeModelType } from '../domain/like-entity';
import { Post } from '../../posts/domain/postEntity';
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
    @InjectModel(Post.name)
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
    });
    //доменный метод будем тестировать
    if (!like) {
      const newLike: LikeDocument = this.LikeModel.createInstance({
        likeStatus: command.likeStatus,
        userId: command.userId,
        postId: command.postId,
        parentType: 'Post',
      });
      await this.likesForPostCount(post, 'None', command.likeStatus);
      await this.postRepository.likeStatusSave(newLike);
      return;
    }

    if (like.status === command.likeStatus) {
      return;
    }

    let oldLikeStatus = like.status;
    like.status = command.likeStatus;
    like.createdAt = new Date();
    await this.likesForPostCount(post, oldLikeStatus, command.likeStatus);
    await this.postRepository.likeStatusSave(like);
    return;
  }

  // private async likesForPostCount(
  //   post: PostDocument,
  //   oldLikeStatus: string,
  //   newLikeStatus: string,
  // ) {
  //   if (oldLikeStatus === 'Like' && newLikeStatus === 'Dislike') {
  //     post.extendedLikesInfo.likesCount--;
  //     post.extendedLikesInfo.dislikesCount++;
  //     await this.postRepository.save(post);
  //     return;
  //   }
  //   if (oldLikeStatus === 'Like' && newLikeStatus === 'None') {
  //     post.extendedLikesInfo.likesCount--;
  //     await this.postRepository.save(post);
  //     return;
  //   }
  //   if (oldLikeStatus === 'Dislike' && newLikeStatus === 'Like') {
  //     post.extendedLikesInfo.likesCount++;
  //     post.extendedLikesInfo.dislikesCount--;
  //     await this.postRepository.save(post);
  //     return;
  //   }
  //   if (oldLikeStatus === 'Dislike' && newLikeStatus === 'None') {
  //     post.extendedLikesInfo.dislikesCount--;
  //     await this.postRepository.save(post);
  //     return;
  //   }
  //   if (oldLikeStatus === 'None' && newLikeStatus === 'Like') {
  //     post.extendedLikesInfo.likesCount++;
  //     await this.postRepository.save(post);
  //     return;
  //   }
  //   if (oldLikeStatus === 'None' && newLikeStatus === 'Dislike') {
  //     post.extendedLikesInfo.dislikesCount++;
  //     await this.postRepository.save(post);
  //     return;
  //   }
  // }
}
