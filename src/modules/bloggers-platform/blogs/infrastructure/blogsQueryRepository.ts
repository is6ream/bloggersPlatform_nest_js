import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blogEntity';
import { BlogViewDto } from '../dto/output/blogViewDto';

@Injectable()
export class BlogsQueryRepository {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<BlogViewDto> {
    const blog: BlogDocument | null = await this.BlogModel.findOne({
      _id: id,
      deleteAt: null,
    });

    if (!blog) {
      throw new NotFoundException('user not found!');
    }

    return BlogViewDto.mapToView(blog);
  }
}
