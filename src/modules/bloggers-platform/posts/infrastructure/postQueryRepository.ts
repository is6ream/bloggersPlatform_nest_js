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
import { PostViewDto } from 'src/modules/bloggers-platform/posts/infrastructure/dto/post-view.dto';
import { ExtendedLikesInfoDto } from 'src/modules/bloggers-platform/likes/types/output/extended-likes.dto';
import { NewestLikeDto } from 'src/modules/bloggers-platform/likes/types/output/newest-likes.dto';
import { DomainException } from 'src/core/exceptions/domain-exceptions';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(PostEntity.name) private postModel: Model<PostDocument>,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
  ) {}

  async getCreatedPost(id: string): Promise<PostViewDto> {
    const post: PostDocument | null = await this.postModel.findById(id);

    if (!post) {
      throw new DomainException({ code: 1, message: 'Post not found' });
    }
    return {
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: post.likesInfo.likesCount,
        dislikesCount: post.likesInfo.dislikesCount,
        myStatus: 'None',
        newestLikes: [],
      },
    };
  }

  async findAllWithLikes(
    queryDto: PostQueryDto,
    userId?: string,
  ): Promise<PaginatedPostsDto> {
    const { pageNumber, pageSize, sortBy, sortDirection, searchPostNameTerm } =
      queryDto;

    // 1. Создаем фильтр для постов
    const filter: any = { deleteAt: null };
    if (searchPostNameTerm) {
      filter.title = { $regex: searchPostNameTerm, $options: 'i' };
    }

    // 2. Рассчитываем пагинацию
    const skip = (pageNumber - 1) * pageSize;

    // 3. Получаем посты
    const posts = await this.postModel
      .find(filter)
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();

    // 4. Если постов нет - возвращаем пустой результат
    if (!posts.length) {
      return new PaginatedPostsDto(0, pageNumber, pageSize, 0, []);
    }

    // 5. Собираем ID постов для агрегации
    const postIds = posts.map((post) => post._id.toString());

    // 6. Получаем агрегированные данные о лайках
    const likesAggregation = await this.getLikesAggregation(postIds, userId);

    // 7. Создаем мапу лайков для быстрого доступа
    const likesMap = this.createLikesMap(likesAggregation);

    // 8. Преобразуем посты в DTO
    const items: PostViewDto[] = posts.map((post) => {
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
            new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
        )
        .slice(0, 3)
        .map(
          (like) =>
            new NewestLikeDto(
              like.addedAt,
              like.userId,
              like.login || `user${like.userId.slice(0, 4)}`,
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
    });

    // 9. Получаем общее количество постов
    const totalCount = await this.postModel.countDocuments(filter);

    // 10. Рассчитываем количество страниц
    const pagesCount = Math.ceil(totalCount / pageSize);

    return new PaginatedPostsDto(
      pagesCount,
      pageNumber,
      pageSize,
      totalCount,
      items,
    );
  }
  //
  // async findByIdOrNotFoundFail(
  //   id: string,
  //   userId?: string,
  // ): Promise<PostViewDto> {
  //   // Валидация ID
  //   if (!Types.ObjectId.isValid(id)) {
  //     throw new NotFoundException(`Post with id ${id} not found`);
  //   }
  //
  //   // Поиск поста
  //   const post = await this.postModel
  //     .findOne({
  //       _id: new Types.ObjectId(id),
  //       deleteAt: null,
  //     })
  //     .lean()
  //     .exec();
  //
  //   if (!post) {
  //     throw new NotFoundException(`Post with id ${id} not found`);
  //   }
  //
  //   // Получаем агрегированные данные о лайках для одного поста
  //   const likesAggregation = await this.getLikesForSinglePost(id, userId);
  //   const postLikes = likesAggregation[0] || {
  //     userReaction: 'None',
  //     newestLikes: [],
  //     likesCount: 0,
  //     dislikesCount: 0,
  //   };
  //
  //   // Формируем newestLikes
  //   const newestLikes = [...postLikes.newestLikes]
  //     .sort(
  //       (a, b) =>
  //         new Date(b.addedAt || b.createdAt).getTime() -
  //         new Date(a.addedAt || a.createdAt).getTime(),
  //     )
  //     .slice(0, 3)
  //     .map(
  //       (like) =>
  //         new NewestLikeDto(
  //           like.addedAt || like.createdAt,
  //           like.userId,
  //           like.login || `user${like.userId?.slice(0, 4) || 'unknown'}`,
  //         ),
  //     );
  //
  //   // Возвращаем DTO
  //   return new PostViewDto(
  //     post._id.toString(),
  //     post.title,
  //     post.shortDescription,
  //     post.content,
  //     post.blogId,
  //     post.blogName,
  //     post.createdAt,
  //     new ExtendedLikesInfoDto(
  //       postLikes.likesCount,
  //       postLikes.dislikesCount,
  //       userId ? postLikes.userReaction : 'None',
  //       newestLikes,
  //     ),
  //   );
  // }
  private async getLikesAggregation(
    postIds: string[],
    userId?: string,
  ): Promise<LikesAggregationResult[]> {
    const pipeline: any[] = [];

    // 1. Фильтрация по postIds и типу "post"
    pipeline.push({
      $match: {
        parentId: { $in: postIds },
        parentType: 'post',
      },
    });

    // 2. Сортировка по дате для получения последних лайков
    pipeline.push({
      $sort: { createdAt: -1 },
    });

    // 3. Добавляем $lookup для получения данных пользователя (если нужно логины)
    // Если у вас есть коллекция users с логинами
    pipeline.push({
      $lookup: {
        from: 'users', // название коллекции пользователей
        localField: 'userId',
        foreignField: '_id',
        as: 'userData',
      },
    });

    pipeline.push({
      $unwind: {
        path: '$userData',
        preserveNullAndEmptyArrays: true, // если пользователь не найден
      },
    });

    // 4. Группировка по postId
    const groupStage: any = {
      $group: {
        _id: '$parentId',
        // Собираем все реакции для подсчета
        allReactions: { $push: '$$ROOT' },
        // Счетчики лайков и дизлайков
        likesCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Like'] }, 1, 0] },
        },
        dislikesCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Dislike'] }, 1, 0] },
        },
        // Собираем только лайки для newestLikes
        allLikes: {
          $push: {
            $cond: [
              { $eq: ['$status', 'Like'] },
              {
                userId: '$userId',
                login: '$userData.login', // предполагаем поле login в userData
                createdAt: '$createdAt',
                userData: '$userData',
              },
              null,
            ],
          },
        },
      },
    };

    // 5. Добавляем реакцию текущего пользователя, если userId передан
    if (userId) {
      groupStage.$group.currentUserReaction = {
        $push: {
          $cond: [{ $eq: ['$userId', userId] }, '$status', null],
        },
      };
    }

    pipeline.push(groupStage);

    // 6. Проекция результата
    const projectStage: any = {
      $project: {
        postId: '$_id',
        likesCount: 1,
        dislikesCount: 1,
        // Фильтруем null значения из allLikes и берем 3 последних
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
            3, // только 3 последних лайка
          ],
        },
      },
    };

    // 7. Добавляем userReaction в проекцию если userId был передан
    if (userId) {
      projectStage.$project.userReaction = {
        $arrayElemAt: [
          {
            $filter: {
              input: '$currentUserReaction',
              as: 'reaction',
              cond: { $ne: ['$$reaction', null] },
            },
          },
          0,
        ],
      };
    } else {
      projectStage.$project.userReaction = { $literal: 'None' };
    }

    pipeline.push(projectStage);

    // 8. Форматируем newestLikes в нужную структуру
    pipeline.push({
      $addFields: {
        newestLikes: {
          $map: {
            input: '$newestLikes',
            as: 'like',
            in: {
              addedAt: '$$like.createdAt',
              userId: '$$like.userId',
              login: '$$like.login', // или '$$like.userData.login'
            },
          },
        },
      },
    });

    // 9. Сортировка результата (опционально)
    pipeline.push({
      $sort: { postId: 1 },
    });

    try {
      const result = await this.likeModel.aggregate(pipeline).exec();
      return result;
    } catch (error) {
      console.error('Aggregation error:', error);
      return [];
    }
  }

  private async getLikesForSinglePost(
    postId: string,
    userId?: string,
  ): Promise<LikesAggregationResult[]> {
    const pipeline: any[] = [
      // 1. Match only for this post
      {
        $match: {
          parentId: postId,
          parentType: 'post',
        },
      },
      // 2. Sort for newest likes
      {
        $sort: { createdAt: -1 },
      },
      // 3. Get user data in parallel
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    // 4. Group with conditional aggregation
    const groupStage: any = {
      $group: {
        _id: '$parentId',
        // Counters
        likesCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Like'] }, 1, 0] },
        },
        dislikesCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Dislike'] }, 1, 0] },
        },
        // Collect likes for newest
        likesData: {
          $push: {
            $cond: [
              { $eq: ['$status', 'Like'] },
              {
                userId: '$userId',
                createdAt: '$createdAt',
                login: '$user.login',
              },
              '$$REMOVE', // Remove non-likes completely
            ],
          },
        },
      },
    };

    // Add user reaction if userId provided
    if (userId) {
      groupStage.$group.userReactions = {
        $push: {
          $cond: [{ $eq: ['$userId', userId] }, '$status', '$$REMOVE'],
        },
      };
    }

    pipeline.push(groupStage);

    // 5. Project with transformations
    const projectStage: any = {
      $project: {
        postId: '$_id',
        likesCount: 1,
        dislikesCount: 1,
        // Take first 3 likes (already sorted)
        newestLikes: {
          $slice: ['$likesData', 3],
        },
      },
    };

    // Add userReaction if we have userId
    if (userId) {
      projectStage.$project.userReaction = {
        $cond: [
          { $gt: [{ $size: '$userReactions' }, 0] },
          { $arrayElemAt: ['$userReactions', 0] },
          'None',
        ],
      };
    } else {
      projectStage.$project.userReaction = 'None';
    }

    pipeline.push(projectStage);

    // 6. Map to final structure
    pipeline.push({
      $project: {
        postId: 1,
        likesCount: 1,
        dislikesCount: 1,
        userReaction: 1,
        newestLikes: {
          $map: {
            input: '$newestLikes',
            as: 'like',
            in: {
              addedAt: '$$like.createdAt',
              userId: '$$like.userId',
              login: {
                $ifNull: [
                  '$$like.login',
                  { $concat: ['user', { $substr: ['$$like.userId', 0, 4] }] },
                ],
              },
            },
          },
        },
      },
    });

    try {
      const result = await this.likeModel.aggregate(pipeline).exec();
      return result;
    } catch (error) {
      console.error('Single post aggregation error:', error);
      // Return default structure if aggregation fails
      return [
        {
          postId,
          likesCount: 0,
          dislikesCount: 0,
          userReaction: 'None',
          newestLikes: [],
        },
      ];
    }
  }
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
}

export interface LikesAggregationResult {
  postId: string;
  likesCount: number;
  dislikesCount: number;
  userReaction: string; // 'Like' | 'Dislike' | 'None'
  newestLikes: Array<{
    addedAt: Date;
    userId: string;
    login: string;
  }>;
}
