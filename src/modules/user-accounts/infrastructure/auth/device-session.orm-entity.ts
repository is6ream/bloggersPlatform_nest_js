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

  @Column({ type: "text", name: "iat" })
  iat!: Date
}
