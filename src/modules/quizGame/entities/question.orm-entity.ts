import { BaseDBEntity } from 'src/core/database/base-db.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { CreateQuestionInputDto } from '../api/dto/input/create-question.input.dto';
import { UpdateQuestionInputDto } from '../api/dto/input/update-question.input.dto';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';
import { GameQuestion } from './game-question.orm-entity';

@Entity('quiz_questions')
export class QuestionOrmEntity extends BaseDBEntity {
  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'jsonb' })
  correctAnswers!: string[];

  @Column({ type: 'boolean', default: false })
  published!: boolean;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  updatedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deleteAt!: Date | null;

  @OneToMany(() => GameQuestion, gameQuestion => gameQuestion.question)
  gameQuestions: GameQuestion[];

  makeDeleted(): void {
    if (this.deleteAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deleteAt = new Date();
  }

  update(dto: UpdateQuestionInputDto): void {
    this.body = dto.body;
    this.correctAnswers = dto.correctAnswers;
    this.updatedAt = new Date();
  }

  static create(dto: CreateQuestionInputDto): QuestionOrmEntity {
    const question = new QuestionOrmEntity();

    question.body = dto.body;
    question.correctAnswers = dto.correctAnswers;
    question.published = false;
    question.updatedAt = null;
    question.deleteAt = null;

    return question;
  }

  private hasValidCorrectAnswers(): boolean {
    if (!Array.isArray(this.correctAnswers)) return false;
    if (this.correctAnswers.length === 0) return false;

    return this.correctAnswers.some(
      (answer) => typeof answer === 'string' && answer.trim().length > 0
    )
  }

  changePublicationStatus(published: boolean): void {
    if (published && !this.hasValidCorrectAnswers()) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: "Question doesn't have correct answers"
      })
    }

    this.published = published;
  }

}
