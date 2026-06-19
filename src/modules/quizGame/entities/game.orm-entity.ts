import { BaseDBEntity } from 'src/core/database/base-db.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { PlayerOrmEntity } from './player.orm-entity';
import { GameStatus } from '../types/game-status';
import { GameQuestion } from './game-question.orm-entity';

@Entity('quiz_games')
export class GameOrmEntity extends BaseDBEntity {
  @OneToOne(() => PlayerOrmEntity)
  @JoinColumn({ name: 'firstPlayerId' })
  firstPlayer!: PlayerOrmEntity | null;

  @OneToOne(() => PlayerOrmEntity)
  @JoinColumn({ name: 'secondPlayerId' })
  secondPlayer!: PlayerOrmEntity | null;

  @Column({ type: 'varchar' })
  gameStatus!: GameStatus;

  @Column()
  pairCreatedDate!: string;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  startGameDate!: Date | null;

  @Column({ type: 'varchar', nullable: true, default: null })
  finishGameDate!: string | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deleteAt!: Date | null;

  @OneToMany(() => GameQuestion, (gameQuestion) => gameQuestion.game)
  gameQuestions!: GameQuestion[];

  static create(): GameOrmEntity {
    const game = new GameOrmEntity();

    game.gameStatus = GameStatus.PendingSecondPlayer;
    game.pairCreatedDate = new Date().toISOString();
    game.startGameDate = null;
    game.finishGameDate = null;
    game.deleteAt = null;

    return game;
  }

  setFirstPlayer(player: PlayerOrmEntity): void {
    this.firstPlayer = player;
  }

  addSecondPlayer(player: PlayerOrmEntity): void {
    this.secondPlayer = player;
    this.gameStatus = GameStatus.Active;
    this.startGameDate = new Date();
  }

  finishGame(): void {
    this.gameStatus = GameStatus.Finished;
    this.finishGameDate = new Date().toISOString();
  }
}
