import { Injectable } from '@nestjs/common';
import { CreateCommentInputDto } from 'src/modules/bloggers-platform/posts/api/model/input/create-comment.input.dto';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { CommentSqlEntity } from '../../domain/commentEntity';
import { PostRepository } from 'src/modules/bloggers-platform/posts/infrastructure/postRepository';
import { CommentsRepository } from '../../infrastructure/comments-repository';
import { UsersRepository } from 'src/modules/user-accounts/infrastructure/users/repositories/users-repository';
@Injectable()
export class CreateCommentCommand {
  constructor(
    public postId: string,
    public userId: string,
    public content: CreateCommentInputDto,
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase implements ICommandHandler<CreateCommentCommand> {
  constructor(
    private postRepository: PostRepository,
    private commentsRepository: CommentsRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute(command: CreateCommentCommand): Promise<string> {
    await this.postRepository.findOrNotFoundFail(command.postId);
    const user = await this.usersRepository.findByIdOrThrowValidationError(
      command.userId,
    ); //ищем пользователя, который оставляет комментарий
    const comment = CommentSqlEntity.createForInsert({
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
