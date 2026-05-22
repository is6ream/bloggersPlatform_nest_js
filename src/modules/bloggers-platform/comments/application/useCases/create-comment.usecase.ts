import { Injectable } from '@nestjs/common';
import { CreateCommentInputDto } from 'src/modules/bloggers-platform/posts/api/model/input/create-comment.input.dto';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from 'src/modules/bloggers-platform/posts/infrastructure/postsRepository';
import { UsersRepository } from 'src/modules/user-accounts/infrastructure/users/repositories/users-repository';
import { CommentsRepository } from '../../infrastructure/commentsRepository';
import { CommentsOrmEntity } from '../../domain/comment.orm-entity';

@Injectable()
export class CreateCommentCommand {
  constructor(
    public postId: string,
    public userId: string,
    public content: CreateCommentInputDto,
  ) { }
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase implements ICommandHandler<CreateCommentCommand> {
  constructor(
    private postRepository: PostsRepository,
    private commentsRepository: CommentsRepository,
    private usersRepository: UsersRepository,
  ) { }


  async execute(command: CreateCommentCommand): Promise<string> {
    await this.postRepository.findOrNotFoundFail(command.postId);
    const user = await this.usersRepository.findByIdOrThrowValidationError(
      command.userId,
    ); 
    const comment = CommentsOrmEntity.create({
      content: command.content.content,
      commentatorInfo: {
        userId: command.userId,
        userLogin: user.login,
      },
      postId: command.postId,
    });

    await this.commentsRepository.save(comment);
    return comment.id;
  }
}
