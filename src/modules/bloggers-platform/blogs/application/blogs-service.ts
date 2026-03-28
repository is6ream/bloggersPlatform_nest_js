import { Injectable } from '@nestjs/common';
import { CreateBlogDto } from '../dto/input/createBlogDto';
import { BlogsRepository } from '../infrastructure/blogsRepository';
import { UpdateBlogDto } from '../dto/input/updateBlogDto';
import { BlogSqlEntity } from '../domain/blog-sql.entity';

@Injectable()
export class BlogsService {
  constructor(private blogsRepository: BlogsRepository) {}

  async createBlog(dto: CreateBlogDto): Promise<string> {
    const blog = BlogSqlEntity.createForInsert(dto);
    await this.blogsRepository.save(blog);
    return blog.id;
  }

  async updateBlog(id: string, dto: UpdateBlogDto): Promise<void> {
    const blog = await this.blogsRepository.findOrNotFoundFail(id);

    blog.updateBlog(dto);

    await this.blogsRepository.save(blog);

    return;
  }

  async deleteBlog(id: string): Promise<void> {
    const blog = await this.blogsRepository.findOrNotFoundFail(id);

    blog.makeDeleted();

    await this.blogsRepository.save(blog);
  }
}
