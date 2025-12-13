import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blogEntity';

@Injectable()
export class BlogsRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {}

  async save(blog: BlogDocument) {
    await blog.save();
  }

  async findById(id: string): Promise<BlogDocument | null> {
    const blog: BlogDocument | null = await this.BlogModel.findById(id);
    if (!blog) {
      return null;
    }
    return blog;
  }
}
