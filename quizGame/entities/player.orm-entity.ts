import { BaseDBEntity } from 'src/core/database/base-db.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { GameOrmEntity } from './game.orm-entity';
import { UserOrmEntity } from './user.orm-entity';

@Entity('quiz_players')
export class PlayerOrmEntity extends BaseDBEntity {
    @Column({ type: 'uuid' })
    userId!: string;

    @ManyToOne(() => UserOrmEntity, (user) => user.players, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: UserOrmEntity;

    @ManyToOne(() => GameOrmEntity, (game) => game.players, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'gameId' })
    game!: GameOrmEntity;

    @Column({ type: 'uuid' })
    gameId!: string;
    score: number;

    answers: any[]
}