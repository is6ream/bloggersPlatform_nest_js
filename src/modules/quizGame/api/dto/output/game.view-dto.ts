import { GameOrmEntity } from '../../../entities/game.orm-entity';
import { PlayerOrmEntity } from '../../../entities/player.orm-entity';
import { QuestionOrmEntity } from '../../../entities/question.orm-entity';
import { AnswerOrmEntity } from '../../../entities/answer.orm-entity';
import { GameStatus } from '../../../types/game-status';
import { AnswerStatus } from '../../../types/answer-status';

/**
 * Ответ игрока на один вопрос в формате API.
 */
export class AnswerViewDto {
  questionId: string;
  answerStatus: AnswerStatus;
  addedAt: string;

  static mapToView(answer: AnswerOrmEntity): AnswerViewDto {
    const dto = new AnswerViewDto();

    dto.questionId = answer.questionId;
    dto.answerStatus = answer.status;
    dto.addedAt = answer.answerDate.toISOString();

    return dto;
  }
}

/**
 * Публичная информация об игроке для клиента.
 * Не отдаём внутренние поля PlayerOrmEntity (gameId, score и т.д.) —
 * только id пользователя и его login.
 *
 * Важно: при вызове mapToView связь player.user должна быть загружена,
 * иначе обращение к player.user.login упадёт с ошибкой.
 */
export class PlayerViewDto {
  id: string;
  login: string;

  static mapToView(player: PlayerOrmEntity): PlayerViewDto {
    const dto = new PlayerViewDto();

    // В API поле называется id, в БД это userId
    dto.id = player.userId;
    dto.login = player.user.login;

    return dto;
  }
}

/**
 * Прогресс одного игрока в игре — агрегат для API.
 * Соответствует объекту { answers, player, score } в спецификации квиза.
 */
export class PlayerProgressViewDto {
  answers: AnswerViewDto[];
  player: PlayerViewDto;
  score: number;

  static mapToView(player: PlayerOrmEntity): PlayerProgressViewDto {
    const dto = new PlayerProgressViewDto();

    // Каждый ответ из quiz_answers преобразуем в AnswerViewDto
    dto.answers = [...(player.answers ?? [])]
      .sort((a, b) => a.answerDate.getTime() - b.answerDate.getTime())
      .map((answer) => AnswerViewDto.mapToView(answer));
    dto.player = PlayerViewDto.mapToView(player);
    dto.score = player.score;

    return dto;
  }
}

/**
 * Вопрос в контексте игры — только id и текст.
 * correctAnswers, published и прочие поля намеренно скрыты,
 * чтобы игрок не видел правильные ответы во время игры.
 * Для админки используется отдельный QuestionViewDto.
 */
export class QuestionInGameViewDto {
  id: string;
  body: string;

  static mapToView(question: QuestionOrmEntity): QuestionInGameViewDto {
    const dto = new QuestionInGameViewDto();

    dto.id = question.id;
    dto.body = question.body;

    return dto;
  }
}

/**
 * Корневой DTO — полный ответ API при запросе текущей игры.
 * Собирает данные из GameOrmEntity и отдельно загруженных вопросов.
 */
export class GameViewDto {
  id: string;
  firstPlayerProgress: PlayerProgressViewDto;
  secondPlayerProgress: PlayerProgressViewDto | null;
  questions: QuestionInGameViewDto[] | null;
  status: GameStatus;
  pairCreatedDate: string;
  startGameDate: string | null;
  finishGameDate: string | null;

  static mapToView(game: GameOrmEntity): GameViewDto {
    const dto = new GameViewDto();

    dto.id = game.id;
    dto.status = game.gameStatus;
    dto.pairCreatedDate = game.pairCreatedDate;
    dto.startGameDate = game.startGameDate?.toISOString() ?? null;
    dto.finishGameDate = game.finishGameDate;

    dto.questions = game.gameQuestions?.length
      ? game.gameQuestions
        .sort((a, b) => a.index - b.index)
        .map((gq) => QuestionInGameViewDto.mapToView(gq.question))
      : null;

    dto.firstPlayerProgress = PlayerProgressViewDto.mapToView(game.firstPlayer!);
    dto.secondPlayerProgress = game.secondPlayer
      ? PlayerProgressViewDto.mapToView(game.secondPlayer)
      : null;

    return dto;
  }
}
