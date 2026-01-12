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
import { PostsController } from './posts/api/postsController';
import { PostSchema } from './posts/domain/postEntity';
import { Post } from './posts/domain/postEntity';
import { CommentsQueryRepository } from './comments/infrastructure/commentsQueryRepository';
import { Comment, CommentsSchema } from './comments/domain/commentEntity';
import { CommentsController } from './comments/api/commentsController';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateBlogUseCase } from './blogs/application/useCases/create-blog-use-case';
import { CreateBlogByBlogIdUseCase } from './blogs/application/useCases/create-blog-by-blogId-use-case';
import { UpdateBlogUseCase } from './blogs/application/useCases/update-blog-use-case';

const commandHandlers = [
  CreateBlogUseCase,
  CreateBlogByBlogIdUseCase,
  UpdateBlogUseCase,
];

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentsSchema }]),
    CqrsModule,
  ],
  controllers: [BlogsController, PostsController, CommentsController],
  providers: [
    BlogsQueryRepository,
    BlogsRepository,
    BlogsService,
    PostQueryRepository,
    PostRepository,
    PostsService,
    CommentsQueryRepository,
    ...commandHandlers,
  ],
  exports: [],
})
export class BloggersPlatformModule {}
