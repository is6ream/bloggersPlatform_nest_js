import { CreateDateColumn, PrimaryColumn } from 'typeorm';

export abstract class BaseDBEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
