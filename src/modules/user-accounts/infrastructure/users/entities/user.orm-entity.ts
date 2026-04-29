import { randomUUID } from 'crypto';
import { BaseDBEntity } from 'src/core/database/base-db.entity';
import { UpdateUserDto } from 'src/modules/user-accounts/dto/UserInputDto';
import { Column, Entity } from 'typeorm';

@Entity('users')
export class UserOrmEntity extends BaseDBEntity {
  @Column({ type: 'varchar', length: 255 })
  login!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'text' })
  passwordHash!: string;

  @Column({ type: 'text' })
  confirmationCode!: string;

  @Column({ type: 'timestamptz' })
  confirmationExpiration!: Date;

  @Column({ type: 'boolean', default: false })
  isEmailConfirmed!: boolean;

  @Column({ type: 'text', nullable: true, default: null })
  recoveryCode!: string | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  recoveryExpiresAt!: Date | null;

  @Column({ type: 'boolean', nullable: true, default: null })
  recoveryIsUsed!: boolean | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deleteAt!: Date | null;

  @Column({ type: 'text', nullable: true, default: null })
  refreshTokenHash!: string | null;

  makeDeleted(): void {
    if (this.deleteAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deleteAt = new Date();
  }

  update(dto: UpdateUserDto): void {
    this.email = dto.email;
  }

  static create(dto: { login: string; email: string; passwordHash: string }): UserOrmEntity {
    const user = new UserOrmEntity();
    user.id = randomUUID();
    user.login = dto.login;
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
    user.confirmationCode = randomUUID();
    user.confirmationExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.isEmailConfirmed = false;
    user.recoveryCode = null;
    user.recoveryExpiresAt = null;
    user.recoveryIsUsed = null;
    user.deleteAt = null;
    user.refreshTokenHash = null;

    return user;
  }
}