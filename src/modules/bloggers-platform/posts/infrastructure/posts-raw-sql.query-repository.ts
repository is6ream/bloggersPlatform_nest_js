import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
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

type NewestLikeRow = {
  addedAt: Date | string;
  userId: string;
  login: string;
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
  private readonly likesTableName = 'likes';
  private readonly usersTableName = 'users';

  private postsTableEnsured = false;
  private likesTableEnsured = false;

  constructor(
    private readonly dataSource: DataSource,
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

  private async ensureLikesTable(): Promise<void> {
    if (this.likesTableEnsured) {
      return;
    }
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id TEXT PRIMARY KEY,
        status VARCHAR(10) NOT NULL,
        "userId" TEXT NOT NULL,
        "parentId" TEXT NOT NULL,
        "parentType" VARCHAR(20) NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await this.dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS likes_unique_user_parent_idx
      ON likes ("userId", "parentId", "parentType");
    `);
    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS likes_parent_idx
      ON likes ("parentType", "parentId");
    `);
    this.likesTableEnsured = true;
  }

  private resolveSortColumn(sortBy: string): string {
    if (sortBy === 'title') {
      return 'p.title';
    }
    return 'p."createdAt"';
  }

  async getPostById(id: string, userId: string): Promise<PostViewDto> {
    await this.ensurePostsTable();
    await this.ensureLikesTable();
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

    const likesInfo = await this.getLikesInfoByPostId(id, userId);

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
    await this.ensureLikesTable();
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

    const items: PostViewDto[] = await Promise.all(
      postRows.map(async (post) => {
        const postId = post.id;
        const postLikes = await this.getLikesInfoByPostId(postId, userId);

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
      }),
    );

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
    await this.ensureLikesTable();
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

    const items: PostViewDto[] = await Promise.all(
      postRows.map(async (post) => {
        const postId = post.id;
        const postLikes = await this.getLikesInfoByPostId(postId, userId);

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
      }),
    );

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

  private async getLikesInfoByPostId(
    postId: string,
    userId?: string,
  ): Promise<LikesAggregationResult> {
    const countRows = await this.dataSource.query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN l.status = 'Like' THEN 1 ELSE 0 END), 0)::int AS "likesCount",
        COALESCE(SUM(CASE WHEN l.status = 'Dislike' THEN 1 ELSE 0 END), 0)::int AS "dislikesCount"
      FROM ${this.likesTableName} l
      WHERE l."parentType" = 'Post'
        AND l."parentId" = $1;
      `,
      [postId],
    );

    const newestRows = await this.dataSource.query(
      `
      SELECT
        l."createdAt" AS "addedAt",
        l."userId" AS "userId",
        COALESCE(u.login, 'user' || SUBSTRING(l."userId" FROM 1 FOR 4)) AS "login"
      FROM ${this.likesTableName} l
      LEFT JOIN ${this.usersTableName} u ON u.id = l."userId"
      WHERE l."parentType" = 'Post'
        AND l."parentId" = $1
        AND l.status = 'Like'
      ORDER BY l."createdAt" DESC
      LIMIT 3;
      `,
      [postId],
    );

    let userReaction = 'None';
    if (userId) {
      const myLikeRows = await this.dataSource.query(
        `
        SELECT l.status
        FROM ${this.likesTableName} l
        WHERE l."parentType" = 'Post'
          AND l."parentId" = $1
          AND l."userId" = $2
        LIMIT 1;
        `,
        [postId, userId],
      );
      userReaction = myLikeRows[0]?.status ?? 'None';
    }

    return {
      postId,
      likesCount: Number(countRows[0]?.likesCount ?? 0),
      dislikesCount: Number(countRows[0]?.dislikesCount ?? 0),
      userReaction,
      newestLikes: (newestRows as NewestLikeRow[]).map((row: NewestLikeRow) => ({
        addedAt: new Date(row.addedAt),
        userId: row.userId,
        login: row.login,
      })),
    };
  }
}
