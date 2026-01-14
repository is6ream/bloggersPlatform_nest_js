import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../posts/infrastructure/postRepository';
import { UsersRepository } from 'src/modules/user-accounts/infrastructure/users/usersRepository';
import { InjectModel } from '@nestjs/mongoose';
import { Like } from '../domain/like-entity';
import { LikeModelType } from '../domain/like-entity';
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
    const user = await this.usersRepository.findByIdOrThrowValidationError(command.userId);
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
      //todo - прописать условия при отсуствии статуса у пользователя


    }
  }
}
