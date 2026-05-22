import { PostsRepository } from '../../../posts/infrastructure/postsRepository';
import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from 'src/modules/bloggers-platform/blogs/infrastructure/blogsRepository';
import { CreatePostByBlogIdInputDto } from 'src/modules/bloggers-platform/posts/dto/input/createPostByBlogIdInputDto';
import { PostsOrmEntity } from 'src/modules/bloggers-platform/posts/infrastructure/typeOrm/entity/post.orm-entity';

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
    private postRepository: PostsRepository,
    private blogRepository: BlogsRepository,
  ) {}

  async execute(
    command: CreatePostForSpecificBlogCommand,
  ): Promise<PostsOrmEntity> {
    const blog = await this.blogRepository.findOrNotFoundFail(command.postId);
    const post = PostsOrmEntity.create({
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
