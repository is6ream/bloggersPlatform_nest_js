import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from 'src/modules/bloggers-platform/posts/infrastructure/postRepository';
import { BlogsRepository } from 'src/modules/bloggers-platform/blogs/infrastructure/blogsRepository';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';

@Injectable()
export class DeletePostForSpecificBlogCommand {
  constructor(
    public readonly blogId: string,
    public readonly postId: string,
  ) {}
}

@CommandHandler(DeletePostForSpecificBlogCommand)
export class DeletePostForSpecificBlogUseCase
  implements ICommandHandler<DeletePostForSpecificBlogCommand>
{
  constructor(
    private readonly postRepository: PostRepository,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async execute(command: DeletePostForSpecificBlogCommand): Promise<void> {
    await this.blogsRepository.findOrNotFoundFail(command.blogId);
    const post = await this.postRepository.findOrNotFoundFail(command.postId);
    if (post.blogId !== command.blogId) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found for this blog',
      });
    }
    post.makeDeleted();
    await this.postRepository.save(post);
  }
}
