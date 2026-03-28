import { randomUUID } from 'crypto';
import { CreateBlogDto } from '../dto/input/createBlogDto';
import { UpdateBlogDto } from '../dto/input/updateBlogDto';
import { BlogViewDto } from '../dto/output/blogViewDto';

export class BlogSqlEntity {
  readonly _id = { toString: () => this.id };

  private _isNewRecord: boolean;

  private constructor(
    public readonly id: string,
    public name: string,
    public description: string,
    public websiteUrl: string,
    public createdAt: Date,
    public isMembership: boolean,
    public deleteAt: Date | null,
    isNewRecord: boolean,
  ) {
    this._isNewRecord = isNewRecord;
  }

  get isNewRecord(): boolean {
    return this._isNewRecord;
  }

  static createForInsert(dto: CreateBlogDto): BlogSqlEntity {
    return new BlogSqlEntity(
      randomUUID(),
      dto.name,
      dto.description,
      dto.websiteUrl,
      new Date(),
      false,
      null,
      true,
    );
  }

  static fromRow(row: {
    id: string;
    name: string;
    description: string;
    websiteUrl: string;
    createdAt: Date | string;
    isMembership: boolean;
    deleteAt: Date | string | null;
  }): BlogSqlEntity {
    return new BlogSqlEntity(
      row.id,
      row.name,
      row.description,
      row.websiteUrl,
      new Date(row.createdAt),
      row.isMembership,
      row.deleteAt ? new Date(row.deleteAt) : null,
      false,
    );
  }

  updateBlog(dto: UpdateBlogDto): void {
    this.name = dto.name;
    this.description = dto.description;
    this.websiteUrl = dto.websiteUrl;
  }

  makeDeleted(): void {
    if (this.deleteAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deleteAt = new Date();
  }

  toViewModel(id: string): BlogViewDto {
    return {
      id,
      name: this.name,
      description: this.description,
      websiteUrl: this.websiteUrl,
      createdAt: this.createdAt,
      isMembership: this.isMembership,
    };
  }

  markPersisted(): void {
    this._isNewRecord = false;
  }
}
