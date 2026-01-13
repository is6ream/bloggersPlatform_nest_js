import { Injectable } from '@nestjs/common';
import { UpdateBlogDto } from '../../dto/input/updateBlogDto';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../../domain/blogEntity';
import { BlogsRepository } from '../../infrastructure/blogsRepository';
import { DomainException } from 'src/core/exceptions/domain-exceptions';

@Injectable()
export class UpdateBlogCommand {
  constructor(
    public id: string,
    public dto: UpdateBlogDto,
  ) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase implements ICommandHandler<UpdateBlogCommand> {
  constructor(
    @InjectModel(Blog.name) private BlogModel: BlogModelType,
    private blogsRepository: BlogsRepository,
  ) {}

  async execute(command: UpdateBlogCommand): Promise<any> {
    const blog: BlogDocument = await this.blogsRepository.findOrNotFoundFail(
      command.id,
    );
    if (!blog) {
      throw new DomainException({ code: 1, message: 'Blog not found' });
    }
    blog.updateBlog(command.dto);
    await this.blogsRepository.save(blog);
  }
}
