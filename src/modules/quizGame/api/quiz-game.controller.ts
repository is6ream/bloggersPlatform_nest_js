import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { QuizGameRepository } from "../infrastructure/quiz-game.repository";
import { QuizGameQueryRepository } from "../infrastructure/quiz-game-query.repository";
import { BasicAuthGuard } from "src/modules/user-accounts/guards/basic/basic-auth.guard";


@Controller('sa/quiz')
export class QuizGameController {
    constructor(
        private quizGameRepository: QuizGameRepository,
        private quizGameQueryRepository: QuizGameQueryRepository,
        private commandBus: CommandBus,
    ) { }

    @UseGuards(BasicAuthGuard)
    @Get()
    async getAll(
        @Query() 
    )

}