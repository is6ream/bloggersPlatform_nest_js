import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommentSqlEntity } from '../domain/commentEntity';
import { DomainException } from 'src/core/exceptions/domain-exceptions';

type RawCommentRow = {
  id: string;
  content: string;
  commentatorUserId: string;
  commentatorUserLogin: string;
  deleteAt: Date | string | null;
  createdAt: Date | string;
  postId: string;
  likesCount: number;
  dislikesCount: number;
};

@Injectable()
export class CommentsRepository {
  constructor(private readonly dataSource: DataSource) {}

  private readonly tableName = 'comments';

  private commentsTableEnsured = false;

  private async ensureCommentsTable(): Promise<void> {
    if (this.commentsTableEnsured) {
      return;
    }

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        content VARCHAR(300) NOT NULL,
        "commentatorUserId" TEXT NOT NULL,
        "commentatorUserLogin" VARCHAR(255) NOT NULL,
        "postId" TEXT NOT NULL,
        "deleteAt" TIMESTAMPTZ NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "likesCount" INTEGER NOT NULL DEFAULT 0,
        "dislikesCount" INTEGER NOT NULL DEFAULT 0
      );
    `);
    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS comments_post_idx
      ON comments ("postId");
    `);

    this.commentsTableEnsured = true;
  }

  async save(comment: CommentSqlEntity): Promise<void> {
    await this.ensureCommentsTable();

    if (comment.isNewRecord) {
      await this.dataSource.query(
        `
        INSERT INTO ${this.tableName} (
          id,
          content,
          "commentatorUserId",
          "commentatorUserLogin",
          "postId",
          "deleteAt",
          "createdAt",
          "likesCount",
          "dislikesCount"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `,
        [
          comment.id,
          comment.content,
          comment.commentatorInfo.userId,
          comment.commentatorInfo.userLogin,
          comment.postId,
          comment.deleteAt,
          comment.createdAt,
          comment.likesInfo.likesCount,
          comment.likesInfo.dislikesCount,
        ],
      );
      comment.markPersisted();
      return;
    }

    await this.dataSource.query(
      `
      UPDATE ${this.tableName}
      SET
        content = $2,
        "deleteAt" = $3,
        "likesCount" = $4,
        "dislikesCount" = $5
      WHERE id = $1;
      `,
      [
        comment.id,
        comment.content,
        comment.deleteAt,
        comment.likesInfo.likesCount,
        comment.likesInfo.dislikesCount,
      ],
    );
  }

  async findOrNotFoundFail(id: string): Promise<CommentSqlEntity> {
    await this.ensureCommentsTable();
    const rows = await this.dataSource.query(
      `
      SELECT
        c.id,
        c.content,
        c."commentatorUserId",
        c."commentatorUserLogin",
        c."deleteAt",
        c."createdAt",
        c."postId",
        c."likesCount",
        c."dislikesCount"
      FROM ${this.tableName} c
      WHERE c.id = $1
      LIMIT 1;
      `,
      [id],
    );

    const comment = (rows as RawCommentRow[])[0];
    if (!comment || comment.deleteAt !== null) {
      throw new DomainException({ code: 1, message: 'Comment not found' });
    }

    return CommentSqlEntity.fromRow(comment);
  }
}
