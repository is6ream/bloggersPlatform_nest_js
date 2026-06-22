import { BaseDBEntity } from 'src/core/database/base-db.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { GameOrmEntity } from './game.orm-entity';
import { UserOrmEntity } from 'src/modules/user-accounts/infrastructure/users/entities/user.orm-entity';
import { AnswerOrmEntity } from './answer.orm-entity';

@Entity('quiz_players')
export class PlayerOrmEntity extends BaseDBEntity {
  @Column({ type: 'text' })
  userId!: string;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserOrmEntity;

  @ManyToOne(() => GameOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameId' })
  game!: GameOrmEntity;

  @Column({ type: 'uuid' })
  gameId!: string;

  @Column({ type: 'int' })
  score: number;

  @OneToMany(() => AnswerOrmEntity, (answer) => answer.player)
  answers!: AnswerOrmEntity[];


  static create(dto: { userId: string; gameId: string }): PlayerOrmEntity {
    const player = new PlayerOrmEntity();

    player.userId = dto.userId;
    player.gameId = dto.gameId;
    player.score = 0;
    player.answers = [];

    return player;
  }

  addScore(points: number = 1): void {
    this.score += points;
  }
}
