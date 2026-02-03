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
import { CreatePostByBlogIdInputDto } from 'src/modules/bloggers-platform/posts/dto/input/createPostByBlogIdInputDto';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(PostEntity.name) private postModel: Model<PostDocument>,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
  ) {}

  async getPostById(id: string, userId: string): Promise<PostViewDto> {
    const post: PostDocument | null = await this.postModel.findById(id);
    if (!post || post.deleteAt !== null) {
      throw new DomainException({ code: 1, message: 'Post not Found' });
    }
    const likesAggregation = await this.getLikesForSinglePost(id, userId);

    const likesInfo = likesAggregation[0] || {
      likesCount: 0,
      dislikesCount: 0,
      userReaction: 'None',
      newestLikes: [],
    };

    return {
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: likesInfo.likesCount,
        dislikesCount: likesInfo.dislikesCount,
        myStatus: userId ? likesInfo.userReaction : 'None',
        newestLikes: likesInfo.newestLikes.map((like) => ({
          addedAt: like.addedAt,
          userId: like.userId,
          login: like.login || `user${like.userId.slice(0, 4)}`,
        })),
      },
    };
  }

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

  async getAllPostsForBlog(
    blogId: string,
    queryDto: PostQueryDto,
    userId?: string,
  ): Promise<PaginatedPostsDto> {
    const { pageNumber, pageSize, sortBy, sortDirection, searchPostNameTerm } =
      queryDto;
    const filter: any = { deleteAt: null, blogId: blogId };

    const skip = (pageNumber - 1) * pageSize;

    const posts = await this.postModel
      .find(filter)
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();

    if (!posts.length) {
      return new PaginatedPostsDto(0, pageNumber, pageSize, 0, []);
    }

    const postIds = posts.map((post) => post._id.toString());

    const likesAggregation = await this.getLikesAggregation(postIds, userId);

    const likesMap = this.createLikesMap(likesAggregation);

    const items: PostViewDto[] = posts.map((post) => {
      const postId = post._id.toString();
      const postLikes = likesMap[postId] || {
        userReaction: 'None',
        newestLikes: [],
        likesCount: 0,
        dislikesCount: 0,
      };

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

    const totalCount = await this.postModel.countDocuments(filter);

    const pagesCount = Math.ceil(totalCount / pageSize);

    return new PaginatedPostsDto(
      pagesCount,
      pageNumber,
      pageSize,
      totalCount,
      items,
    );
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

  private async getLikesAggregation(
    postIds: string[],
    userId?: string,
  ): Promise<LikesAggregationResult[]> {
    const pipeline: any[] = [
      {
        $match: {
          parentId: { $in: postIds },
          parentType: 'Post',
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { userIdString: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $toObjectId: '$$userIdString' }],
                },
              },
            },
          ],
          as: 'user',
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: '$parentId',
          allReactions: { $push: '$$ROOT' },
          userReaction: {
            $push: {
              $cond: [{ $eq: ['$userId', userId] }, '$status', null],
            },
          },
          newestLikes: {
            $push: {
              $cond: [
                { $eq: ['$status', 'Like'] },
                {
                  addedAt: '$createdAt',
                  userId: '$userId',
                  login: { $arrayElemAt: ['$user.login', 0] },
                },
                null,
              ],
            },
          },
        },
      },
      {
        $project: {
          postId: '$_id',
          userReaction: {
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
          },
          newestLikes: {
            $slice: [
              {
                $filter: {
                  input: '$newestLikes',
                  as: 'like',
                  cond: { $ne: ['$$like', null] },
                },
              },
              0,
              3,
            ],
          },
          likesCount: {
            $size: {
              $filter: {
                input: '$allReactions',
                as: 'reaction',
                cond: { $eq: ['$$reaction.status', 'Like'] },
              },
            },
          },
          dislikesCount: {
            $size: {
              $filter: {
                input: '$allReactions',
                as: 'reaction',
                cond: { $eq: ['$$reaction.status', 'Dislike'] },
              },
            },
          },
        },
      },
    ];

    return await this.likeModel.aggregate(pipeline).exec();
  }

  private async getLikesForSinglePost(
    postId: string,
    userId?: string,
  ): Promise<LikesAggregationResult[]> {
    return this.getLikesAggregation([postId], userId);
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
  userReaction: string;
  newestLikes: Array<{
    addedAt: Date;
    userId: string;
    login: string;
  }>;
}
