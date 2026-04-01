import { LikesRepository } from './../../likes/infrastructure/likes-repository';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommentSqlEntity } from '../domain/commentEntity';
import { GetCommentsQueryParams } from '../../posts/api/query/qet-comments-query-params';
import { CommentViewDto } from '../dto/commentViewDto';
import { PostRepository } from '../../posts/infrastructure/postRepository';
import { CommentPaginatedViewDto } from '../../posts/api/paginated/paginated.comment.view-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
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
export class CommentsQueryRepository {
  constructor(
    private readonly dataSource: DataSource,
    private postsRepository: PostRepository,
    private likesRepository: LikesRepository,
  ) {}

  private readonly commentsTableName = 'comments';
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

    this.commentsTableEnsured = true;
  }

  async findById(id: string): Promise<CommentSqlEntity | null> {
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
      FROM ${this.commentsTableName} c
      WHERE c.id = $1
        AND c."deleteAt" IS NULL
      LIMIT 1;
      `,
      [id],
    );

    const row = (rows as RawCommentRow[])[0];
    return row ? CommentSqlEntity.fromRow(row) : null;
  }

  async getByIdOrNotFoundFail(
    commentId: string,
    currentUserId?: string,
  ): Promise<CommentViewDto> {
    const comment = await this.findById(commentId);

    if (!comment) {
      throw new DomainException({ code: 1, message: 'Comment not found' });
    }

    const like = await this.likesRepository.findByUserIdAndCommentdId(
      commentId,
      currentUserId,
    );

    if (!like) {
      return {
        id: comment.id,
        content: comment.content,
        commentatorInfo: comment.commentatorInfo,
        createdAt: comment.createdAt,
        likesInfo: {
          likesCount: comment.likesInfo.likesCount,
          dislikesCount: comment.likesInfo.dislikesCount,
          myStatus: 'None',
        },
      };
    }

    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: comment.commentatorInfo,
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: comment.likesInfo.likesCount,
        dislikesCount: comment.likesInfo.dislikesCount,
        myStatus: like.status,
      },
    };
  }

  async getCommentByPostId(
    postId: string,
    query: GetCommentsQueryParams,
    userId?: string, // Делаем необязательным
  ): Promise<PaginatedViewDto<CommentViewDto>> {
    await this.ensureCommentsTable();
    const skip = query.calculateSkip();

    await this.postsRepository.checkPostExist(postId);

    const orderDir = query.sortDirection === 'asc' ? 'ASC' : 'DESC';
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
      FROM ${this.commentsTableName} c
      WHERE c."postId" = $1
        AND c."deleteAt" IS NULL
      ORDER BY c."createdAt" ${orderDir}
      LIMIT $2
      OFFSET $3;
      `,
      [postId, query.pageSize, skip],
    );

    const comments = (rows as RawCommentRow[]).map((row: RawCommentRow) =>
      CommentSqlEntity.fromRow(row),
    );
    if (!comments.length) {
      return CommentPaginatedViewDto.mapToView({
        items: [],
        page: query.pageNumber,
        size: query.pageSize,
        totalCount: 0,
      });
    }

    const countRows = await this.dataSource.query(
      `
      SELECT COUNT(*)::int AS count
      FROM ${this.commentsTableName} c
      WHERE c."postId" = $1
        AND c."deleteAt" IS NULL;
      `,
      [postId],
    );
    const totalCount = Number(countRows[0]?.count ?? 0);

    const items = await Promise.all(
      comments.map(async (comment: CommentSqlEntity) => {
        const like = userId
          ? await this.likesRepository.findByUserIdAndCommentdId(comment.id, userId)
          : null;

        return {
          id: comment.id,
          content: comment.content,
          commentatorInfo: {
            userId: comment.commentatorInfo.userId,
            userLogin: comment.commentatorInfo.userLogin,
          },
          createdAt: comment.createdAt,
          likesInfo: {
            likesCount: comment.likesInfo.likesCount,
            dislikesCount: comment.likesInfo.dislikesCount,
            myStatus: like?.status ?? 'None',
          },
        };
      }),
    );

    return CommentPaginatedViewDto.mapToView({
      items,
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
    });
  }
}
