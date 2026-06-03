import { Controller } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { QuizGameQueryRepository } from "../../infrastructure/quiz-game-query.repository";

@Controller('pair-game-quiz')
export class QuizGameController {
    constructor(
        private commandBus: CommandBus,
        private quizGameQueryRepository: QuizGameQueryRepository,
    ) { }

    async getCurrentUnfinishedGame(

    ) { }
}