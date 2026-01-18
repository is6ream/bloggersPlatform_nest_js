import { CreateBlogByBlogIdUseCase } from './blogs/application/useCases/create-blog-by-blogId.usecase';
import { DeleteBlogByIdUseCase } from './blogs/application/useCases/delete-blog-by-id.usecase';
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
import { PostEntity, PostSchema } from './posts/domain/postEntity';
import { CommentsQueryRepository } from './comments/infrastructure/comments-queryRepository';
import { Comment, CommentsSchema } from './comments/domain/commentEntity';
import { CommentsController } from './comments/api/commentsController';
import { CqrsModule } from '@nestjs/cqrs';
import { blogCommandHandlers } from './blogs/application/blog-command-handlers';
import { postCommandHandlers } from './posts/application/post-command-handlers';
import { Like, LikeSchema } from './likes/domain/like-entity';
import { UsersRepository } from '../user-accounts/infrastructure/users/usersRepository';
import { User, UserSchema } from '../user-accounts/domain/userEntity';
import { commentsCommandHadnler } from './comments/application/useCases/comments-command-handler';
import { CommentsRepository } from './comments/infrastructure/comments-repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
    MongooseModule.forFeature([{ name: PostEntity.name, schema: PostSchema }]),
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentsSchema }]),
    MongooseModule.forFeature([{ name: Like.name, schema: LikeSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
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
    CommentsRepository,
    UsersRepository,
    ...blogCommandHandlers,
    ...postCommandHandlers,
    ...commentsCommandHadnler,
  ],
  exports: [],
})
export class BloggersPlatformModule {}
