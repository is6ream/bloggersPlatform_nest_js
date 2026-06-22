import { DomainExceptionCode } from './../../../../core/exceptions/domain-exception-codes';
import { Injectable } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { GameRepository } from "../../infrastructure/game/game.repository";
import { DomainException } from "src/core/exceptions/domain-exceptions";
import { AnswerStatus } from '../../types/answer-status';
import { AnswerOrmEntity } from '../../entities/answer.orm-entity';
import { AnswerViewDto } from '../../api/dto/output/game.view-dto';
import { GAME_QUESTIONS_COUNT } from '../../constants/game-questions-count';

export class SendAnswerCommand {
    constructor(
        public userId: string,
        public answer: string
    ) { }
}

@Injectable()
@CommandHandler(SendAnswerCommand)
export class SendAnswerUsecase
    implements ICommandHandler<SendAnswerCommand> {
    constructor(
        private gameRepository: GameRepository
    ) { }

    async execute(command: SendAnswerCommand): Promise<AnswerViewDto> {
        // Шаг 0. Загружаем активную игру пользователя вместе с вопросами,
        // игроками и их ответами. Нет активной игры — отвечать нельзя.
        const game = await this.gameRepository.findActiveGameWithQuestionsByUserId(command.userId);

        if (!game) {
            throw new DomainException({
                code: DomainExceptionCode.Forbidden,
                message: 'Forbidden',
            });
        }

        // Шаг 1. Определяем текущего игрока и ищем его следующий
        // неотвеченный вопрос (по порядку index). Если такого нет —
        // игрок уже ответил на все вопросы, отвечать сверх лимита нельзя.
        const sortedQuestions = [...game.gameQuestions].sort((a, b) => a.index - b.index);

        const currentPlayer =
            game.firstPlayer!.userId === command.userId
                ? game.firstPlayer!
                : game.secondPlayer!;

        const answeredQuestionIds = new Set(
            (currentPlayer.answers ?? []).map((answer) => answer.questionId),
        );

        const nextGameQuestion = sortedQuestions.find(
            (gameQuestion) => !answeredQuestionIds.has(gameQuestion.questionId),
        );

        if (!nextGameQuestion) {
            throw new DomainException({
                code: DomainExceptionCode.Forbidden,
                message: 'Forbidden',
            });
        }

        // Шаг 2. Проверяем правильность ответа: точное совпадение строки
        // игрока с одним из допустимых правильных ответов вопроса.
        const question = nextGameQuestion.question;
        const isCorrect = question.correctAnswers.includes(command.answer);
        const answerStatus = isCorrect
            ? AnswerStatus.Correct
            : AnswerStatus.Incorrect;

        // Шаг 3. Создаём запись ответа (пока только в памяти).
        const answer = AnswerOrmEntity.create({
            questionId: nextGameQuestion.questionId,
            playerId: currentPlayer.id,
            status: answerStatus,
        });

        // Шаг 4. За правильный ответ начисляем игроку очко.
        if (isCorrect) {
            currentPlayer.addScore();
        }

        // Шаг 5. Проверяем, закончили ли оба игрока отвечать на все вопросы.
        const otherPlayer =
            currentPlayer.id === game.firstPlayer!.id
                ? game.secondPlayer!
                : game.firstPlayer!;

        // +1 — это ответ, который мы только что создали, но ещё не сохранили.
        const currentPlayerAnsweredCount = answeredQuestionIds.size + 1;
        const otherPlayerAnsweredCount = otherPlayer.answers?.length ?? 0;

        const bothPlayersFinished =
            currentPlayerAnsweredCount === GAME_QUESTIONS_COUNT &&
            otherPlayerAnsweredCount === GAME_QUESTIONS_COUNT;

        // Шаг 6. Если оба закончили — соперник финишировал первым (его
        // ответы были полными ещё до текущего): даём ему бонусное очко при
        // наличии хотя бы одного правильного ответа, завершаем игру и
        // сохраняем всё атомарно.
        if (bothPlayersFinished) {
            const otherPlayerHasCorrectAnswer = (otherPlayer.answers ?? []).some(
                (playerAnswer) => playerAnswer.status === AnswerStatus.Correct,
            );

            if (otherPlayerHasCorrectAnswer) {
                otherPlayer.addScore();
            }

            game.finishGame();

            const savedAnswer = await this.gameRepository.saveAnswerAndFinishGame(
                answer,
                currentPlayer,
                otherPlayer,
                game,
            );

            return AnswerViewDto.mapToView(savedAnswer);
        }

        // Шаг 7. Обычный ответ (игра продолжается): сохраняем ответ и
        // обновлённый счёт игрока, возвращаем результат наружу.
        const savedAnswer = await this.gameRepository.saveAnswerAndPlayer(
            answer,
            currentPlayer,
        );

        return AnswerViewDto.mapToView(savedAnswer);
    }


}