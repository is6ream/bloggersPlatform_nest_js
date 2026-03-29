import { PostRepository } from './../../../posts/infrastructure/postRepository';
import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from 'src/modules/bloggers-platform/blogs/infrastructure/blogsRepository';
import { CreatePostByBlogIdInputDto } from 'src/modules/bloggers-platform/posts/dto/input/createPostByBlogIdInputDto';
import { PostSqlEntity } from 'src/modules/bloggers-platform/posts/domain/post-sql.entity';

@Injectable()
export class CreatePostForSpecificBlogCommand {
  constructor(
    public postId: string,
    public dto: CreatePostByBlogIdInputDto,
  ) {}
}

@CommandHandler(CreatePostForSpecificBlogCommand)
export class CreatePostByBlogIdUseCase implements ICommandHandler<CreatePostForSpecificBlogCommand> {
  constructor(
    private postRepository: PostRepository,
    private blogRepository: BlogsRepository,
  ) {}

  async execute(
    command: CreatePostForSpecificBlogCommand,
  ): Promise<PostSqlEntity> {
    const blog = await this.blogRepository.findOrNotFoundFail(command.postId);
    const post = PostSqlEntity.createForInsert({
      title: command.dto.title,
      shortDescription: command.dto.shortDescription,
      content: command.dto.content,
      blogId: blog.id,
      blogName: blog.name,
    });
    await this.postRepository.save(post);
    return post;
  }
}
