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
import { loginAndGetAccessToken } from '../helpers/auth.helper';
import { pairGameQuizApi } from '../helpers/pair-game-quiz-api';
import { seedPublishedQuestions } from '../helpers/quiz-questions-setup.helper';

const TESTING_PATH = e2eApiPath('testing/all-data');

describe('QuizGame POST pairs/my-current/answers access right (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  let userAToken: string;
  let userBToken: string;

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
    const userALogin = `quiz_answers_a_${suffix}`;
    const userBLogin = `quiz_answers_b_${suffix}`;

    await createCustomTestUser({ login: userALogin, password: 'pass_a' });
    await createCustomTestUser({ login: userBLogin, password: 'pass_b' });

    userAToken = await loginAndGetAccessToken(app, userALogin, 'pass_a');
    userBToken = await loginAndGetAccessToken(app, userBLogin, 'pass_b');

    await seedPublishedQuestions(app.getHttpServer());
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('403 — если игрок уже ответил на все вопросы', async () => {
    const quizApi = pairGameQuizApi(app.getHttpServer());

    await quizApi.connectToPair(userAToken).expect(HttpStatus.OK);
    await quizApi.connectToPair(userBToken).expect(HttpStatus.OK);

    for (let i = 0; i < GAME_QUESTIONS_COUNT; i++) {
      await quizApi.sendAnswer(userAToken, 'answer').expect(HttpStatus.OK);
    }

    const res = await quizApi.sendAnswer(userAToken, 'answer');

    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });
});
