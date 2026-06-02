import { BaseDBEntity } from 'src/core/database/base-db.entity';
import { Column, Entity, UpdateDateColumn } from 'typeorm';
import { CreateQuestionInputDto } from '../api/dto/input/create-question.input.dto';
import { UpdateQuestionInputDto } from '../api/dto/input/update-question.input.dto';
import { randomUUID } from 'crypto';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';

@Entity('quiz_questions')
export class QuestionOrmEntity extends BaseDBEntity {
  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'jsonb' })
  correctAnswers!: string[];

  @Column({ type: 'boolean', default: false })
  published!: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deleteAt!: Date | null;

  makeDeleted(): void {
    if (this.deleteAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deleteAt = new Date();
  }

  update(dto: UpdateQuestionInputDto): void {
    this.body = dto.body;
    this.correctAnswers = dto.correctAnswers;
  }

  static create(dto: CreateQuestionInputDto): QuestionOrmEntity {
    const question = new QuestionOrmEntity();

    question.id = randomUUID();
    question.body = dto.body;
    question.correctAnswers = dto.correctAnswers;
    question.published = false;
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
