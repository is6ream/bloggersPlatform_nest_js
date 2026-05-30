import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GameOrmEntity } from "quizGame/entities/game.orm-entity";
import { PlayerOrmEntity } from "quizGame/entities/player.orm-entity";
import { QuestionOrmEntity } from "quizGame/entities/question.orm-entity";
import { UserOrmEntity } from "quizGame/entities/user.orm-entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([GameOrmEntity, PlayerOrmEntity, QuestionOrmEntity, UserOrmEntity])
    ]
})
export class QuizGameModule { }