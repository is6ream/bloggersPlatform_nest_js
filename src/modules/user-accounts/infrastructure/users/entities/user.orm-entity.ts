import { BaseDBEntity } from 'src/core/database/base-db.entity';
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
}