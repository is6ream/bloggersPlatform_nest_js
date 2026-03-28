import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';
import { UserSqlEntity } from '../../domain/user-sql.entity';
import { LoginOrEmailDto } from '../dto/login-or-email.dto';

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
export class UsersRawSqlRepository {
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

  private mapRow(row: RawUserRow): UserSqlEntity {
    return UserSqlEntity.fromRow(row);
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

  async findById(id: string): Promise<UserSqlEntity | null> {
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
    return row ? this.mapRow(row) : null;
  }

  async save(entity: UserSqlEntity): Promise<void> {
    await this.ensureUsersTable();
    const recoveryCode = entity.passwordRecovery?.code ?? null;
    const recoveryExpiresAt = entity.passwordRecovery?.expiresAt ?? null;
    const recoveryIsUsed = entity.passwordRecovery?.isUsed ?? null;

    if (entity.isNewRecord) {
      await this.dataSource.query(
        `
        INSERT INTO ${this.tableName} (
          id,
          login,
          email,
          "passwordHash",
          "confirmationCode",
          "confirmationExpiration",
          "isEmailConfirmed",
          "recoveryCode",
          "recoveryExpiresAt",
          "recoveryIsUsed",
          "createdAt",
          "deleteAt",
          "refreshTokenHash"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
        `,
        [
          entity.id,
          entity.login,
          entity.email,
          entity.passwordHash,
          entity.emailConfirmation.confirmationCode,
          entity.emailConfirmation.expirationDate,
          entity.emailConfirmation.isConfirmed,
          recoveryCode,
          recoveryExpiresAt,
          recoveryIsUsed,
          entity.createdAt,
          entity.deleteAt,
          entity.refreshTokenHash,
        ],
      );
      entity.markPersisted();
      return;
    }

    await this.dataSource.query(
      `
      UPDATE ${this.tableName}
      SET
        login = $2,
        email = $3,
        "passwordHash" = $4,
        "confirmationCode" = $5,
        "confirmationExpiration" = $6,
        "isEmailConfirmed" = $7,
        "recoveryCode" = $8,
        "recoveryExpiresAt" = $9,
        "recoveryIsUsed" = $10,
        "deleteAt" = $11,
        "refreshTokenHash" = $12
      WHERE id = $1;
      `,
      [
        entity.id,
        entity.login,
        entity.email,
        entity.passwordHash,
        entity.emailConfirmation.confirmationCode,
        entity.emailConfirmation.expirationDate,
        entity.emailConfirmation.isConfirmed,
        recoveryCode,
        recoveryExpiresAt,
        recoveryIsUsed,
        entity.deleteAt,
        entity.refreshTokenHash,
      ],
    );
  }

  async findOrNotFoundFail(id: string): Promise<UserSqlEntity> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
  }

  async findByIdOrThrowValidationError(id: string): Promise<UserSqlEntity> {
    const user = await this.findById(id);
    if (!user) {
      throw new DomainException({
        code: 2,
        message: 'User not found',
      });
    }
    return user;
  }

  async findOrThrowValidationErrorWithExtenstions(
    id: string,
  ): Promise<UserSqlEntity> {
    const user = await this.findById(id);
    if (!user) {
      throw new DomainException({
        code: 2,
        message: 'User not found',
        extensions: [{ message: 'User not found', field: 'userId' }],
      });
    }
    return user;
  }

  async findByLogin(login: string): Promise<UserSqlEntity | null> {
    await this.ensureUsersTable();
    const rows = await this.dataSource.query(
      `
      SELECT ${this.selectColumns}
      FROM ${this.tableName} u
      WHERE u.login = $1 AND u."deleteAt" IS NULL
      LIMIT 1;
      `,
      [login],
    );
    const row = (rows as RawUserRow[])[0];
    return row ? this.mapRow(row) : null;
  }

  async findUserByLoginOrEmail(
    loginOrEmail: LoginOrEmailDto,
  ): Promise<UserSqlEntity | null> {
    await this.ensureUsersTable();
    const rows = await this.dataSource.query(
      `
      SELECT ${this.selectColumns}
      FROM ${this.tableName} u
      WHERE u."deleteAt" IS NULL
        AND (u.login = $1 OR u.email = $2)
      LIMIT 1;
      `,
      [loginOrEmail.login, loginOrEmail.email],
    );
    const row = (rows as RawUserRow[])[0];
    return row ? this.mapRow(row) : null;
  }

  async findByEmail(email: string): Promise<UserSqlEntity | null> {
    await this.ensureUsersTable();
    const rows = await this.dataSource.query(
      `
      SELECT ${this.selectColumns}
      FROM ${this.tableName} u
      WHERE u.email = $1
      LIMIT 1;
      `,
      [email],
    );
    const row = (rows as RawUserRow[])[0];
    return row ? this.mapRow(row) : null;
  }

  async findByRecoveryCode(code: string): Promise<UserSqlEntity | null> {
    await this.ensureUsersTable();
    const rows = await this.dataSource.query(
      `
      SELECT ${this.selectColumns}
      FROM ${this.tableName} u
      WHERE u."recoveryCode" = $1
      LIMIT 1;
      `,
      [code],
    );
    const row = (rows as RawUserRow[])[0];
    return row ? this.mapRow(row) : null;
  }

  async findByConfirmationCode(code: string): Promise<UserSqlEntity | null> {
    await this.ensureUsersTable();
    const rows = await this.dataSource.query(
      `
      SELECT ${this.selectColumns}
      FROM ${this.tableName} u
      WHERE u."confirmationCode" = $1
      LIMIT 1;
      `,
      [code],
    );
    const row = (rows as RawUserRow[])[0];
    return row ? this.mapRow(row) : null;
  }

  async updateRefreshTokenHash(
    userId: string,
    refreshTokenHash: string,
  ): Promise<void> {
    await this.ensureUsersTable();
    const rows = await this.dataSource.query(
      `
      UPDATE ${this.tableName}
      SET "refreshTokenHash" = $2
      WHERE id = $1
      RETURNING id;
      `,
      [userId, refreshTokenHash],
    );
    if (!(rows as { id: string }[])[0]) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Refresh token hash does not match',
      });
    }
  }
}
