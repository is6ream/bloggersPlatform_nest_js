import { Module } from '@nestjs/common';
import { SaBlogsController } from './blogs/api/s-a.blogs-controller';
import { BlogsController } from './blogs/api/blogs-controller';
import { BlogsRepository } from './blogs/infrastructure/blogsRepository';
import { BlogsRawSqlQueryRepository } from './blogs/infrastructure/blogs-raw-sql.query-repository';
import { BlogsQueryRepository } from './blogs/infrastructure/blogsQueryRepository';
import { BlogsService } from './blogs/application/blogs-service';
import { PostRepository } from './posts/infrastructure/postRepository';
import { PostsService } from './posts/application/posts-service';
import { PostsController } from './posts/api/postsController';
import { PostsRawSqlQueryRepository } from './posts/infrastructure/posts-raw-sql.query-repository';
import { CommentsQueryRepository } from './comments/infrastructure/comments-queryRepository';
import { CommentsController } from './comments/api/commentsController';
import { blogCommandHandlers } from './blogs/application/blog-command-handlers';
import { postCommandHandlers } from './posts/application/post-command-handlers';
import { commentsCommandHadnler } from './comments/application/useCases/comments-command-handler';
import { CommentsRepository } from './comments/infrastructure/comments-repository';
import { LikesRepository } from './likes/infrastructure/likes-repository';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogsOrmEntity } from './blogs/infrastructure/entity/blog-orm.entity';
import { PostOrmEntity } from './posts/infrastructure/typeOrm/entity/post-orm.entity';
import { PostQueryRepository } from './posts/infrastructure/typeOrm/postsQueryRepository';
import { UserAccountsModule } from '../user-accounts/userAccounts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlogsOrmEntity, PostOrmEntity]),
    UserAccountsModule
  ],
  controllers: [SaBlogsController, BlogsController, PostsController, CommentsController],
  providers: [
    BlogsRawSqlQueryRepository,
    BlogsQueryRepository,
    BlogsRepository,
    BlogsService,
    PostsRawSqlQueryRepository,
    PostQueryRepository,
    PostRepository,
    PostsService,
    JwtService,
    CommentsQueryRepository,
    CommentsRepository,
    LikesRepository,

    ...blogCommandHandlers,
    ...postCommandHandlers,
    ...commentsCommandHadnler,
  ],
  exports: [],
})
export class BloggersPlatformModule { }
