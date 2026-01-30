import { Injectable } from '@nestjs/common';
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
import { PaginatedPostsDto} from 'src/modules/bloggers-platform/posts/infrastructure/dto/paginated-post.dto';
import { PostQueryDto } from 'src/modules/bloggers-platform/posts/infrastructure/dto/post-query.dto';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(PostEntity.name) private postModel: Model<PostDocument>,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
  ) {}

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
      return {
        pagesCount: 0,
        page: pageNumber,
        pageSize,
        totalCount: 0,
        items: [],
      };
    }

    // 5. Собираем ID постов для агрегации
    const postIds = posts.map((post) => post._id.toString());

    // 6. Получаем агрегированные данные о лайках
    const likesAggregation = await this.getLikesAggregation(postIds, userId);

    // 7. Создаем мапу лайков для быстрого доступа
    const likesMap = likesAggregation.reduce((acc, item) => {
      acc[item.postId] = {
        userReaction: item.userReaction || 'None',
        newestLikes: item.newestLikes || [],
        likesCount: item.likesCount || 0,
        dislikesCount: item.dislikesCount || 0,
      };
      return acc;
    }, {});

    // 8. Преобразуем посты в нужный формат
    const items = posts.map((post) => {
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
        .slice(0, 3);

      return {
        id: postId,
        title: post.title,
        shortDescription: post.shortDescription,
        content: post.content,
        blogId: post.blogId,
        blogName: post.blogName,
        createdAt: post.createdAt,
        extendedLikesInfo: {
          likesCount: postLikes.likesCount,
          dislikesCount: postLikes.dislikesCount,
          myStatus: userId ? postLikes.userReaction : 'None',
          newestLikes: newestLikes.map((like) => ({
            addedAt: like.addedAt,
            userId: like.userId,
            login: like.login || `user${like.userId.slice(0, 4)}`, // заглушка если нет логина
          })),
        },
      };
    });

    // 9. Получаем общее количество постов
    const totalCount = await this.postModel.countDocuments(filter);

    // 10. Рассчитываем количество страниц
    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }

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
      {
        $facet: {
          // Статистика по лайкам/дизлайкам
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
          // Последние лайки
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
          // Реакция текущего пользователя
          ...(userId
            ? {
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
              }
            : {}),
        },
      },
      {
        $project: {
          combined: {
            $concatArrays: [
              '$stats',
              '$newestLikes',
              ...(userId ? ['$userReaction'] : []),
            ],
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
                    login: '$$like.login', // добавьте логин через $lookup если нужно
                  },
                },
              },
              [],
            ],
          },
          userReaction: { $ifNull: ['$data.userReaction', 'None'] },
        },
      },
    ];

    return await this.likeModel.aggregate(pipeline).exec();
  }
}
