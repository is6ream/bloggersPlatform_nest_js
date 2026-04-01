import { randomUUID } from 'crypto';
import { CreateCommentDomainDto } from './types/create-comment.domain.dto';
export class CommentSqlEntity {
  readonly _id = { toString: () => this.id };

  private _isNewRecord: boolean;

  private constructor(
    public readonly id: string,
    public content: string,
    public commentatorInfo: { userId: string; userLogin: string },
    public deleteAt: Date | null,
    public createdAt: Date,
    public postId: string,
    public likesInfo: { likesCount: number; dislikesCount: number },
    isNewRecord: boolean,
  ) {
    this._isNewRecord = isNewRecord;
  }

  get isNewRecord(): boolean {
    return this._isNewRecord;
  }

  static createForInsert(dto: CreateCommentDomainDto): CommentSqlEntity {
    return new CommentSqlEntity(
      randomUUID(),
      dto.content,
      dto.commentatorInfo,
      null,
      new Date(),
      dto.postId,
      {
        likesCount: 0,
        dislikesCount: 0,
      },
      true,
    );
  }

  static fromRow(row: {
    id: string;
    content: string;
    commentatorUserId: string;
    commentatorUserLogin: string;
    deleteAt: Date | string | null;
    createdAt: Date | string;
    postId: string;
    likesCount: number;
    dislikesCount: number;
  }): CommentSqlEntity {
    return new CommentSqlEntity(
      row.id,
      row.content,
      {
        userId: row.commentatorUserId,
        userLogin: row.commentatorUserLogin,
      },
      row.deleteAt ? new Date(row.deleteAt) : null,
      new Date(row.createdAt),
      row.postId,
      {
        likesCount: Number(row.likesCount),
        dislikesCount: Number(row.dislikesCount),
      },
      false,
    );
  }

  makeDeleted(): void {
    if (this.deleteAt !== null) {
      throw new Error('Comment already deleted');
    }
    this.deleteAt = new Date();
  }

  updateLikeCounter(oldLikeStatus: string, newLikeStatus: string): void {
    if (oldLikeStatus === 'Like' && newLikeStatus === 'Dislike') {
      this.likesInfo.likesCount--;
      this.likesInfo.dislikesCount++;
    }
    if (oldLikeStatus === 'Like' && newLikeStatus === 'None') {
      this.likesInfo.likesCount--;
    }
    if (oldLikeStatus === 'Dislike' && newLikeStatus === 'Like') {
      this.likesInfo.likesCount++;
      this.likesInfo.dislikesCount--;
    }
    if (oldLikeStatus === 'Dislike' && newLikeStatus === 'None') {
      this.likesInfo.dislikesCount--;
    }
    if (oldLikeStatus === 'None' && newLikeStatus === 'Like') {
      this.likesInfo.likesCount++;
    }
    if (oldLikeStatus === 'None' && newLikeStatus === 'Dislike') {
      this.likesInfo.dislikesCount++;
    }
  }

  markPersisted(): void {
    this._isNewRecord = false;
  }
}

export { CommentSqlEntity as Comment };
