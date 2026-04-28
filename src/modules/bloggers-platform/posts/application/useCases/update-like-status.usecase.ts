import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure/postRepository';
import { UsersRepository } from 'src/modules/user-accounts/infrastructure/users/repositories/users-repository';
import { LikeStatus } from 'src/modules/bloggers-platform/likes/types/like-status';
import { LikesRepository } from 'src/modules/bloggers-platform/likes/infrastructure/likes-repository';
import { LikeSqlEntity } from 'src/modules/bloggers-platform/likes/domain/like-entity';

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
    private postRepository: PostRepository,
    private usersRepository: UsersRepository,
    private likesRepository: LikesRepository,
  ) {}
  async execute(command: UpdatePostLikeStatusCommand): Promise<void> {
    const post = await this.postRepository.findOrNotFoundFail(command.postId);

    await this.usersRepository.findByIdOrThrowValidationError(command.userId);

    const like = await this.likesRepository.findByUserAndParent(
      command.userId,
      command.postId,
      'Post',
    );

    if (!like) {
      const newLike = LikeSqlEntity.createForInsert({
        status: command.likeStatus,
        userId: command.userId,
        parentId: command.postId,
        parentType: 'Post',
      });
      post.updateLikeCounter('None', command.likeStatus);

      await this.likesRepository.save(newLike);
      await this.postRepository.save(post);
      return;
    }

    if (like.status === command.likeStatus) {
      return;
    }

    const oldLikeStatus = like.status;
    like.updateStatus(command.likeStatus);
    post.updateLikeCounter(oldLikeStatus, command.likeStatus);
    await this.likesRepository.save(like);
    await this.postRepository.save(post);
  }
}
