import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PostEntity,
  PostDocument,
} from 'src/modules/bloggers-platform/posts/domain/postEntity';
import {
  Like,
  LikeDocument,
} from 'src/modules/bloggers-platform/likes/domain/like-entity';
import { PaginatedPostsDto } from 'src/modules/bloggers-platform/posts/infrastructure/dto/paginated-post.dto';
import { PostQueryDto } from 'src/modules/bloggers-platform/posts/infrastructure/dto/post-query.dto';

//ии выдавала полную чушь 
@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(PostEntity.name) private postModel: Model<PostDocument>,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
  ) {}

  // ==================== ПУБЛИЧНЫЕ МЕТОДЫ ====================

  /**
   * Получить все посты с пагинацией и информацией о лайках
   */
  async findAllWithLikes(
    queryDto: PostQueryDto,
    userId?: string,
  ): Promise<PaginatedPostsDto> {
    const { pageNumber, pageSize, sortBy, sortDirection } =
      queryDto;

    // 1. Создаем фильтр и получаем посты
    const { posts, totalCount } = await this.getPostsWithPagination(
      queryDto,
    );

    // 2. Если постов нет - возвращаем пустой результат
    if (!posts.length) {
      return this.createEmptyPaginatedResponse(pageNumber, pageSize);
    }

    // 3. Получаем агрегированные данные о лайках
    const postIds = posts.map((post) => post._id.toString());
    const likesAggregation = await this.getLikesAggregation(postIds, userId);

    // 4. Создаем мапу лайков для быстрого доступа
    const likesMap = this.createLikesMap(likesAggregation);

    // 5. Преобразуем посты в DTO
    const items = posts.map((post) =>
      this.mapToPostViewDto(post, likesMap, userId),
    );

    // 6. Рассчитываем количество страниц
    const pagesCount = Math.ceil(totalCount / pageSize);

    return new PaginatedPostsDto(
      pagesCount,
      pageNumber,
      pageSize,
      totalCount,
      items,
    );
  }

  /**
   * Получить пост по ID с информацией о лайках
   * @throws NotFoundException если пост не найден
   */
  async findByIdOrNotFoundFail(
    id: string,
    userId?: string,
  ): Promise<PostViewDto> {
    // 1. Валидация ID
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }

    // 2. Поиск поста
    const post = await this.postModel
      .findOne({
        _id: new Types.ObjectId(id),
        deleteAt: null,
      })
      .lean()
      .exec();

    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }

    // 3. Получаем агрегированные данные о лайках для одного поста
    const likesAggregation = await this.getLikesForSinglePost(id, userId);
    const postLikes = likesAggregation[0] || {
      userReaction: 'None',
      newestLikes: [],
      likesCount: 0,
      dislikesCount: 0,
    };

    // 4. Формируем DTO
    return this.mapToPostViewDto(post, { [id]: postLikes }, userId);
  }

  // ==================== ПРИВАТНЫЕ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  /**
   * Получить посты с пагинацией
   */
  private async getPostsWithPagination(
    queryDto: PostQueryDto,
  ): Promise<{ posts: any[]; totalCount: number }> {
    const { pageNumber, pageSize, sortBy, sortDirection } = queryDto;
    const skip = (pageNumber - 1) * pageSize;

    // Создаем фильтр
    const filter: any = { deleteAt: null };

    // Параллельно получаем посты и общее количество
    const [posts, totalCount] = await Promise.all([
      this.postModel
        .find(filter)
        .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec(),
      this.postModel.countDocuments(filter),
    ]);

    return { posts, totalCount };
  }

  /**
   * Агрегация лайков для нескольких постов
   */
  private async getLikesAggregation(
    postIds: string[],
    userId?: string,
  ): Promise<any[]> {
    const pipeline: any[] = [
      {
        $match: {
          parentId: { $in: postIds },
          parentType: 'post',
        },
      },
    ];

    // Если есть userId, добавляем логику для его реакции
    if (userId) {
      pipeline.push(
        {
          $facet: {
            stats: [
              {
                $group: {
                  _id: '$parentId',
                  likesCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'Like'] }, 1, 0] },
                  },
                  dislikesCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'Dislike'] }, 1, 0] },
                  },
                },
              },
            ],
            newestLikes: [
              {
                $match: {
                  status: 'Like',
                },
              },
              {
                $sort: { createdAt: -1 },
              },
              {
                $group: {
                  _id: '$parentId',
                  likes: { $push: '$$ROOT' },
                },
              },
              {
                $project: {
                  newestLikes: { $slice: ['$likes', 3] },
                },
              },
            ],
            userReaction: [
              {
                $match: {
                  userId: userId,
                },
              },
              {
                $group: {
                  _id: '$parentId',
                  userReaction: { $first: '$status' },
                },
              },
            ],
          },
        },
        {
          $project: {
            combined: {
              $concatArrays: ['$stats', '$newestLikes', '$userReaction'],
            },
          },
        },
        {
          $unwind: '$combined',
        },
        {
          $group: {
            _id: '$combined._id',
            data: { $mergeObjects: '$combined' },
          },
        },
        {
          $project: {
            postId: '$_id',
            likesCount: { $ifNull: ['$data.likesCount', 0] },
            dislikesCount: { $ifNull: ['$data.dislikesCount', 0] },
            newestLikes: {
              $ifNull: [
                {
                  $map: {
                    input: '$data.newestLikes',
                    as: 'like',
                    in: {
                      addedAt: '$$like.createdAt',
                      userId: '$$like.userId',
                      // Здесь можно добавить $lookup для получения логина
                    },
                  },
                },
                [],
              ],
            },
            userReaction: { $ifNull: ['$data.userReaction', 'None'] },
          },
        },
      );
    } else {
      // Без userId - только статистика и последние лайки
      pipeline.push(
        {
          $facet: {
            stats: [
              {
                $group: {
                  _id: '$parentId',
                  likesCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'Like'] }, 1, 0] },
                  },
                  dislikesCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'Dislike'] }, 1, 0] },
                  },
                },
              },
            ],
            newestLikes: [
              {
                $match: {
                  status: 'Like',
                },
              },
              {
                $sort: { createdAt: -1 },
              },
              {
                $group: {
                  _id: '$parentId',
                  likes: { $push: '$$ROOT' },
                },
              },
              {
                $project: {
                  newestLikes: { $slice: ['$likes', 3] },
                },
              },
            ],
          },
        },
        {
          $project: {
            combined: {
              $concatArrays: ['$stats', '$newestLikes'],
            },
          },
        },
        {
          $unwind: '$combined',
        },
        {
          $group: {
            _id: '$combined._id',
            data: { $mergeObjects: '$combined' },
          },
        },
        {
          $project: {
            postId: '$_id',
            likesCount: { $ifNull: ['$data.likesCount', 0] },
            dislikesCount: { $ifNull: ['$data.dislikesCount', 0] },
            newestLikes: {
              $ifNull: [
                {
                  $map: {
                    input: '$data.newestLikes',
                    as: 'like',
                    in: {
                      addedAt: '$$like.createdAt',
                      userId: '$$like.userId',
                    },
                  },
                },
                [],
              ],
            },
            userReaction: 'None',
          },
        },
      );
    }

    return await this.likeModel.aggregate(pipeline).exec();
  }

  /**
   * Агрегация лайков для одного поста (оптимизированная версия)
   */
  private async getLikesForSinglePost(
    postId: string,
    userId?: string,
  ): Promise<any[]> {
    const pipeline: any[] = [
      {
        $match: {
          parentId: postId,
          parentType: 'post',
        },
      },
    ];

    // Основные этапы агрегации
    const groupStage = {
      $group: {
        _id: '$parentId',
        likesCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Like'] }, 1, 0] },
        },
        dislikesCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Dislike'] }, 1, 0] },
        },
        allLikes: {
          $push: {
            $cond: [
              { $eq: ['$status', 'Like'] },
              {
                userId: '$userId',
                createdAt: '$createdAt',
                status: '$status',
              },
              null,
            ],
          },
        },
      },
    };

    // Добавляем логику для пользователя, если указан
    if (userId) {
      groupStage.$group['userReaction'] = {
        $push: {
          $cond: [{ $eq: ['$userId', userId] }, '$status', null],
        },
      };
    }

    pipeline.push(groupStage);

    // Проекция результата
    const projectStage: any = {
      $project: {
        postId: '$_id',
        likesCount: 1,
        dislikesCount: 1,
        newestLikes: {
          $slice: [
            {
              $filter: {
                input: '$allLikes',
                as: 'like',
                cond: { $ne: ['$$like', null] },
              },
            },
            0,
            3,
          ],
        },
      },
    };

    if (userId) {
      projectStage.$project.userReaction = {
        $arrayElemAt: [
          {
            $filter: {
              input: '$userReaction',
              as: 'reaction',
              cond: { $ne: ['$$reaction', null] },
            },
          },
          0,
        ],
      };
    } else {
      projectStage.$project.userReaction = 'None';
    }

    pipeline.push(projectStage);

    return await this.likeModel.aggregate(pipeline).exec();
  }

  /**
   * Создать мапу лайков для быстрого доступа
   */
  private createLikesMap(aggregationResult: any[]): Record<string, any> {
    return aggregationResult.reduce((acc, item) => {
      acc[item.postId] = {
        userReaction: item.userReaction || 'None',
        newestLikes: item.newestLikes || [],
        likesCount: item.likesCount || 0,
        dislikesCount: item.dislikesCount || 0,
      };
      return acc;
    }, {});
  }

  /**
   * Преобразовать документ поста в DTO
   */
  private mapToPostViewDto(
    post: any,
    likesMap: Record<string, any>,
    userId?: string,
  ): PostViewDto {
    const postId = post._id.toString();
    const postLikes = likesMap[postId] || {
      userReaction: 'None',
      newestLikes: [],
      likesCount: 0,
      dislikesCount: 0,
    };

    // Получаем 3 последних лайка, отсортированных по дате
    const newestLikes = [...postLikes.newestLikes]
      .sort(
        (a, b) =>
          new Date(b.addedAt || b.createdAt).getTime() -
          new Date(a.addedAt || a.createdAt).getTime(),
      )
      .slice(0, 3)
      .map(
        (like) =>
          new NewestLikeDto(
            like.addedAt || like.createdAt,
            like.userId,
            like.login || `user${like.userId?.slice(0, 4) || 'unknown'}`,
          ),
      );

    return new PostViewDto(
      postId,
      post.title,
      post.shortDescription,
      post.content,
      post.blogId,
      post.blogName,
      post.createdAt,
      new ExtendedLikesInfoDto(
        postLikes.likesCount,
        postLikes.dislikesCount,
        userId ? postLikes.userReaction : 'None',
        newestLikes,
      ),
    );
  }

  /**
   * Создать пустой пагинированный ответ
   */
  private createEmptyPaginatedResponse(
    pageNumber: number,
    pageSize: number,
  ): PaginatedPostsDto {
    return new PaginatedPostsDto(0, pageNumber, pageSize, 0, []);
  }
}
