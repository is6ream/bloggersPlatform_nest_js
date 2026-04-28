import { BlogsRepository } from './../../infrastructure/blogsRepository';
import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateBlogDto } from '../../dto/input/createBlogDto';
import { BlogSqlEntity } from '../../domain/blog-sql.entity';

@Injectable()
export class CreateBlogCommand {
  constructor(public dto: CreateBlogDto) {}
}
@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogCommand> {
  constructor(private blogsRepository: BlogsRepository) {}
//команда не должна возврашать сущность
//вернуть id
  async execute(command: CreateBlogCommand): Promise<BlogSqlEntity> {
    const blog = BlogSqlEntity.createForInsert(command.dto);
    await this.blogsRepository.save(blog);
    return blog;
  }
}
