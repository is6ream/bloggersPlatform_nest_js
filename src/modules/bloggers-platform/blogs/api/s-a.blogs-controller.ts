import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateBlogInputDto } from '../dto/input/createBlogInputDto';
import { BlogViewModel } from './model/blogViewModel';
import { BlogsRawSqlQueryRepository } from '../infrastructure/blogs-raw-sql.query-repository';
import { GetBlogsQueryParams } from './query/get-blogs-query-params';
import { BlogPaginatedViewDto } from './paginated/paginated.blog.view-dto';
import { UpdateBlogDto } from '../dto/input/updateBlogDto';
import { PostsRawSqlQueryRepository } from '../../posts/infrastructure/posts-raw-sql.query-repository';
import { GetPostsQueryParams } from '../../posts/api/query/get-posts-query-params';
import { PostViewModel } from '../../posts/api/model/output/postViewModel';
import { PaginatedPostsDto } from '../../posts/infrastructure/dto/paginated-post.dto';
import { CommandBus } from '@nestjs/cqrs';
import { BlogSqlEntity } from '../domain/blog-sql.entity';
import { PostSqlEntity } from '../../posts/domain/post-sql.entity';
import { CreatePostByBlogIdInputDto } from '../../posts/dto/input/createPostByBlogIdInputDto';
import { UpdateBlogCommand } from '../application/useCases/update-blog-usecase';
import { BasicAuthGuard } from 'src/modules/user-accounts/guards/basic/basic-auth.guard';
import { DeleteBlogCommand } from '../application/useCases/delete-blog-by-id.usecase';
import { CreateBlogCommand } from '../application/useCases/create-blog.usecase';
import { CreatePostForSpecificBlogCommand } from '../application/useCases/create-blog-by-blogId.usecase';
import { UpdatePostForSpecificBlogCommand } from '../application/useCases/update-post-for-specific-blog.usecase';
import { DeletePostForSpecificBlogCommand } from '../application/useCases/delete-post-for-specific-blog.usecase';

@Controller('/sa/blogs')
export class SaBlogsController {
  constructor(
    private blogsQueryRepository: BlogsRawSqlQueryRepository,
    private postsQueryRepository: PostsRawSqlQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Get()
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<BlogPaginatedViewDto> {
    return this.blogsQueryRepository.getAll(query);
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogViewModel> {
    const blog: BlogSqlEntity = await this.commandBus.execute(
      new CreateBlogCommand(body),
    );
    return blog.toViewModel(blog.id);
  }

  @UseGuards(BasicAuthGuard)
  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id') id: string,
    @Body() body: UpdateBlogDto,
  ): Promise<void> {
    return this.commandBus.execute(new UpdateBlogCommand(id, body));
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new DeleteBlogCommand(id));
  }

  @UseGuards(BasicAuthGuard)
  @Post(':id/posts')
  async createPostForSpecificBlog(
    @Param('id') id: string,
    @Body() body: CreatePostByBlogIdInputDto,
  ): Promise<PostViewModel> {
    const post: PostSqlEntity = await this.commandBus.execute(
      new CreatePostForSpecificBlogCommand(id, body),
    );

    return this.postsQueryRepository.getCreatedPost(post.id);
  }

  @UseGuards(BasicAuthGuard)
  @Get(':id/posts')
  async getPostsForSpecificBlog(
    @Param('id') id: string,
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedPostsDto> {
    return this.postsQueryRepository.getAllPostsForBlog(id, query, undefined);
  }

  @UseGuards(BasicAuthGuard)
  @Put(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePostForSpecificBlog(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() body: CreatePostByBlogIdInputDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdatePostForSpecificBlogCommand(blogId, postId, body),
    );
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePostForSpecificBlog(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new DeletePostForSpecificBlogCommand(blogId, postId),
    );
  }



  @Get(':id')
  async getById(@Param('id') id: string): Promise<BlogViewModel> {
    return this.blogsQueryRepository.getByIdOrNotFoundFail(id);
  }
}
