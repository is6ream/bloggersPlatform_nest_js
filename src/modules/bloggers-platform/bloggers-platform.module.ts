import { Module } from '@nestjs/common';
import { SaBlogsController } from './blogs/api/s-a.blogs-controller';
import { BlogsController } from './blogs/api/blogs-controller';
import { BlogsRepository } from './blogs/infrastructure/blogsRepository';
import { BlogsService } from './blogs/application/blogs-service';
import { PostsRepository } from './posts/infrastructure/postsRepository';
import { PostsService } from './posts/application/posts-service';
import { PostsController } from './posts/api/postsController';
import { CommentsQueryRepository } from './comments/infrastructure/commentsQueryRepository';
import { CommentsController } from './comments/api/commentsController';
import { blogCommandHandlers } from './blogs/application/blog-command-handlers';
import { postCommandHandlers } from './posts/application/post-command-handlers';
import { commentsCommandHandler } from './comments/application/useCases/comments-command-handler';
import { LikesRepository } from './likes/infrastructure/likes-repository';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogsOrmEntity } from './blogs/domain/blog.orm-entity';
import { PostsOrmEntity } from './posts/infrastructure/typeOrm/entity/post.orm-entity';
import { PostQueryRepository } from './posts/infrastructure/postsQueryRepository';
import { UserAccountsModule } from '../user-accounts/userAccounts.module';
import { BlogsQueryRepository } from './blogs/infrastructure/blogsQueryRepository';
import { CommentsOrmEntity } from './comments/domain/comment.orm-entity';
import { CommentsRepository } from './comments/infrastructure/commentsRepository';
import { LikesOrmEntity } from './likes/domain/like.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BlogsOrmEntity,
      PostsOrmEntity,
      CommentsOrmEntity,
      LikesOrmEntity,
    ]),
    UserAccountsModule
  ],
  controllers: [SaBlogsController, BlogsController, PostsController, CommentsController],
  providers: [
    BlogsQueryRepository,
    BlogsRepository,
    BlogsService,
    PostQueryRepository,
    PostsRepository,
    PostsService,
    JwtService,
    CommentsQueryRepository,
    CommentsRepository,
    LikesRepository,

    ...blogCommandHandlers,
    ...postCommandHandlers,
    ...commentsCommandHandler,
  ],
  exports: [],
})
export class BloggersPlatformModule { }
