import request from 'supertest';
import { e2eApiPath } from '../../helpers/api-path';

export const PAIR_GAME_QUIZ_CONNECTION_PATH = e2eApiPath(
  'pair-game-quiz/pairs/connection',
);

type HttpServer = Parameters<typeof request>[0];

export function pairGameQuizApi(httpServer: HttpServer) {
  return {
    connectToPair: (accessToken: string) =>
      request(httpServer)
        .post(PAIR_GAME_QUIZ_CONNECTION_PATH)
        .set('Authorization', `Bearer ${accessToken}`),
  };
}
