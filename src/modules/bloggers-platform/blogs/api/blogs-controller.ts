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
import { BlogsService } from '../application/blogs-service';
import { CreateBlogInputDto } from '../dto/input/createBlogInputDto';
import { BlogViewModel } from './model/blogViewModel';
import { BlogsQueryRepository } from '../infrastructure/blogsQueryRepository';
import { GetBlogsQueryParams } from './query/get-blogs-query-params';
import { BlogPaginatedViewDto } from './paginated/paginated.blog.view-dto';
import { UpdateBlogDto } from '../dto/input/updateBlogDto';
import { PostPaginatedViewDto } from '../../posts/api/paginated/paginated.post.view-dto';
import { PostQueryRepository } from '../../posts/infrastructure/postQueryRepository';
import { GetPostsQueryParams } from '../../posts/api/query/get-posts-query-params';
import { PostViewModel } from '../../posts/api/model/postViewModel';
import { PostsService } from '../../posts/application/posts-service';
import { CommandBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from '../application/useCases/create-blog-use-case';
import { BlogDocument } from '../domain/blogEntity';
import { CreateBlogByBlogIdCommand } from '../application/useCases/create-blog-by-blogId-use-case';
import { PostDocument } from '../../posts/domain/postEntity';
import { CreatePostByBlogIdInputDto } from '../../posts/dto/input/createPostByBlogIdInputDto';
import { UpdateBlogCommand } from '../application/useCases/update-blog-use-case';
import { BasicAuthGuard } from 'src/modules/user-accounts/guards/basic/basic-auth.guard';
import { DeleteBlogCommand } from '../application/useCases/delete-blog-by-id-use-case';
@Controller('blogs')
@UseGuards(BasicAuthGuard)
export class BlogsController {
  constructor(
    private blogsService: BlogsService,
    private postsService: PostsService,
    private blogsQueryRepository: BlogsQueryRepository,
    private postsQueryRepository: PostQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Get()
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<BlogPaginatedViewDto> {
    return this.blogsQueryRepository.getAll(query);
  }

  @Get(':id/posts')
  async getAllPostsForBlog(
    @Param('id') id: string,
    @Query() query: GetPostsQueryParams,
  ): Promise<PostPaginatedViewDto> {
    return this.postsQueryRepository.getAllPostsForBlog(id, query);
  }

  @Post(':id/posts')
  async createPostForSpecificBlog(
    @Param('id') id: string,
    @Body() body: CreatePostByBlogIdInputDto,
  ): Promise<PostViewModel> {
    const post: PostDocument = await this.commandBus.execute(
      new CreateBlogByBlogIdCommand(id, body),
    );

    return post.toViewModel(post._id.toString());
  }

  @Post()
  async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogViewModel> {
    const blog: BlogDocument = await this.commandBus.execute(
      new CreateBlogCommand(body),
    );
    return blog.toViewModel(blog._id.toString());
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<BlogViewModel> {
    return this.blogsQueryRepository.getByIdOrNotFoundFail(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id') id: string,
    @Body() body: UpdateBlogDto,
  ): Promise<void> {
    return this.commandBus.execute(new UpdateBlogCommand(id, body));
  }

  //остановился здесь, нужно выбросить 404 ошибку
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new DeleteBlogCommand(id));
  }
}
