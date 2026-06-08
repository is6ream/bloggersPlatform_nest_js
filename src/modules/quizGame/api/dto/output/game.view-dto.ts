import { GameOrmEntity } from '../../../entities/game.orm-entity';
import { PlayerOrmEntity } from '../../../entities/player.orm-entity';
import { QuestionOrmEntity } from '../../../entities/question.orm-entity';
import { GameStatus } from '../../../types/game-status';
import { AnswerStatus } from '../../../types/answer-status';
import { PlayerAnswer } from '../../../types/player-answer';

/**
 * Ответ игрока на один вопрос в формате API.
 * В БД хранится как элемент JSONB-массива `answers` у PlayerOrmEntity,
 * отдельной таблицы для ответов нет.
 */
export class AnswerViewDto {
  questionId: string;
  answerStatus: AnswerStatus;
  addedAt: string;

  static mapToView(answer: PlayerAnswer): AnswerViewDto {
    const dto = new AnswerViewDto();

    dto.questionId = answer.questionId;
    dto.answerStatus = answer.answerStatus;
    dto.addedAt = answer.addedAt;

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

    // Каждый ответ из JSONB-массива преобразуем в AnswerViewDto
    dto.answers = (player.answers ?? []).map((answer) =>
      AnswerViewDto.mapToView(answer),
    );
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
  questions: QuestionInGameViewDto[];
  status: GameStatus;
  pairCreatedDate: string;
  startGameDate: string | null;
  finishGameDate: string | null;

  static mapToView(
    game: GameOrmEntity,
    // В game хранятся только questionIds; сами вопросы подгружаются в query-repository
    questions: QuestionOrmEntity[],
  ): GameViewDto {
    const dto = new GameViewDto();

    // Копируем массив, чтобы не мутировать исходный game.players.
    // Сортируем по дате подключения: кто пришёл раньше — firstPlayer, кто позже — secondPlayer.
    const sortedPlayers = [...(game.players ?? [])].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    dto.id = game.id;
    dto.status = game.status;
    // Даты в API — ISO-строки, не объекты Date
    dto.pairCreatedDate = game.createdAt.toISOString();
    dto.startGameDate = game.startGameDate?.toISOString() ?? null;
    dto.finishGameDate = null; // TODO: заполнить, когда появится логика завершения игры

    // Map для быстрого поиска вопроса по id при сборке списка в порядке game.questionIds
    const questionsById = new Map(
      questions.map((question) => [question.id, question]),
    );

    // Сохраняем порядок вопросов из game.questionIds (а не порядок из запроса к БД)
    dto.questions = game.questionIds
      .map((id) => questionsById.get(id))
      .filter((question): question is QuestionOrmEntity => question !== undefined)
      .map((question) => QuestionInGameViewDto.mapToView(question));

    dto.firstPlayerProgress = PlayerProgressViewDto.mapToView(sortedPlayers[0]);
    // null, пока второй игрок ещё не подключился (статус PendingSecondPlayer)
    dto.secondPlayerProgress = sortedPlayers[1]
      ? PlayerProgressViewDto.mapToView(sortedPlayers[1])
      : null;

    return dto;
  }
}
