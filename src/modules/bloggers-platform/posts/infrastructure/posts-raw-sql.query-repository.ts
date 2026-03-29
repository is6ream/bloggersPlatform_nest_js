import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DataSource } from 'typeorm';
import { Model, PipelineStage } from 'mongoose';
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
import { BlogsRepository } from 'src/modules/bloggers-platform/blogs/infrastructure/blogsRepository';

type RawPostRow = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  deleteAt: Date | string | null;
  createdAt: Date | string;
  likesCount: number;
  dislikesCount: number;
};

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

@Injectable()
export class PostsRawSqlQueryRepository {
  private readonly tableName = 'posts';

  private postsTableEnsured = false;

  constructor(
    private readonly dataSource: DataSource,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    private blogsRepository: BlogsRepository,
  ) {}

  private async ensurePostsTable(): Promise<void> {
    if (this.postsTableEnsured) {
      return;
    }
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title VARCHAR(30) NOT NULL,
        "shortDescription" VARCHAR(100) NOT NULL,
        content VARCHAR(1000) NOT NULL,
        "blogId" TEXT NOT NULL,
        "blogName" VARCHAR(15) NOT NULL,
        "deleteAt" TIMESTAMPTZ NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "likesCount" INTEGER NOT NULL DEFAULT 0,
        "dislikesCount" INTEGER NOT NULL DEFAULT 0
      );
    `);
    this.postsTableEnsured = true;
  }

  private resolveSortColumn(sortBy: string): string {
    if (sortBy === 'title') {
      return 'p.title';
    }
    return 'p."createdAt"';
  }

  async getPostById(id: string, userId: string): Promise<PostViewDto> {
    await this.ensurePostsTable();
    const rows = await this.dataSource.query(
      `
      SELECT
        p.id,
        p.title,
        p."shortDescription",
        p.content,
        p."blogId",
        p."blogName",
        p."deleteAt",
        p."createdAt",
        p."likesCount",
        p."dislikesCount"
      FROM ${this.tableName} p
      WHERE p.id = $1
      LIMIT 1;
      `,
      [id],
    );
    const post = (rows as RawPostRow[])[0];
    if (!post || post.deleteAt !== null) {
      throw new DomainException({ code: 1, message: 'Post not Found' });
    }

    const likesAggregation = await this.getLikesAggregation([id], userId);
    const likesInfo = likesAggregation[0] || {
      likesCount: 0,
      dislikesCount: 0,
      userReaction: 'None',
      newestLikes: [],
    };

    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: new Date(post.createdAt),
      extendedLikesInfo: {
        likesCount: likesInfo.likesCount,
        dislikesCount: likesInfo.dislikesCount,
        myStatus: userId ? (likesInfo.userReaction ?? 'None') : 'None',
        newestLikes: likesInfo.newestLikes.map((like) => ({
          addedAt: like.addedAt,
          userId: like.userId,
          login: like.login || `user${like.userId.slice(0, 4)}`,
        })),
      },
    };
  }

  async getCreatedPost(id: string): Promise<PostViewDto> {
    await this.ensurePostsTable();
    const rows = await this.dataSource.query(
      `
      SELECT
        p.id,
        p.title,
        p."shortDescription",
        p.content,
        p."blogId",
        p."blogName",
        p."deleteAt",
        p."createdAt",
        p."likesCount",
        p."dislikesCount"
      FROM ${this.tableName} p
      WHERE p.id = $1
      LIMIT 1;
      `,
      [id],
    );
    const post = (rows as RawPostRow[])[0];
    if (!post) {
      throw new DomainException({ code: 1, message: 'Post not found' });
    }
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: new Date(post.createdAt),
      extendedLikesInfo: {
        likesCount: Number(post.likesCount),
        dislikesCount: Number(post.dislikesCount),
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
    await this.blogsRepository.checkBlogExist(blogId);

    const { pageNumber, pageSize, sortBy, sortDirection, searchPostNameTerm } =
      queryDto;
    const skip = (pageNumber - 1) * pageSize;
    const orderDir = sortDirection === 'asc' ? 'ASC' : 'DESC';
    const sortCol = this.resolveSortColumn(sortBy);

    await this.ensurePostsTable();

    const params: unknown[] = [blogId];
    let searchClause = '';
    if (searchPostNameTerm) {
      params.push(`%${searchPostNameTerm}%`);
      searchClause = `AND p.title ILIKE $${params.length}`;
    }
    params.push(pageSize, skip);

    const limitIdx = params.length - 1;
    const offsetIdx = params.length;
    const posts = await this.dataSource.query(
      `
      SELECT
        p.id,
        p.title,
        p."shortDescription",
        p.content,
        p."blogId",
        p."blogName",
        p."deleteAt",
        p."createdAt",
        p."likesCount",
        p."dislikesCount"
      FROM ${this.tableName} p
      WHERE p."blogId" = $1
        AND p."deleteAt" IS NULL
        ${searchClause}
      ORDER BY ${sortCol} ${orderDir}
      LIMIT $${limitIdx} OFFSET $${offsetIdx};
      `,
      params,
    );

    if (!(posts as RawPostRow[]).length) {
      return new PaginatedPostsDto(0, pageNumber, pageSize, 0, []);
    }

    const postRows = posts as RawPostRow[];
    const postIds = postRows.map((p) => p.id);
    const likesAggregation = await this.getLikesAggregation(postIds, userId);
    const likesMap = this.createLikesMap(likesAggregation);

    const items: PostViewDto[] = postRows.map((post) => {
      const postId = post.id;
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
        new Date(post.createdAt),
        new ExtendedLikesInfoDto(
          postLikes.likesCount,
          postLikes.dislikesCount,
          userId ? postLikes.userReaction : 'None',
          newestLikes,
        ),
      );
    });

    const countParams: unknown[] = [blogId];
    let countSearchClause = '';
    if (searchPostNameTerm) {
      countParams.push(`%${searchPostNameTerm}%`);
      countSearchClause = `AND p.title ILIKE $${countParams.length}`;
    }
    const countRows = await this.dataSource.query(
      `
      SELECT COUNT(*)::int AS c
      FROM ${this.tableName} p
      WHERE p."blogId" = $1
        AND p."deleteAt" IS NULL
        ${countSearchClause};
      `,
      countParams,
    );
    const totalCount = Number((countRows as { c: number }[])[0]?.c ?? 0);
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

    const skip = (pageNumber - 1) * pageSize;
    const orderDir = sortDirection === 'asc' ? 'ASC' : 'DESC';
    const sortCol = this.resolveSortColumn(sortBy);

    await this.ensurePostsTable();

    const params: unknown[] = [];
    let whereClause = 'WHERE p."deleteAt" IS NULL';
    if (searchPostNameTerm) {
      params.push(`%${searchPostNameTerm}%`);
      whereClause += ` AND p.title ILIKE $${params.length}`;
    }
    params.push(pageSize, skip);
    const limitIdx = params.length - 1;
    const offsetIdx = params.length;

    const posts = await this.dataSource.query(
      `
      SELECT
        p.id,
        p.title,
        p."shortDescription",
        p.content,
        p."blogId",
        p."blogName",
        p."deleteAt",
        p."createdAt",
        p."likesCount",
        p."dislikesCount"
      FROM ${this.tableName} p
      ${whereClause}
      ORDER BY ${sortCol} ${orderDir}
      LIMIT $${limitIdx} OFFSET $${offsetIdx};
      `,
      params,
    );

    if (!(posts as RawPostRow[]).length) {
      return new PaginatedPostsDto(0, pageNumber, pageSize, 0, []);
    }

    const postRows = posts as RawPostRow[];
    const postIds = postRows.map((p) => p.id);
    const likesAggregation = await this.getLikesAggregation(postIds, userId);
    const likesMap = this.createLikesMap(likesAggregation);

    const items: PostViewDto[] = postRows.map((post) => {
      const postId = post.id;
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
        new Date(post.createdAt),
        new ExtendedLikesInfoDto(
          postLikes.likesCount,
          postLikes.dislikesCount,
          userId ? postLikes.userReaction : 'None',
          newestLikes,
        ),
      );
    });

    const countParams: unknown[] = [];
    let countWhere = 'WHERE p."deleteAt" IS NULL';
    if (searchPostNameTerm) {
      countParams.push(`%${searchPostNameTerm}%`);
      countWhere += ` AND p.title ILIKE $${countParams.length}`;
    }
    const countRows = await this.dataSource.query(
      `SELECT COUNT(*)::int AS c FROM ${this.tableName} p ${countWhere};`,
      countParams,
    );
    const totalCount = Number((countRows as { c: number }[])[0]?.c ?? 0);
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
    const pipeline: PipelineStage[] = [
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

    return (await this.likeModel
      .aggregate(pipeline)
      .exec()) as LikesAggregationResult[];
  }

  private createLikesMap(aggregationResult: LikesAggregationResult[]): Record<
    string,
    {
      userReaction: string;
      newestLikes: LikesAggregationResult['newestLikes'];
      likesCount: number;
      dislikesCount: number;
    }
  > {
    return aggregationResult.reduce(
      (acc, item) => {
        acc[item.postId] = {
          userReaction: item.userReaction || 'None',
          newestLikes: item.newestLikes || [],
          likesCount: item.likesCount || 0,
          dislikesCount: item.dislikesCount || 0,
        };
        return acc;
      },
      {} as Record<
        string,
        {
          userReaction: string;
          newestLikes: LikesAggregationResult['newestLikes'];
          likesCount: number;
          dislikesCount: number;
        }
      >,
    );
  }
}
