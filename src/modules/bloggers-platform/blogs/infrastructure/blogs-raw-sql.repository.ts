import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { BlogSqlEntity } from '../domain/blog-sql.entity';

type RawBlogRow = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date | string;
  isMembership: boolean;
  deleteAt: Date | string | null;
};

@Injectable()
export class BlogsRawSqlRepository {
  constructor(private readonly dataSource: DataSource) {}

  private readonly tableName = 'blogs';

  private blogsTableEnsured = false;

  private async ensureBlogsTable(): Promise<void> {
    if (this.blogsTableEnsured) {
      return;
    }
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id TEXT PRIMARY KEY,
        name VARCHAR(15) NOT NULL,
        description VARCHAR(500) NOT NULL,
        "websiteUrl" VARCHAR(100) NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "isMembership" BOOLEAN NOT NULL DEFAULT FALSE,
        "deleteAt" TIMESTAMPTZ NULL
      );
    `);
    this.blogsTableEnsured = true;
  }

  private isValidBlogId(id: string): boolean {
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

  async findById(id: string): Promise<BlogSqlEntity | null> {
    await this.ensureBlogsTable();
    const rows = await this.dataSource.query(
      `
      SELECT
        b.id,
        b.name,
        b.description,
        b."websiteUrl",
        b."createdAt",
        b."isMembership",
        b."deleteAt"
      FROM ${this.tableName} b
      WHERE b.id = $1
        AND b."deleteAt" IS NULL
      LIMIT 1;
      `,
      [id],
    );

    const row = (rows as RawBlogRow[])[0];
    return row ? BlogSqlEntity.fromRow(row) : null;
  }

  async save(entity: BlogSqlEntity): Promise<void> {
    await this.ensureBlogsTable();
    if (entity.isNewRecord) {
      await this.dataSource.query(
        `
        INSERT INTO ${this.tableName} (
          id,
          name,
          description,
          "websiteUrl",
          "createdAt",
          "isMembership",
          "deleteAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7);
        `,
        [
          entity.id,
          entity.name,
          entity.description,
          entity.websiteUrl,
          entity.createdAt,
          entity.isMembership,
          entity.deleteAt,
        ],
      );
      entity.markPersisted();
      return;
    }

    await this.dataSource.query(
      `
      UPDATE ${this.tableName}
      SET
        name = $2,
        description = $3,
        "websiteUrl" = $4,
        "isMembership" = $5,
        "deleteAt" = $6
      WHERE id = $1;
      `,
      [
        entity.id,
        entity.name,
        entity.description,
        entity.websiteUrl,
        entity.isMembership,
        entity.deleteAt,
      ],
    );
  }

  async findOrNotFoundFail(id: string): Promise<BlogSqlEntity> {
    const blog = await this.findById(id);
    if (!blog) {
      throw new DomainException({ code: 1, message: 'Blog not found' });
    }
    return blog;
  }

  async findByIdOrThrowValidationError(id: string): Promise<BlogSqlEntity> {
    if (!this.isValidBlogId(id)) {
      throw new DomainException({
        code: 3,
        message: 'Invalid blog id format',
        extensions: [
          {
            message: 'Invalid blog id format',
            field: 'blogId',
          },
        ],
      });
    }

    const blog = await this.findById(id);
    if (!blog) {
      throw new DomainException({
        code: 2,
        message: 'Blog not found',
        extensions: [
          {
            message: 'Blog with specified id not found',
            field: 'blogId',
          },
        ],
      });
    }

    return blog;
  }

  async checkBlogExist(id: string): Promise<void> {
    await this.findOrNotFoundFail(id);
  }
}
