import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from '../domain/postEntity';
import { PostDocument, PostModelType } from '../domain/postEntity';
import { GetPostsQueryParams } from '../api/query/get-posts-query-params';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { PostPaginatedViewDto } from '../api/paginated/paginated.post.view-dto';
import { PostViewDto } from '../dto/output/postViewDto';
import { BlogsRepository } from '../../blogs/infrastructure/blogsRepository';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    private blogsRepository: BlogsRepository,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<PostViewDto> {
    const post: PostDocument | null = await this.PostModel.findOne({
      _id: id,
      deleteAt: null,
    });

    if (!post) {
      throw new NotFoundException('post not found');
    }

    console.log(post, 'post check in DAL');

    return PostViewDto.mapToView(post);
  }

  async getAll(
    query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto>> {
    const skip = query.calculateSkip();

    const filter: Record<string, any> = {};

    const [posts, totalCount] = await Promise.all([
      this.PostModel.find(filter)
        .skip(skip)
        .limit(query.pageSize)
        .sort({ createdAt: query.sortDirection }),

      this.PostModel.countDocuments(filter),
    ]);

    const result = PostPaginatedViewDto.mapToView({
      items: posts.map((p) => PostViewDto.mapToView(p)),
      page: query.pageNumber,
      size: query.pageSize,
      totalCount: totalCount,
    });

    return result;
  }

  async getAllPostsForBlog(
    id: string,
    query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto>> {
    const skip = query.calculateSkip();

    await this.blogsRepository.checkBlogExist(id);

    const filter: Record<string, string> = {
      blogId: id,
    };

    const [posts, totalCount] = await Promise.all([
      this.PostModel.find(filter)
        .skip(skip)
        .limit(query.pageSize)
        .sort({ createdAt: query.sortDirection }),

      this.PostModel.countDocuments(filter),
    ]);

    const result = PostPaginatedViewDto.mapToView({
      items: posts.map((p) => PostViewDto.mapToView(p)),
      page: query.pageNumber,
      size: query.pageSize,
      totalCount: totalCount,
    });

    return result;
  }
}
