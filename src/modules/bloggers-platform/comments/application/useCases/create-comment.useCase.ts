import { Injectable } from '@nestjs/common';
import { CreateCommentInputDto } from 'src/modules/bloggers-platform/posts/api/model/input/create-comment.input.dto';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Comment } from '../../domain/commentEntity';
import { CommentModelType } from '../../domain/commentEntity';
import { PostRepository } from 'src/modules/bloggers-platform/posts/infrastructure/postRepository';
import { CommentsRepository } from '../../infrastructure/comments-repository';
import { UserContextDto } from 'src/modules/user-accounts/guards/dto/user-context.input.dto';
import { UsersRepository } from 'src/modules/user-accounts/infrastructure/users/usersRepository';
@Injectable()
export class CreateCommentCommand {
  constructor(
    public postId: string,
    public user: UserContextDto,
    public content: CreateCommentInputDto,
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase implements ICommandHandler<CreateCommentCommand> {
  constructor(
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    private postRepository: PostRepository,
    private commentsRepository: CommentsRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute(command: CreateCommentCommand): Promise<string> {
    await this.postRepository.findOrNotFoundFail(command.postId);
    const user = await this.usersRepository.findOrNotFoundFail(command.user.id);
    const comment = this.CommentModel.createInstance({
      content: command.content.content,
      commentatorInfo: {
        userId: command.user.id,
        userLogin: user.login,
      },
    });
    await this.commentsRepository.save(comment);
    return comment._id.toString();
  }
}
