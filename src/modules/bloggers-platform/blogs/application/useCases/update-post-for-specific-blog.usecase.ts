import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from 'src/modules/bloggers-platform/posts/infrastructure/postsRepository';
import { BlogsRepository } from 'src/modules/bloggers-platform/blogs/infrastructure/blogsRepository';
import { CreatePostByBlogIdInputDto } from 'src/modules/bloggers-platform/posts/dto/input/createPostByBlogIdInputDto';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';

@Injectable()
export class UpdatePostForSpecificBlogCommand {
  constructor(
    public readonly blogId: string,
    public readonly postId: string,
    public readonly dto: CreatePostByBlogIdInputDto,
  ) {}
}

@CommandHandler(UpdatePostForSpecificBlogCommand)
export class UpdatePostForSpecificBlogUseCase
  implements ICommandHandler<UpdatePostForSpecificBlogCommand>
{
  constructor(
    private readonly postRepository: PostsRepository,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async execute(command: UpdatePostForSpecificBlogCommand): Promise<void> {
    await this.blogsRepository.findOrNotFoundFail(command.blogId);
    const post = await this.postRepository.findOrNotFoundFail(command.postId);
    if (post.blogId !== command.blogId) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found for this blog',
      });
    }
    post.updatePost({
      title: command.dto.title,
      shortDescription: command.dto.shortDescription,
      content: command.dto.content,
      blogId: command.blogId,
    });
    await this.postRepository.save(post);
  }
}
