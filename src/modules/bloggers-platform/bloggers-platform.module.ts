import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogSchema } from './blogs/domain/blogEntity';
import { Blog } from './blogs/domain/blogEntity';
import { BlogsController } from './blogs/api/blogs-controller';
import { BlogsQueryRepository } from './blogs/infrastructure/blogsQueryRepository';
import { BlogsRepository } from './blogs/infrastructure/blogsRepository';
import { BlogsService } from './blogs/application/blogs-service';
import { PostQueryRepository } from './posts/infrastructure/postQueryRepository';
import { PostRepository } from './posts/infrastructure/postRepository';
import { PostsService } from './posts/application/posts-service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
  ],
  controllers: [BlogsController],
  providers: [
    BlogsQueryRepository,
    BlogsRepository,
    BlogsService,
    PostQueryRepository,
    PostRepository,
    PostsService,
  ],
  exports: [],
})
export class BloggersPlatformModule {}
