import { BaseDBEntity } from 'src/core/database/base-db.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { PlayerOrmEntity } from './player.orm-entity';
import { GameStatus } from '../types/game-status';

@Entity('quiz_games')
export class GameOrmEntity extends BaseDBEntity {
  @Column({ type: 'varchar' })
  status: GameStatus;

  @OneToMany(() => PlayerOrmEntity, (player) => player.game)
  players!: PlayerOrmEntity[];
}
