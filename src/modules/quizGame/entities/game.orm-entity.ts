import { BaseDBEntity } from 'src/core/database/base-db.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { PlayerOrmEntity } from './player.orm-entity';

@Entity('quiz_games')
export class GameOrmEntity extends BaseDBEntity {
  @Column({ type: 'varchar' })
  status: string;

  @OneToMany(() => PlayerOrmEntity, (player) => player.game)
  players!: PlayerOrmEntity[];
}
