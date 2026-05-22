import { BlogsRepository } from './../../infrastructure/blogsRepository';
import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateBlogDto } from '../../dto/input/createBlogDto';
import { BlogsOrmEntity } from '../../domain/blog.orm-entity';

@Injectable()
export class CreateBlogCommand {
  constructor(public dto: CreateBlogDto) { }
}
@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogCommand> {
  constructor(private blogsRepository: BlogsRepository) { }

  async execute(command: CreateBlogCommand): Promise<string> {
    const blog = BlogsOrmEntity.create(command.dto);
    await this.blogsRepository.save(blog);
    return blog.id
  }
}
