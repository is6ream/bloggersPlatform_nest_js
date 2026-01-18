import { Injectable } from '@nestjs/common';
import { CreateCommentInputDto } from 'src/modules/bloggers-platform/posts/api/model/input/create-comment.input.dto';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Comment } from '../../domain/commentEntity';
import { CommentModelType } from '../../domain/commentEntity';
import { PostEntity } from 'src/modules/bloggers-platform/posts/domain/postEntity';
import { PostModelType } from 'src/modules/bloggers-platform/posts/domain/postEntity';
import { PostRepository } from 'src/modules/bloggers-platform/posts/infrastructure/postRepository';
import { CommentsRepository } from '../../infrastructure/comments-repository';
@Injectable()
export class CreateCommentCommand {
  constructor(
    public postId: string,
    public dto: CreateCommentInputDto,
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase implements ICommandHandler<CreateCommentCommand> {
  constructor(
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    @InjectModel(PostEntity.name)
    private PostModel: PostModelType,
    private postRepository: PostRepository,
    private commentsRepository: CommentsRepository,
  ) {}

  async execute(command: CreateCommentCommand): Promise<string> {
    const post = await this.postRepository.findOrNotFoundFail(command.postId);
    const comment = new Comment(command.dto.content, post, command.dto.userId);
    await this.commentsRepository.save(comment);
    return comment.id;
  }
}
