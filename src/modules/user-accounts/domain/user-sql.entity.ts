import { randomUUID } from 'crypto';
import { CreateUserDto, UpdateUserDto } from '../dto/UserInputDto';

export type UserEmailConfirmation = {
  confirmationCode: string;
  expirationDate: Date;
  isConfirmed: boolean;
};

export type UserPasswordRecovery = {
  code: string;
  isUsed: boolean;
  expiresAt: Date;
};

export class UserSqlEntity {
  readonly _id = { toString: () => this.id };

  private _isNewRecord: boolean;

  private constructor(
    public readonly id: string,
    public login: string,
    public email: string,
    public passwordHash: string,
    public emailConfirmation: UserEmailConfirmation,
    public passwordRecovery: UserPasswordRecovery | null,
    public createdAt: Date,
    public deleteAt: Date | null,
    public refreshTokenHash: string | null,
    isNewRecord: boolean,
  ) {
    this._isNewRecord = isNewRecord;
  }

  get isNewRecord(): boolean {
    return this._isNewRecord;
  }

  static createForInsert(dto: CreateUserDto): UserSqlEntity {
    return new UserSqlEntity(
      randomUUID(),
      dto.login,
      dto.email,
      dto.password,
      {
        confirmationCode: randomUUID(),
        expirationDate: new Date(Date.now() + 3 * 60 * 1000),
        isConfirmed: false,
      },
      null,
      new Date(),
      null,
      null,
      true,
    );
  }

  static fromRow(row: {
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
  }): UserSqlEntity {
    const passwordRecovery =
      row.recoveryCode != null &&
      row.recoveryExpiresAt != null &&
      row.recoveryIsUsed != null
        ? {
            code: row.recoveryCode,
            isUsed: row.recoveryIsUsed,
            expiresAt: new Date(row.recoveryExpiresAt),
          }
        : null;

    return new UserSqlEntity(
      row.id,
      row.login,
      row.email,
      row.passwordHash,
      {
        confirmationCode: row.confirmationCode,
        expirationDate: new Date(row.confirmationExpiration),
        isConfirmed: row.isEmailConfirmed,
      },
      passwordRecovery,
      new Date(row.createdAt),
      row.deleteAt ? new Date(row.deleteAt) : null,
      row.refreshTokenHash,
      false,
    );
  }

  update(dto: UpdateUserDto): void {
    if (dto.email !== this.email) {
      this.emailConfirmation.isConfirmed = false;
    }
    this.email = dto.email;
  }

  makeDeleted(): void {
    if (this.deleteAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deleteAt = new Date();
  }

  private generateRecoveryCode(): string {
    return randomUUID();
  }

  requestPasswordRecovery(): void {
    if (!this.emailConfirmation.isConfirmed) {
      return;
    }

    const recoveryCode = this.generateRecoveryCode();

    console.log( "recovery code check", recoveryCode)

    this.passwordRecovery = {
      code: recoveryCode,
      expiresAt: new Date(Date.now() + 3600000),
      isUsed: false,
    };
  }

  requestNewConfirmationCode(): void {
    if (this.emailConfirmation.isConfirmed) {
      throw new Error('Email already confirmed');
    }

    this.emailConfirmation.confirmationCode = this.generateRecoveryCode();
    this.emailConfirmation.expirationDate = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );
  }

  clearRecoveryCode(): void {
    this.passwordRecovery = null;
  }

  markPersisted(): void {
    this._isNewRecord = false;
  }
}
