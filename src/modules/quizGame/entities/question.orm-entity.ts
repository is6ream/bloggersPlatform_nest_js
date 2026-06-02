import { BaseDBEntity } from 'src/core/database/base-db.entity';
import { Column, Entity, UpdateDateColumn } from 'typeorm';
import { CreateQuestionInputDto } from '../api/dto/input/create-question.input.dto';
import { randomUUID } from 'crypto';

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

  static create(dto: CreateQuestionInputDto): QuestionOrmEntity {
    const question = new QuestionOrmEntity();

    question.id = randomUUID();
    question.body = dto.body;
    question.correctAnswers = dto.correctAnswers;
    question.published = false;

    return question;
  }
}
