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
  UseInterceptors,
} from '@nestjs/common';
import { CreateBlogInputDto } from '../dto/input/createBlogInputDto';
import { BlogViewModel } from './model/blogViewModel';
import { BlogsQueryRepository } from '../infrastructure/blogsQueryRepository';
import { GetBlogsQueryParams } from './query/get-blogs-query-params';
import { BlogPaginatedViewDto } from './paginated/paginated.blog.view-dto';
import { UpdateBlogDto } from '../dto/input/updateBlogDto';
import { PostsQueryRepository } from '../../posts/infrastructure/postQueryRepository';
import { GetPostsQueryParams } from '../../posts/api/query/get-posts-query-params';
import { PostViewModel } from '../../posts/api/model/output/postViewModel';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { BlogDocument } from '../domain/blogEntity';
import { PostDocument } from '../../posts/domain/postEntity';
import { CreatePostByBlogIdInputDto } from '../../posts/dto/input/createPostByBlogIdInputDto';
import { UpdateBlogCommand } from '../application/useCases/update-blog-usecase';
import { BasicAuthGuard } from 'src/modules/user-accounts/guards/basic/basic-auth.guard';
import { DeleteBlogCommand } from '../application/useCases/delete-blog-by-id.usecase';
import { CreateBlogCommand } from '../application/useCases/create-blog.usecase';
import { GetBlogByIdQuery } from '../application/queries/get-blog-byId.query';
import { CreatePostForSpecificBlogCommand } from '../application/useCases/create-blog-by-blogId.usecase';
import { UserExtractorInterceptor } from 'src/core/interceptors/user-extractor.inteceptor';
import { UserIdOptional } from 'src/core/decorators/user-id.optional.decorator';

@Controller('blogs')
export class BlogsController {
  constructor(
    private blogsQueryRepository: BlogsQueryRepository,
    private postsQueryRepository: PostsQueryRepository,
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Get()
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<BlogPaginatedViewDto> {
    return this.blogsQueryRepository.getAll(query);
  }
  @Get(':id/posts')
  @UseInterceptors(UserExtractorInterceptor)
  async getAllPostsForBlog(
    @Param('id') id: string,
    @UserIdOptional() userId: string,
    @Query()
    query: GetPostsQueryParams,
  ) {
    return this.postsQueryRepository.getAllPostsForBlog(id, query);
  }

  @UseGuards(BasicAuthGuard)
  @Post(':id/posts')
  async createPostForSpecificBlog(
    @Param('id') id: string,
    @Body() body: CreatePostByBlogIdInputDto,
  ): Promise<PostViewModel> {
    const post: PostDocument = await this.commandBus.execute(
      new CreatePostForSpecificBlogCommand(id, body),
    );

    return this.postsQueryRepository.getCreatedPost(post._id.toString());
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogViewModel> {
    const blog: BlogDocument = await this.commandBus.execute(
      new CreateBlogCommand(body),
    );
    return blog.toViewModel(blog._id.toString());
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<BlogViewModel> {
    return this.queryBus.execute(new GetBlogByIdQuery(id));
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
}
