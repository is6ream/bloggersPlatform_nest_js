import { Body, Controller, Post } from '@nestjs/common';
import { BlogsService } from '../application/blogs-service';

@Controller('blogs')
export class BlogsController {
  constructor(private blogsService: BlogsService) {}

  @Post()
  async createBlog(@Body() body: )
}
