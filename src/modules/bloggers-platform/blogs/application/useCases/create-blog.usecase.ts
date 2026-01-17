import { BlogsRepository } from './../../infrastructure/blogsRepository';
import { Injectable } from '@nestjs/common';
import { BlogDocument, BlogModelType } from '../../domain/blogEntity';
import { InjectModel } from '@nestjs/mongoose';
import { Blog } from '../../domain/blogEntity';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateBlogDto } from '../../dto/input/createBlogDto';

@Injectable()
export class CreateBlogCommand {
  constructor(public dto: CreateBlogDto) {}
}
@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogCommand> {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
    private blogsRepository: BlogsRepository,
  ) {}

  async execute(command: CreateBlogCommand): Promise<BlogDocument> {
    const blog: BlogDocument = this.BlogModel.createInstance({
      name: command.dto.name,
      description: command.dto.description,
      websiteUrl: command.dto.websiteUrl,
    });
    await this.blogsRepository.save(blog);
    return blog;
  }
}
