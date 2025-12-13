import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BlogDocument, BlogModelType } from '../domain/blogEntity';
import { CreateBlogDto } from '../dto/input/createBlogDto';
import { BlogsRepository } from '../infrastructure/blogsRepository';
import { UpdateBlogDto } from '../dto/input/updateBlogDto';
import { Blog } from '../domain/blogEntity';
@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
    private blogsRepository: BlogsRepository,
  ) {}

  async createBlog(dto: CreateBlogDto): Promise<string> {
    const blog: BlogDocument = this.BlogModel.createInstance({
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
    });

    await this.blogsRepository.save(blog);

    return blog._id.toString();
  }

  async updateBlog(id: string, dto: UpdateBlogDto): Promise<void> {
    const blog: BlogDocument = this.blogsRepository.findById(id);

    blog.updateBlog(dto);

    await this.blogsRepository.save(blog);

    return;
  }
}
