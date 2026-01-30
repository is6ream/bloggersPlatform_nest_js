import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostEntity } from '../domain/postEntity';
import { PostModelType } from '../domain/postEntity';
import { GetPostsQueryParams } from '../api/query/get-posts-query-params';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { PostPaginatedViewDto } from '../api/paginated/paginated.post.view-dto';
import { PostViewDto } from '../dto/output/postViewDto';
import { BlogsRepository } from '../../blogs/infrastructure/blogsRepository';
import { PaginatedPostsDto } from 'src/modules/bloggers-platform/posts/infrastructure/dto/paginated-post.dto';
import {
  Like,
  LikeModelType,
} from 'src/modules/bloggers-platform/likes/domain/like-entity';
import { PostQueryDto } from 'src/modules/bloggers-platform/posts/infrastructure/dto/post-query.dto';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectModel(PostEntity.name)
    private postModel: PostModelType,
    @InjectModel(Like.name)
    private likeModel: LikeModelType,
    private blogsRepository: BlogsRepository,
  ) {}

  //todo закинул нейронке просьбу прописать метод возврата всех постов
  async findAll(
    queryDto: PostQueryDto,
    userId?: string,
  ): Promise<PaginatedPostsDto> {
    const { pageNumber, pageSize, sortBy, sortDirection } =
      queryDto;

    // 1. Создаем фильтр
    const filter: any = { deleteAt: null }; // Только неудаленные посты

    if (searchPostNameTerm) {
      filter.title = { $regex: searchPostNameTerm, $options: 'i' };
    }

    // 2. Вычисляем пагинацию
    const skip = (pageNumber - 1) * pageSize;

    // 3. Получаем посты с пагинацией
    const posts = await this.postModel
      .find(filter)
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();

    if (!posts.length) {
      return this.createEmptyResponse(pageNumber, pageSize);
    }

    // 4. Собираем ID постов
    const postIds = posts.map((post) => post._id.toString());

    // 5. Получаем агрегированные данные о лайках
    const likesAggregation = await this.getLikesAggregation(postIds, userId);

    // 6. Преобразуем в мапу для быстрого доступа
    const likesMap = this.createLikesMap(likesAggregation);

    // 7. Преобразуем посты в DTO
    const items = await Promise.all(
      posts.map(async (post) => this.mapToPostViewDto(post, likesMap, userId)),
    );

    // 8. Получаем общее количество
    const totalCount = await this.postModel.countDocuments(filter);

    // 9. Рассчитываем pagesCount
    const pagesCount = Math.ceil(totalCount / pageSize);

    return new PaginatedPostsDto(
      pagesCount,
      pageNumber,
      pageSize,
      totalCount,
      items,
    );
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
