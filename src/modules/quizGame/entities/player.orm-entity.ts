import { randomUUID } from 'crypto';
import { BaseDBEntity } from 'src/core/database/base-db.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { GameOrmEntity } from './game.orm-entity';
import { PlayerAnswer } from '../types/player-answer';
import { UserOrmEntity } from 'src/modules/user-accounts/infrastructure/users/entities/user.orm-entity';

@Entity('quiz_players')
export class PlayerOrmEntity extends BaseDBEntity {
  @Column({ type: 'text' })
  userId!: string;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserOrmEntity;

  @ManyToOne(() => GameOrmEntity, (game) => game.players, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameId' })
  game!: GameOrmEntity;

  @Column({ type: 'uuid' })
  gameId!: string;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'jsonb', default: [] })
  answers: PlayerAnswer[];

  static create(dto: { userId: string; gameId: string }): PlayerOrmEntity {
    const player = new PlayerOrmEntity();

    player.id = randomUUID();
    player.userId = dto.userId;
    player.gameId = dto.gameId;
    player.score = 0;
    player.answers = [];

    return player;
  }
}
