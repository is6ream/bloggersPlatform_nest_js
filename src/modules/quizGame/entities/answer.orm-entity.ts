import { BaseDBEntity } from "src/core/database/base-db.entity";
import { Column, Entity, ManyToOne, JoinColumn } from "typeorm";
import { PlayerOrmEntity } from "./player.orm-entity";
import { QuestionOrmEntity } from "./question.orm-entity";
import { AnswerStatus } from "../types/answer-status";

@Entity('quiz_answers')
export class AnswerOrmEntity extends BaseDBEntity {
    @Column({ type: 'uuid' })
    questionId!: string;

    @ManyToOne(() => QuestionOrmEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'questionId' })
    question!: QuestionOrmEntity;

    @Column({ type: 'uuid' })
    playerId!: string;

    @ManyToOne(() => PlayerOrmEntity, (player) => player.answers, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'playerId' })
    player!: PlayerOrmEntity;

    @Column({ type: 'timestamptz' })
    answerDate!: Date;

    @Column({ type: 'varchar' })
    status!: AnswerStatus; 
}