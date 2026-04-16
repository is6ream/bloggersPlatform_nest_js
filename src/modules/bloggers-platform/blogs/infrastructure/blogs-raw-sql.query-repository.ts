import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { GetBlogsQueryParams } from '../api/query/get-blogs-query-params';
import { BlogViewDto } from '../dto/output/blogViewDto';
import { BlogPaginatedViewDto } from '../api/paginated/paginated.blog.view-dto';
type RawBlogRow = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date | string;
  isMembership: boolean;
};

@Injectable()
export class BlogsRawSqlQueryRepository {
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

  private mapRowToView(row: RawBlogRow): BlogViewDto {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      websiteUrl: row.websiteUrl,
      createdAt: new Date(row.createdAt),
      isMembership: row.isMembership,
    };
  }

  async getByIdOrNotFoundFail(id: string): Promise<BlogViewDto> {
    const rows = await this.dataSource.query(
      `
      SELECT
        b.id,
        b.name,
        b.description,
        b."websiteUrl",
        b."createdAt",
        b."isMembership"
      FROM ${this.tableName} b
      WHERE b.id = $1
        AND b."deleteAt" IS NULL
      LIMIT 1;
      `,
      [id],
    );

    const blog = (rows as RawBlogRow[])[0];
    if (!blog) {
      throw new DomainException({ code: 1, message: 'Blog not found' });
    }

    return this.mapRowToView(blog);
  }

  async getAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto>> {
    await this.ensureBlogsTable();

    const skip = query.calculateSkip();
    const allowedSortFields: Record<string, string> = {
      createdAt: 'b."createdAt"',
      // Use deterministic byte-order collation for tests:
      // uppercase letters go before lowercase (Timma before timm).
      name: 'b.name COLLATE "C"',
      description: 'b.description',
      websiteUrl: 'b."websiteUrl"',
    };
    const sortBy = allowedSortFields[query.sortBy] ?? 'b."createdAt"';
    const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC';
    const searchTerm = query.searchNameTerm?.trim() ?? '';

    const whereSql = `
      WHERE b."deleteAt" IS NULL
      AND ($1 = '' OR b.name ILIKE '%' || $1 || '%')
    `;

    const [rows, countRows] = await Promise.all([
      this.dataSource.query(
        `
        SELECT
          b.id,
          b.name,
          b.description,
          b."websiteUrl",
          b."createdAt",
          b."isMembership"
        FROM ${this.tableName} b
        ${whereSql}
        ORDER BY ${sortBy} ${sortDirection}
        LIMIT $2
        OFFSET $3;
        `,
        [searchTerm, query.pageSize, skip],
      ),
      this.dataSource.query(
        `
        SELECT COUNT(*)::int AS count
        FROM ${this.tableName} b
        ${whereSql};
        `,
        [searchTerm],
      ),
    ]);

    const totalCount = Number(countRows[0]?.count ?? 0);

    const result = PaginatedViewDto.mapToView<BlogViewDto>({
      items: (rows as RawBlogRow[]).map((row: RawBlogRow) =>
        this.mapRowToView(row),
      ),
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
    });

    return result as BlogPaginatedViewDto;
  }
}
