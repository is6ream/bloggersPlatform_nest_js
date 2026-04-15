import { randomUUID } from 'crypto';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { CreatePostDomainDto } from '../application/types/create-post-domain.dto';
import { UpdatePostDto } from './dto/input/updatePostDto';

export class PostSqlEntity {
  readonly _id = { toString: () => this.id };

  private _isNewRecord: boolean;

  private constructor(
    public readonly id: string,
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: string,
    public blogName: string,
    public deleteAt: Date | null,
    public createdAt: Date,
    public likesCount: number,
    public dislikesCount: number,
    isNewRecord: boolean,
  ) {
    this._isNewRecord = isNewRecord;
  }

  get isNewRecord(): boolean {
    return this._isNewRecord;
  }

  static createForInsert(dto: CreatePostDomainDto): PostSqlEntity {
    return new PostSqlEntity(
      randomUUID(),
      dto.title,
      dto.shortDescription,
      dto.content,
      dto.blogId,
      dto.blogName,
      null,
      new Date(),
      0,
      0,
      true,
    );
  }

  static fromRow(row: {
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
  }): PostSqlEntity {
    return new PostSqlEntity(
      row.id,
      row.title,
      row.shortDescription,
      row.content,
      row.blogId,
      row.blogName,
      row.deleteAt ? new Date(row.deleteAt) : null,
      new Date(row.createdAt),
      Number(row.likesCount),
      Number(row.dislikesCount),
      false,
    );
  }

  updatePost(dto: UpdatePostDto): void {
    this.title = dto.title;
    this.shortDescription = dto.shortDescription;
    this.content = dto.content;
  }

  makeDeleted(): void {
    if (this.deleteAt !== null) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }
    this.deleteAt = new Date();
  }

  updateLikeCounter(oldLikeStatus: string, newLikeStatus: string): void {
    if (oldLikeStatus === 'Like' && newLikeStatus === 'Dislike') {
      this.likesCount--;
      this.dislikesCount++;
    }
    if (oldLikeStatus === 'Like' && newLikeStatus === 'None') {
      this.likesCount--;
    }
    if (oldLikeStatus === 'Dislike' && newLikeStatus === 'Like') {
      this.likesCount++;
      this.dislikesCount--;
    }
    if (oldLikeStatus === 'Dislike' && newLikeStatus === 'None') {
      this.dislikesCount--;
    }
    if (oldLikeStatus === 'None' && newLikeStatus === 'Like') {
      this.likesCount++;
    }
    if (oldLikeStatus === 'None' && newLikeStatus === 'Dislike') {
      this.dislikesCount++;
    }
  }

  markPersisted(): void {
    this._isNewRecord = false;
  }
}
