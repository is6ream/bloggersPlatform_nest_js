import { Body, Controller, Post } from '@nestjs/common';
import { BlogsService } from '../application/blogs-service';
import { CreateBlogInputDto } from '../dto/input/createBlogInputDto';
import { BlogViewModel } from './model/blogViewModel';
import { BlogsQueryRepository } from '../infrastructure/blgosQueryRepository';

@Controller('blogs')
export class BlogsController {
  constructor(
    private blogsService: BlogsService,
    private blogsQueryRepository: BlogsQueryRepository,
  ) {}

  @Post()
  async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogViewModel> {
    const blogId = await this.blogsService.createBlog(body);

    return this.blogsQueryRepository.getByIdOrNotFoundFail(blogId); //прописать blogsQueryRepo для возврата Вьюшки
  }
}
