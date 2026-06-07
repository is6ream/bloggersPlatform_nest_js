import { ICommandHandler } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { CommandHandler } from "@nestjs/cqrs";
import { GameRepository } from "../../infrastructure/game/game.repository";
import { QuestionRepository } from "../../infrastructure/questions/question.repository";
import { DomainException } from "src/core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "src/core/exceptions/domain-exception-codes";
import { PlayerOrmEntity } from "../../entities/player.orm-entity";
import { GameOrmEntity } from "../../entities/game.orm-entity";
import { GAME_QUESTIONS_COUNT } from "../../constants/game-questions-count";

export class ConnectToPairCommand {
    constructor(
        public readonly userId: string
    ) { }
}

@Injectable()
@CommandHandler(ConnectToPairCommand)
export class ConnectToPairUseCase implements ICommandHandler<ConnectToPairCommand> {
    constructor(
        private readonly gameRepository: GameRepository,
        private readonly questionRepository: QuestionRepository,
    ) { }

    async execute(command: ConnectToPairCommand): Promise<string> {
        const unfinishedGame = await this.gameRepository.findActiveGameByUserId(command.userId);

        if (unfinishedGame) {
            throw new DomainException({
                code: DomainExceptionCode.Forbidden,
                message: 'Forbidden',
            });
        }

        const pendingGame = await this.gameRepository.findGamePendingSecondPlayer(command.userId);

        //если есть пользователь в ожидании - создаем игру, добавляем 5 
        //вопросов, записываем даты старта игры и дату создания пары
        if (pendingGame) {
            const player = PlayerOrmEntity.create({
                userId: command.userId,
                gameId: pendingGame.id,
            });

            const questions = await this.questionRepository.findRandomPublishedQuestions();
            if (questions.length < GAME_QUESTIONS_COUNT) {
                throw new DomainException({
                    code: DomainExceptionCode.BadRequest,
                    message: 'No questions in DB',
                });
            }

            pendingGame.activate(questions.map((question) => question.id));

            await this.gameRepository.savePlayer(player);
            await this.gameRepository.saveGame(pendingGame);

            return pendingGame.id;
        }

        const game = GameOrmEntity.create();
        const player = PlayerOrmEntity.create({
            userId: command.userId,
            gameId: game.id,
        });

        await this.gameRepository.saveGame(game);
        await this.gameRepository.savePlayer(player);

        return game.id;
    }
}