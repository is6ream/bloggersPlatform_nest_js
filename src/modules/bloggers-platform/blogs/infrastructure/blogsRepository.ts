import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blogEntity';

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

  async findBfindOrNotFoundFailyId(id: string): Promise<BlogDocument | null> {
    const blog = await this.findById(id);
    if (!blog) {
      throw new NotFoundException('blog not found');
    }
    return blog;
  }
}
