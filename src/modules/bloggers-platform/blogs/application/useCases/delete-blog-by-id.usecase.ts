import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogsRepository';
import { BlogDocument } from '../../domain/blogEntity';
@Injectable()
export class DeleteBlogCommand {
  constructor(public blogId: string) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogByIdUseCase implements ICommandHandler<DeleteBlogCommand> {
  constructor(private blogRepository: BlogsRepository) {}

  async execute(command: DeleteBlogCommand): Promise<void> {
    const blog: BlogDocument = await this.blogRepository.findOrNotFoundFail(
      command.blogId,
    );

    blog.makeDeleted();

    await this.blogRepository.save(blog);
  }
}
