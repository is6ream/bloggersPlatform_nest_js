import { Body, Controller, Post } from '@nestjs/common';
import { BlogsService } from '../application/blogs-service';
import { CreateBlogInputDto } from '../dto/input/createBlogInputDto';
import { BlogViewModel } from './model/blogViewModel';

@Controller('blogs')
export class BlogsController {
  constructor(private blogsService: BlogsService) {}

  @Post()
  async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogViewModel> {
    const blogId = await this.blogsService.createBlog(body);

    return this; //прописать blogsQueryRepo для возврата Вьюшки
  }
}
