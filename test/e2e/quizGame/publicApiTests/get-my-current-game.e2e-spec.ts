import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { createCustomTestUser } from '../../../helpers/factory/custom-user.factory';
import { deleteAllE2eUsers } from '../../../helpers/factory/user-factory';
import { e2eApiPath } from '../../helpers/api-path';
import { createAccessTokenForUser } from '../helpers/auth.helper';
import { expectGameViewShape } from '../helpers/game-view-expectations.helper';
import {
  PAIR_GAME_QUIZ_MY_CURRENT_PATH,
  pairGameQuizApi,
} from '../helpers/pair-game-quiz-api';
import { seedPublishedQuestions } from '../helpers/quiz-questions-setup.helper';

const TESTING_PATH = e2eApiPath('testing/all-data');

describe('QuizGame GET pairs/my-current (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  let userALogin: string;
  let userBLogin: string;
  let userAToken: string;
  let userBToken: string;
  let userCToken: string;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();
  });

  beforeEach(async () => {
    await request(app.getHttpServer()).delete(TESTING_PATH).expect(204);
    await deleteAllE2eUsers();

    const suffix = randomUUID().slice(0, 8);
    userALogin = `quiz_my_current_a_${suffix}`;
    userBLogin = `quiz_my_current_b_${suffix}`;

    const createdA = await createCustomTestUser({
      login: userALogin,
      password: 'pass_a',
    });
    const createdB = await createCustomTestUser({
      login: userBLogin,
      password: 'pass_b',
    });
    const createdC = await createCustomTestUser({
      login: `quiz_my_current_c_${suffix}`,
      password: 'pass_c',
    });

    userAToken = await createAccessTokenForUser(app, createdA.user.id);
    userBToken = await createAccessTokenForUser(app, createdB.user.id);
    userCToken = await createAccessTokenForUser(app, createdC.user.id);

    await seedPublishedQuestions(app.getHttpServer());
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /pair-game-quiz/pairs/my-current', () => {
    it('401 — unauthorized', async () => {
      await request(app.getHttpServer())
        .get(PAIR_GAME_QUIZ_MY_CURRENT_PATH)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('404 — у текущего пользователя нет незавершённой игры', async () => {
      await pairGameQuizApi(app.getHttpServer())
        .getMyCurrentGame(userCToken)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('200 — возвращает текущую незавершённую игру пользователя', async () => {
      const quizApi = pairGameQuizApi(app.getHttpServer());

      const userAResponse = await quizApi.connectToPair(userAToken).expect(HttpStatus.OK);
      const gameId = userAResponse.body.id as string;

      await quizApi.connectToPair(userBToken).expect(HttpStatus.OK);

      const res = await quizApi.getMyCurrentGame(userAToken).expect(HttpStatus.OK);

      expectGameViewShape(res.body);
      expect(res.body).toMatchObject({
        id: gameId,
        status: 'Active',
        firstPlayerProgress: {
          player: { login: userALogin },
          score: 0,
          answers: [],
        },
        secondPlayerProgress: {
          player: { login: userBLogin },
          score: 0,
          answers: [],
        },
        finishGameDate: null,
      });
      expect(res.body.questions).toHaveLength(5);
    });
  });
});
