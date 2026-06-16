import { BaseDBEntity } from 'src/core/database/base-db.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { PlayerOrmEntity } from './player.orm-entity';
import { GameStatus } from '../types/game-status';

@Entity('quiz_games')
export class GameOrmEntity extends BaseDBEntity {
  @Column({ type: 'varchar' })
  status: GameStatus;

  @Column({ type: 'jsonb', default: [] })
  questionIds!: string[];

  @OneToMany(() => PlayerOrmEntity, (player) => player.game)
  players!: PlayerOrmEntity[];

  @Column({ type: 'timestamptz', nullable: true, default: null })
  startGameDate!: Date | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deleteAt!: Date | null;

  static create(): GameOrmEntity {
    const game = new GameOrmEntity();

    game.status = GameStatus.PendingSecondPlayer;
    game.questionIds = [];
    game.startGameDate = null;
    game.deleteAt = null;

    return game;
  }

  activate(questionIds: string[]): void {
    this.status = GameStatus.Active;
    this.questionIds = questionIds;
    this.startGameDate = new Date();
  }
}
