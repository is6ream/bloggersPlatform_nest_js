import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { GameOrmEntity as Game } from './game.orm-entity';
import { QuestionOrmEntity as Question } from './question.orm-entity';

@Entity()
export class GameQuestion {
  @PrimaryGeneratedColumn()
  gameQuestionId!: number;

  @Column({ type: 'uuid' })
  questionId!: string;

  @Column({ type: 'uuid' })
  gameId!: string;

  @Column({ type: 'int' })
  index!: number;

  @ManyToOne(() => Game, (game) => game.gameQuestions)
  @JoinColumn({ name: 'gameId' })
  game!: Game;

  @ManyToOne(() => Question, (question) => question.gameQuestions)
  @JoinColumn({ name: 'questionId' })
  question!: Question;

  static create(questionId: string, gameId: string, index: number): GameQuestion {
    const gameQuestion = new this();

    gameQuestion.questionId = questionId;
    gameQuestion.gameId = gameId;
    gameQuestion.index = index;

    return gameQuestion;
  }
}
