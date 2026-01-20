import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { Like } from 'src/modules/bloggers-platform/likes/domain/like-entity';
import { UsersRepository } from 'src/modules/user-accounts/infrastructure/users/usersRepository';
import { InjectModel } from '@nestjs/mongoose';
import { LikeModelType } from 'src/modules/bloggers-platform/likes/domain/like-entity';
import { CommentDocument } from '../../domain/commentEntity';
import { CommentsRepository } from '../../infrastructure/comments-repository';
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
    private usersRepository: UsersRepository,
    private commentsRepository: CommentsRepository,
  ) {}

  async execute(command: UpdateLikeStatusCommand): Promise<any> {
    let comment: CommentDocument = await this.commentsRepository.findOrNotFoundFail(
        
    );
  }
}
