import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blogEntity';
import { DomainException } from 'src/core/exceptions/domain-exceptions';

@Injectable()
export class BlogsRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {}

  async findById(id: string): Promise<BlogDocument | null> {
    return this.BlogModel.findOne({
      _id: id,
      deleteAt: null,
    });
  }

  async save(blog: BlogDocument) {
    await blog.save();
  }

  async findOrNotFoundFail(id: string): Promise<BlogDocument> {
    const blog = await this.findById(id);
    if (!blog) {
      console.log(blog, 'blog in DAL checkBlogExist');
      throw new HttpException('', 404); //здесь должна быть просто 404
      //для всех 404 ошибок в приложении должен быть глобальный exception filer
    }
    return blog;
  }

  async checkBlogExist(id: string): Promise<void> {
    const blog = await this.findById(id);
    if (!blog) {
      throw new NotFoundException(`blog with id: ${id} not found`);
    }
  }
}
