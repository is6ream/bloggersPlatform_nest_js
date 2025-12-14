import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from '@nestjs/common';
import { PostModelType } from '../domain/postEntity';
import { GetPostsQueryParams } from '../api/query/get-posts-query-params';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { PostViewDto } from '../dto/postViewDto';
import { PostPaginatedViewDto } from '../api/paginated/paginated.post.view-dto';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
  ) {}

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
        items: posts.map((p) => PostViewDto)
    })
  }
}
