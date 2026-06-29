import request from 'supertest';
import { e2eApiPath } from '../../helpers/api-path';

export const PAIR_GAME_QUIZ_CONNECTION_PATH = e2eApiPath(
  'pair-game-quiz/pairs/connection',
);

export const PAIR_GAME_QUIZ_MY_CURRENT_PATH = e2eApiPath(
  'pair-game-quiz/pairs/my-current',
);

export const PAIR_GAME_QUIZ_MY_PATH = e2eApiPath('pair-game-quiz/pairs/my');

export const PAIR_GAME_QUIZ_ANSWERS_PATH = e2eApiPath(
  'pair-game-quiz/pairs/my-current/answers',
);

export const PAIR_GAME_QUIZ_MY_STATISTIC_PATH = e2eApiPath(
  'pair-game-quiz/users/my-statistic',
);

export const pairGameByIdPath = (gameId: string) =>
  e2eApiPath(`pair-game-quiz/pairs/${gameId}`);

type HttpServer = Parameters<typeof request>[0];

export function pairGameQuizApi(httpServer: HttpServer) {
  return {
    connectToPair: (accessToken: string) =>
      request(httpServer)
        .post(PAIR_GAME_QUIZ_CONNECTION_PATH)
        .set('Authorization', `Bearer ${accessToken}`),

    getGameById: (accessToken: string, gameId: string) =>
      request(httpServer)
        .get(pairGameByIdPath(gameId))
        .set('Authorization', `Bearer ${accessToken}`),

    getMyCurrentGame: (accessToken: string) =>
      request(httpServer)
        .get(PAIR_GAME_QUIZ_MY_CURRENT_PATH)
        .set('Authorization', `Bearer ${accessToken}`),

    getMyGames: (accessToken: string, query?: Record<string, string | number>) =>
      request(httpServer)
        .get(PAIR_GAME_QUIZ_MY_PATH)
        .query(query ?? {})
        .set('Authorization', `Bearer ${accessToken}`),

    sendAnswer: (accessToken: string, answer: string) =>
      request(httpServer)
        .post(PAIR_GAME_QUIZ_ANSWERS_PATH)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ answer }),

    getMyStatistic: (accessToken: string) =>
      request(httpServer)
        .get(PAIR_GAME_QUIZ_MY_STATISTIC_PATH)
        .set('Authorization', `Bearer ${accessToken}`),
  };
}
