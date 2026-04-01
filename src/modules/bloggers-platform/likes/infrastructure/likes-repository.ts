import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LikeSqlEntity } from '../domain/like-entity';

type RawLikeRow = {
  id: string;
  status: string;
  userId: string;
  parentId: string;
  parentType: string;
  createdAt: Date | string;
};

@Injectable()
export class LikesRepository {
  constructor(private readonly dataSource: DataSource) {}

  private readonly tableName = 'likes';

  private likesTableEnsured = false;

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

  async save(like: LikeSqlEntity): Promise<void> {
    await this.ensureLikesTable();

    if (like.isNewRecord) {
      await this.dataSource.query(
        `
        INSERT INTO ${this.tableName} (
          id,
          status,
          "userId",
          "parentId",
          "parentType",
          "createdAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6);
        `,
        [
          like.id,
          like.status,
          like.userId,
          like.parentId,
          like.parentType,
          like.createdAt,
        ],
      );
      like.markPersisted();
      return;
    }

    await this.dataSource.query(
      `
      UPDATE ${this.tableName}
      SET
        status = $2,
        "createdAt" = $3
      WHERE id = $1;
      `,
      [like.id, like.status, like.createdAt],
    );
  }

  async findByUserAndParent(
    userId: string,
    parentId: string,
    parentType: 'Post' | 'Comment',
  ): Promise<LikeSqlEntity | null> {
    await this.ensureLikesTable();
    const rows = await this.dataSource.query(
      `
      SELECT
        l.id,
        l.status,
        l."userId",
        l."parentId",
        l."parentType",
        l."createdAt"
      FROM ${this.tableName} l
      WHERE l."userId" = $1
        AND l."parentId" = $2
        AND l."parentType" = $3
      LIMIT 1;
      `,
      [userId, parentId, parentType],
    );

    const row = (rows as RawLikeRow[])[0];
    return row ? LikeSqlEntity.fromRow(row) : null;
  }

  async findByUserIdAndCommentdId(
    commentId: string,
    userId?: string,
  ): Promise<LikeSqlEntity | null> {
    if (!userId) {
      return null;
    }
    return this.findByUserAndParent(userId, commentId, 'Comment');
  }
}
