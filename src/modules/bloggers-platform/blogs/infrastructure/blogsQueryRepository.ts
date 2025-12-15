import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blogEntity';
import { BlogViewDto } from '../dto/output/blogViewDto';
import { GetBlogsQueryParams } from '../api/query/get-blogs-query-params';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { BlogPaginatedViewDto } from '../api/paginated/paginated.blog.view-dto';

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
      throw new NotFoundException('blog not found!');
    }

    return BlogViewDto.mapToView(blog);
  }

  async getAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto>> {
    const skip = query.calculateSkip();

    const filter: Record<string, any> = {};

    if (query.searchNameTerm) {
      filter['name'] = { $regex: query.searchNameTerm, $options: 'i' };
    }

    const [blogs, totalCount] = await Promise.all([
      this.BlogModel.find(filter)
        .skip(skip)
        .limit(query.pageSize)
        .sort({ createdAt: query.sortDirection }),

      this.BlogModel.countDocuments(filter),
    ]);

    const result = BlogPaginatedViewDto.mapToView({
      items: blogs.map((b) => BlogViewDto.mapToView(b)),
      page: query.pageNumber,
      size: query.pageSize,
      totalCount: totalCount,
    });

    return result;
  }
}
