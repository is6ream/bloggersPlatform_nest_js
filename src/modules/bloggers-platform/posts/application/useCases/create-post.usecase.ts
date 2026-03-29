import { PostRepository } from './../../infrastructure/postRepository';
import { Injectable } from '@nestjs/common';
import { CreatePostInputDto } from '../../dto/input/createPostInputDto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from 'src/modules/bloggers-platform/blogs/infrastructure/blogsRepository';
import { PostSqlEntity } from '../../domain/post-sql.entity';

@Injectable()
export class CreatePostCommand {
  constructor(public dto: CreatePostInputDto) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase implements ICommandHandler<CreatePostCommand> {
  constructor(
    private blogsRepository: BlogsRepository,
    private postRepository: PostRepository,
  ) {}

  async execute(command: CreatePostCommand): Promise<string> {
    const blog = await this.blogsRepository.findByIdOrThrowValidationError(
      command.dto.blogId,
    );
    const post = PostSqlEntity.createForInsert({
      title: command.dto.title,
      shortDescription: command.dto.shortDescription,
      content: command.dto.content,
      blogId: blog.id,
      blogName: blog.name,
    });
    await this.postRepository.save(post);
    return post.id;
  }
}
