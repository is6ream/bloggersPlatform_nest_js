import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GetUsersQueryParams } from '../../api/dto/output/get-users-query-params.input.dto';
import { UserPaginatedViewDto } from '../../api/dto/output/paginatied.user.view-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { UserViewDto } from '../../api/dto/output/user.view-dto';
import { UserSqlEntity } from '../../domain/user-sql.entity';

type RawUserRow = {
  id: string;
  login: string;
  email: string;
  passwordHash: string;
  confirmationCode: string;
  confirmationExpiration: Date | string;
  isEmailConfirmed: boolean;
  recoveryCode: string | null;
  recoveryExpiresAt: Date | string | null;
  recoveryIsUsed: boolean | null;
  createdAt: Date | string;
  deleteAt: Date | string | null;
  refreshTokenHash: string | null;
};

@Injectable()
export class UsersRawSqlQueryRepository {
  constructor(private readonly dataSource: DataSource) {}

  private readonly tableName = 'users';

  private usersTableEnsured = false;

  private async ensureUsersTable(): Promise<void> {
    if (this.usersTableEnsured) {
      return;
    }
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        login VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "confirmationCode" TEXT NOT NULL,
        "confirmationExpiration" TIMESTAMPTZ NOT NULL,
        "isEmailConfirmed" BOOLEAN NOT NULL DEFAULT FALSE,
        "recoveryCode" TEXT NULL,
        "recoveryExpiresAt" TIMESTAMPTZ NULL,
        "recoveryIsUsed" BOOLEAN NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleteAt" TIMESTAMPTZ NULL,
        "refreshTokenHash" TEXT NULL
      );
    `);
    await this.dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_login_active_idx
      ON users (login) WHERE "deleteAt" IS NULL;
    `);
    await this.dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_active_idx
      ON users (email) WHERE "deleteAt" IS NULL;
    `);
    this.usersTableEnsured = true;
  }

  private selectColumns = `
    u.id,
    u.login,
    u.email,
    u."passwordHash",
    u."confirmationCode",
    u."confirmationExpiration",
    u."isEmailConfirmed",
    u."recoveryCode",
    u."recoveryExpiresAt",
    u."recoveryIsUsed",
    u."createdAt",
    u."deleteAt",
    u."refreshTokenHash"
  `;

  async getByIdOrNotFoundFail(id: string): Promise<UserViewDto> {
    await this.ensureUsersTable();
    const rows = await this.dataSource.query(
      `
      SELECT ${this.selectColumns}
      FROM ${this.tableName} u
      WHERE u.id = $1 AND u."deleteAt" IS NULL
      LIMIT 1;
      `,
      [id],
    );

    const row = (rows as RawUserRow[])[0];
    if (!row) {
      throw new NotFoundException('user not found!');
    }

    return UserViewDto.mapToView(UserSqlEntity.fromRow(row));
  }

  async getById(id: string): Promise<UserViewDto | null> {
    await this.ensureUsersTable();
    const rows = await this.dataSource.query(
      `
      SELECT ${this.selectColumns}
      FROM ${this.tableName} u
      WHERE u.id = $1 AND u."deleteAt" IS NULL
      LIMIT 1;
      `,
      [id],
    );

    const row = (rows as RawUserRow[])[0];
    if (!row) {
      return null;
    }

    return UserViewDto.mapToView(UserSqlEntity.fromRow(row));
  }

  async getAll(
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto>> {
    await this.ensureUsersTable();

    const skip = query.calculateSkip();
    const orderByExpr: Record<string, string> = {
      createdAt: 'u."createdAt"',
      login: 'u.login COLLATE "C"',
      email: 'u.email COLLATE "C"',
    };
    const orderBy = orderByExpr[query.sortBy] ?? 'u."createdAt"';
    const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC';

    const searchLogin = query.searchLoginTerm?.trim() ?? '';
    const searchEmail = query.searchEmailTerm?.trim() ?? '';

    const searchSql = `
      AND (
        ($1 = '' AND $2 = '')
        OR (($1 <> '') AND u.login ILIKE '%' || $1 || '%')
        OR (($2 <> '') AND u.email ILIKE '%' || $2 || '%')
      )
    `;

    const whereSql = `WHERE u."deleteAt" IS NULL ${searchSql}`;

    const [rows, countRows] = await Promise.all([
      this.dataSource.query(
        `
        SELECT ${this.selectColumns}
        FROM ${this.tableName} u
        ${whereSql}
        ORDER BY ${orderBy} ${sortDirection}
        LIMIT $3
        OFFSET $4;
        `,
        [searchLogin, searchEmail, query.pageSize, skip],
      ),
      this.dataSource.query(
        `
        SELECT COUNT(*)::int AS count
        FROM ${this.tableName} u
        ${whereSql};
        `,
        [searchLogin, searchEmail],
      ),
    ]);

    const totalCount = Number(countRows[0]?.count ?? 0);

    return UserPaginatedViewDto.mapToView({
      items: (rows as RawUserRow[]).map((row) =>
        UserViewDto.mapToView(UserSqlEntity.fromRow(row)),
      ),
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
    });
  }
}
