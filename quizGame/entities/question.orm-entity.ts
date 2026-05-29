import { BaseDBEntity } from 'src/core/database/base-db.entity';
import { Column, Entity } from 'typeorm';

@Entity('quiz_questions')
export class QuestionOrmEntity extends BaseDBEntity {
  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'varchar', length: 255 })
  answer!: string;

  @Column({ type: 'boolean', default: false })
  published!: boolean;
}
