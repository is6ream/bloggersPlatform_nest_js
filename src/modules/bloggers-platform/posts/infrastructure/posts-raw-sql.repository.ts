import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { PostSqlEntity } from '../domain/post-sql.entity';

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

@Injectable()
export class PostsRawSqlRepository {
  constructor(private readonly dataSource: DataSource) {}

  private readonly tableName = 'posts';

  private postsTableEnsured = false;

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

  private isValidPostId(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }
    if (/^[a-f\d]{24}$/i.test(id)) {
      return true;
    }
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    );
  }

  async findById(id: string): Promise<PostSqlEntity | null> {
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
        AND p."deleteAt" IS NULL
      LIMIT 1;
      `,
      [id],
    );

    const row = (rows as RawPostRow[])[0];
    return row ? PostSqlEntity.fromRow(row) : null;
  }

  async findByIdIncludingDeleted(id: string): Promise<PostSqlEntity | null> {
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

    const row = (rows as RawPostRow[])[0];
    return row ? PostSqlEntity.fromRow(row) : null;
  }

  async save(post: PostSqlEntity): Promise<void> {
    await this.ensurePostsTable();
    if (post.isNewRecord) {
      await this.dataSource.query(
        `
        INSERT INTO ${this.tableName} (
          id,
          title,
          "shortDescription",
          content,
          "blogId",
          "blogName",
          "deleteAt",
          "createdAt",
          "likesCount",
          "dislikesCount"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
        `,
        [
          post.id,
          post.title,
          post.shortDescription,
          post.content,
          post.blogId,
          post.blogName,
          post.deleteAt,
          post.createdAt,
          post.likesCount,
          post.dislikesCount,
        ],
      );
      post.markPersisted();
      return;
    }

    await this.dataSource.query(
      `
      UPDATE ${this.tableName}
      SET
        title = $2,
        "shortDescription" = $3,
        content = $4,
        "blogName" = $5,
        "deleteAt" = $6,
        "likesCount" = $7,
        "dislikesCount" = $8
      WHERE id = $1;
      `,
      [
        post.id,
        post.title,
        post.shortDescription,
        post.content,
        post.blogName,
        post.deleteAt,
        post.likesCount,
        post.dislikesCount,
      ],
    );
  }

  async findOrNotFoundFail(id: string): Promise<PostSqlEntity> {
    const post = await this.findById(id);
    if (!post) {
      throw new DomainException({ code: 1, message: 'Post not found' });
    }
    return post;
  }

  async checkPostExist(id: string): Promise<void> {
    const post = await this.findById(id);
    if (!post) {
      throw new NotFoundException(`post with id: ${id} not found `);
    }
  }

  async findOrThrowValidationError(id: string): Promise<PostSqlEntity> {
    if (!this.isValidPostId(id)) {
      throw new DomainException({
        code: 3,
        message: 'Invalid post id format',
        extensions: [
          {
            message: 'Invalid post id format',
            field: 'postId',
          },
        ],
      });
    }

    const post = await this.findById(id);
    if (!post) {
      throw new DomainException({
        code: 2,
        message: 'Post not found',
        extensions: [
          {
            message: 'Post with specified id not found',
            field: 'postId',
          },
        ],
      });
    }

    return post;
  }
}
