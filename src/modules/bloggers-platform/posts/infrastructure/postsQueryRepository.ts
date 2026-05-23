import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { PostsOrmEntity } from '../domain/post.orm-entity';
import { GetPostsQueryParams } from '../api/query/get-posts-query-params';
import { PostViewDto } from './dto/post-view.dto';
import { ExtendedLikesInfoDto } from 'src/modules/bloggers-platform/likes/types/output/extended-likes.dto';
import { NewestLikeDto } from 'src/modules/bloggers-platform/likes/types/output/newest-likes.dto';
import { BlogsQueryRepository } from '../../blogs/infrastructure/blogsQueryRepository';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { PaginatedPostsDto } from './dto/paginated-post.dto';

type NewestLikeRow = {
  addedAt: Date | string;
  userId: string;
  login: string;
};

type LikesAggregationResult = {
  likesCount: number;
  dislikesCount: number;
  userReaction: string;
  newestLikes: Array<{
    addedAt: Date;
    userId: string;
    login: string;
  }>;
};

@Injectable()
export class PostQueryRepository {
  private readonly likesTableName = 'likes';
  private readonly usersTableName = 'users';

  constructor(
    @InjectRepository(PostsOrmEntity)
    private readonly repo: Repository<PostsOrmEntity>,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly dataSource: DataSource,
  ) {}

  async findAllWithLikes(
    query: GetPostsQueryParams,
    userId?: string,
  ): Promise<PaginatedPostsDto> {
    return this.findPostsPaginated(query, undefined, userId);
  }

  async getAllPostsForBlog(
    blogId: string,
    query: GetPostsQueryParams,
    userId?: string,
  ): Promise<PaginatedPostsDto> {
    await this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);
    return this.findPostsPaginated(query, blogId, userId);
  }

  async getPostById(id: string, userId?: string): Promise<PostViewDto> {
    const post = await this.repo.findOne({
      where: { id, deleteAt: IsNull() },
    });

    if (!post) {
      throw new DomainException({ code: 1, message: 'Post not Found' });
    }

    return this.mapToViewWithLikes(post, userId);
  }

  async getCreatedPost(id: string): Promise<PostViewDto> {
    const post = await this.repo.findOne({
      where: { id, deleteAt: IsNull() },
    });

    if (!post) {
      throw new DomainException({ code: 1, message: 'Post not found' });
    }

    return this.mapToView(post);
  }

  private async findPostsPaginated(
    query: GetPostsQueryParams,
    blogId?: string,
    userId?: string,
  ): Promise<PaginatedPostsDto> {
    const searchTerm = query.searchPostNameTerm?.trim() ?? '';
    const sortDirection = query.sortDirection.toUpperCase() as 'ASC' | 'DESC';
    const sortByMap: Record<string, string> = {
      createdAt: 'p.createdAt',
      title: 'p.title',
      blogName: 'p.blogName',
    };
    const orderByField = sortByMap[query.sortBy] ?? 'p.createdAt';

    const qb = this.repo
      .createQueryBuilder('p')
      .where('p.deleteAt IS NULL');

    if (blogId) {
      qb.andWhere('p.blogId = :blogId', { blogId });
    }

    if (searchTerm) {
      qb.andWhere('p.title ILIKE :search', { search: `%${searchTerm}%` });
    }

    const [posts, totalCount] = await qb
      .orderBy(orderByField, sortDirection)
      .skip(query.calculateSkip())
      .take(query.pageSize)
      .getManyAndCount();

    const items = await Promise.all(
      posts.map((post) => this.mapToViewWithLikes(post, userId)),
    );

    return new PaginatedPostsDto(
      Math.ceil(totalCount / query.pageSize) || 0,
      query.pageNumber,
      query.pageSize,
      totalCount,
      items,
    );
  }

  private async mapToViewWithLikes(
    post: PostsOrmEntity,
    userId?: string,
  ): Promise<PostViewDto> {
    const likesInfo = await this.getLikesInfoByPostId(post.id, userId);

    const newestLikes = [...likesInfo.newestLikes]
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
      post.id,
      post.title,
      post.shortDescription,
      post.content,
      post.blogId,
      post.blogName,
      post.createdAt,
      new ExtendedLikesInfoDto(
        likesInfo.likesCount,
        likesInfo.dislikesCount,
        userId ? likesInfo.userReaction : 'None',
        newestLikes,
      ),
    );
  }

  private mapToView(post: PostsOrmEntity): PostViewDto {
    return new PostViewDto(
      post.id,
      post.title,
      post.shortDescription,
      post.content,
      post.blogId,
      post.blogName,
      post.createdAt,
      new ExtendedLikesInfoDto(
        post.likesCount,
        post.dislikesCount,
        'None',
        [],
      ),
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
      likesCount: Number(countRows[0]?.likesCount ?? 0),
      dislikesCount: Number(countRows[0]?.dislikesCount ?? 0),
      userReaction,
      newestLikes: (newestRows as NewestLikeRow[]).map((row) => ({
        addedAt: new Date(row.addedAt),
        userId: row.userId,
        login: row.login,
      })),
    };
  }
}
