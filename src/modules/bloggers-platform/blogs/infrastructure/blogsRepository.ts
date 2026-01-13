import { Injectable, NotFoundException } from '@nestjs/common';
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
      throw new DomainException({ code: 1, message: 'Blog not found' });
    }
    return blog;
  }

  async findByIdOrThrowValidationError(id: string): Promise<BlogDocument> {
    const blog = await this.BlogModel.findOne({
      _id: id,
      deleteAt: null,
    });

    if (!blog) {
      throw new DomainException({
        code: 2, 
        message: 'Blog not found',
        extensions: [
          {
            message: 'Blog with specified id not found',
            field: 'blogId',
          },
        ],
      });
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
