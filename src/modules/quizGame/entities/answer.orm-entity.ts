import { BaseDBEntity } from "src/core/database/base-db.entity";
import { Entity, Column } from "typeorm";
import { AnswerStatus } from "../types/answer-status";

@Entity('quiz_answers')
export class AnswerOrmEntity extends BaseDBEntity {
    @Column({ type: 'uuid' })
    questionId: string;

    @Column({ type: 'varchar' })
    body: string;

    @Column({ type: 'varchar', length: 10 })
    answerStatus!: AnswerStatus;

    @Column({ type: "date" })
    addedAt: Date
}