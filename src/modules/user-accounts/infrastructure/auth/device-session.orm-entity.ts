import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('device_sessions')
export class DeviceSessionOrmEntity {
  @PrimaryColumn({ type: 'text', name: 'device_id' })
  deviceId!: string;

  @Column({ type: 'text', name: 'user_id' })
  userId!: string;

  @Column({ type: 'text', nullable: true })
  ip!: string | null;

  @Column({ type: 'text', name: 'user_agent' })
  userAgent!: string;

  @Column({ type: 'text', name: 'refresh_token_hash' })
  refreshTokenHash!: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'expires_at', default: null })
  expiresAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'last_active_date', default: () => 'NOW()' })
  lastActiveDate!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
