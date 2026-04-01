import { randomUUID } from 'crypto';
import { CreateLikeDto } from '../types/input/create-like.dto';

export class LikeSqlEntity {
  readonly _id = { toString: () => this.id };

  private _isNewRecord: boolean;

  private constructor(
    public readonly id: string,
    public status: string,
    public userId: string,
    public parentId: string,
    public parentType: string,
    public createdAt: Date,
    isNewRecord: boolean,
  ) {
    this._isNewRecord = isNewRecord;
  }

  get isNewRecord(): boolean {
    return this._isNewRecord;
  }

  static createForInsert(dto: CreateLikeDto): LikeSqlEntity {
    return new LikeSqlEntity(
      randomUUID(),
      dto.status,
      dto.userId,
      dto.parentId,
      dto.parentType,
      new Date(),
      true,
    );
  }

  static fromRow(row: {
    id: string;
    status: string;
    userId: string;
    parentId: string;
    parentType: string;
    createdAt: Date | string;
  }): LikeSqlEntity {
    return new LikeSqlEntity(
      row.id,
      row.status,
      row.userId,
      row.parentId,
      row.parentType,
      new Date(row.createdAt),
      false,
    );
  }

  updateStatus(status: string): void {
    this.status = status;
    this.createdAt = new Date();
  }

  markPersisted(): void {
    this._isNewRecord = false;
  }
}

export { LikeSqlEntity as Like };
