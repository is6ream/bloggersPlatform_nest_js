import { BaseDBEntity } from 'src/core/database/base-db.entity';
import { Entity, OneToMany } from 'typeorm';
import { PlayerOrmEntity } from './player.orm-entity';

@Entity('quiz_users')
export class UserOrmEntity extends BaseDBEntity {
  @OneToMany(() => PlayerOrmEntity, (player) => player.user)
  players!: PlayerOrmEntity[];
}
