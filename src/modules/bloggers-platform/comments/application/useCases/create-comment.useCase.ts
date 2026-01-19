import { Injectable } from '@nestjs/common';
import { CreateCommentInputDto } from 'src/modules/bloggers-platform/posts/api/model/input/create-comment.input.dto';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Comment } from '../../domain/commentEntity';
import { CommentModelType } from '../../domain/commentEntity';
import { PostEntity } from 'src/modules/bloggers-platform/posts/domain/postEntity';
import { PostRepository } from 'src/modules/bloggers-platform/posts/infrastructure/postRepository';
import { CommentsRepository } from '../../infrastructure/comments-repository';
@Injectable()
export class CreateCommentCommand {
  constructor(
    public postId: string,
    public userId: string,
    public userLogin: string,
    public content: CreateCommentInputDto,
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase implements ICommandHandler<CreateCommentCommand> {
  constructor(
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    @InjectModel(PostEntity.name)
    private postRepository: PostRepository,
    private commentsRepository: CommentsRepository,
  ) {}

  async execute(command: CreateCommentCommand): Promise<string> {
    const post = await this.postRepository.findOrNotFoundFail(command.postId); //остановился тут 
    console.log(command.userLogin, 'command userLogin check');
    const comment = this.CommentModel.createInstance({
      content: command.content.content,
      commentatorInfo: { userId: command.userId, userLogin: command.userLogin },
    });
    await this.commentsRepository.save(comment);
    return comment._id.toString();
  }
}
