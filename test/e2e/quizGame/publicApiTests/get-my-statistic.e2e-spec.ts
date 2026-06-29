import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { GAME_QUESTIONS_COUNT } from 'src/modules/quizGame/constants/game-questions-count';
import { createCustomTestUser } from '../../../helpers/factory/custom-user.factory';
import { deleteAllE2eUsers } from '../../../helpers/factory/user-factory';
import { e2eApiPath } from '../../helpers/api-path';
import { createAccessTokenForUser } from '../helpers/auth.helper';
import {
  PAIR_GAME_QUIZ_MY_STATISTIC_PATH,
  pairGameQuizApi,
} from '../helpers/pair-game-quiz-api';
import { seedPublishedQuestions } from '../helpers/quiz-questions-setup.helper';

const TESTING_PATH = e2eApiPath('testing/all-data');

const CORRECT_ANSWER = 'A progressive Node.js framework';
const WRONG_ANSWER = 'wrong answer';

describe('QuizGame GET users/my-statistic (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

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

    const createdA = await createCustomTestUser({
      login: `quiz_stat_a_${suffix}`,
      password: 'pass_a',
    });
    const createdB = await createCustomTestUser({
      login: `quiz_stat_b_${suffix}`,
      password: 'pass_b',
    });
    const createdC = await createCustomTestUser({
      login: `quiz_stat_c_${suffix}`,
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

  describe('GET /pair-game-quiz/users/my-statistic', () => {
    it('401 — unauthorized без токена', async () => {
      await request(app.getHttpServer())
        .get(PAIR_GAME_QUIZ_MY_STATISTIC_PATH)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('401 — unauthorized с невалидным токеном', async () => {
      await request(app.getHttpServer())
        .get(PAIR_GAME_QUIZ_MY_STATISTIC_PATH)
        .set('Authorization', 'Bearer invalid.token.value')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('200 — нулевая статистика, если у пользователя нет завершённых игр', async () => {
      const res = await pairGameQuizApi(app.getHttpServer())
        .getMyStatistic(userCToken)
        .expect(HttpStatus.OK);

      expect(res.body).toEqual({
        sumScore: 0,
        avgScores: 0,
        gamesCount: 0,
        winsCount: 0,
        lossesCount: 0,
        drawsCount: 0,
      });
    });

    it('200 — корректная статистика после сыгранной игры', async () => {
      const quizApi = pairGameQuizApi(app.getHttpServer());

      await quizApi.connectToPair(userAToken).expect(HttpStatus.OK);
      await quizApi.connectToPair(userBToken).expect(HttpStatus.OK);

      // Игрок A отвечает на все вопросы правильно и финиширует первым.
      for (let i = 0; i < GAME_QUESTIONS_COUNT; i++) {
        await quizApi.sendAnswer(userAToken, CORRECT_ANSWER).expect(HttpStatus.OK);
      }

      // Игрок B отвечает на все вопросы неправильно и финиширует вторым.
      for (let i = 0; i < GAME_QUESTIONS_COUNT; i++) {
        await quizApi.sendAnswer(userBToken, WRONG_ANSWER).expect(HttpStatus.OK);
      }

      // A: 5 правильных + 1 бонус за первый финиш = 6, победа.
      const resA = await quizApi.getMyStatistic(userAToken).expect(HttpStatus.OK);
      expect(resA.body).toEqual({
        sumScore: 6,
        avgScores: 6,
        gamesCount: 1,
        winsCount: 1,
        lossesCount: 0,
        drawsCount: 0,
      });

      // B: 0 очков, поражение.
      const resB = await quizApi.getMyStatistic(userBToken).expect(HttpStatus.OK);
      expect(resB.body).toEqual({
        sumScore: 0,
        avgScores: 0,
        gamesCount: 1,
        winsCount: 0,
        lossesCount: 1,
        drawsCount: 0,
      });
    });
  });
});
