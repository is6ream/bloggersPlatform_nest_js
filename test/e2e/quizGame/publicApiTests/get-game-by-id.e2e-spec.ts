import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { AnswerStatus } from 'src/modules/quizGame/types/answer-status';
import { createCustomTestUser } from '../../../helpers/factory/custom-user.factory';
import { deleteAllE2eUsers } from '../../../helpers/factory/user-factory';
import { e2eApiPath } from '../../helpers/api-path';
import { createAccessTokenForUser } from '../helpers/auth.helper';
import { expectGameViewShape } from '../helpers/game-view-expectations.helper';
import { pairGameByIdPath, pairGameQuizApi } from '../helpers/pair-game-quiz-api';
import { updatePlayerAnswers } from '../helpers/quiz-game-db.helper';
import { seedPublishedQuestions } from '../helpers/quiz-questions-setup.helper';

const TESTING_PATH = e2eApiPath('testing/all-data');
const NON_EXISTENT_GAME_ID = '00000000-0000-4000-8000-000000000099';
const INVALID_GAME_ID = 'not-a-valid-uuid';

describe('QuizGame GET pairs/:id (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let dataSource: DataSource;

  let userAId: string;
  let userBId: string;
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

    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await request(app.getHttpServer()).delete(TESTING_PATH).expect(204);
    await deleteAllE2eUsers();

    const suffix = randomUUID().slice(0, 8);
    userALogin = `quiz_get_a_${suffix}`;
    userBLogin = `quiz_get_b_${suffix}`;

    const createdA = await createCustomTestUser({
      login: userALogin,
      password: 'pass_a',
    });
    const createdB = await createCustomTestUser({
      login: userBLogin,
      password: 'pass_b',
    });
    const createdC = await createCustomTestUser({
      login: `quiz_get_c_${suffix}`,
      password: 'pass_c',
    });

    userAId = createdA.user.id;
    userBId = createdB.user.id;

    userAToken = await createAccessTokenForUser(app, userAId);
    userBToken = await createAccessTokenForUser(app, userBId);
    userCToken = await createAccessTokenForUser(app, createdC.user.id);

    await seedPublishedQuestions(app.getHttpServer());
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /pair-game-quiz/pairs/:id', () => {
    it('401 — unauthorized', async () => {
      await request(app.getHttpServer())
        .get(pairGameByIdPath(NON_EXISTENT_GAME_ID))
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('400 — id в некорректном формате', async () => {
      const res = await pairGameQuizApi(app.getHttpServer())
        .getGameById(userAToken, INVALID_GAME_ID)
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body).toMatchObject({
        message: expect.stringContaining('uuid'),
        statusCode: HttpStatus.BAD_REQUEST,
      });
    });

    it('404 — игра не существует', async () => {
      await pairGameQuizApi(app.getHttpServer())
        .getGameById(userAToken, NON_EXISTENT_GAME_ID)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('403 — текущий игрок не участвует в игре', async () => {
      const quizApi = pairGameQuizApi(app.getHttpServer());

      const createRes = await quizApi.connectToPair(userAToken).expect(HttpStatus.OK);
      const gameId = createRes.body.id as string;

      await quizApi.getGameById(userCToken, gameId).expect(HttpStatus.FORBIDDEN);
    });

    it('200 — игра возвращена в формате GameViewDto', async () => {
      const quizApi = pairGameQuizApi(app.getHttpServer());

      const userAResponse = await quizApi.connectToPair(userAToken).expect(HttpStatus.OK);
      const gameId = userAResponse.body.id as string;

      await quizApi.connectToPair(userBToken).expect(HttpStatus.OK);

      const activeGame = await quizApi.getGameById(userAToken, gameId).expect(HttpStatus.OK);
      const questionId = activeGame.body.questions[0].id as string;
      const addedAt = new Date().toISOString();

      const answer = {
        questionId,
        answerStatus: AnswerStatus.Correct,
        addedAt,
      };

      await updatePlayerAnswers(dataSource, {
        gameId,
        userId: userAId,
        answers: [answer],
        score: 1,
      });
      await updatePlayerAnswers(dataSource, {
        gameId,
        userId: userBId,
        answers: [answer],
        score: 1,
      });

      const res = await quizApi.getGameById(userAToken, gameId).expect(HttpStatus.OK);

      expectGameViewShape(res.body);
      expect(res.body).toMatchObject({
        id: gameId,
        status: 'Active',
        firstPlayerProgress: {
          answers: [answer],
          player: { id: userAId, login: userALogin },
          score: 1,
        },
        secondPlayerProgress: {
          answers: [answer],
          player: { id: userBId, login: userBLogin },
          score: 1,
        },
        finishGameDate: null,
      });
      expect(res.body.questions).toEqual(
        expect.arrayContaining([
          { id: questionId, body: expect.any(String) },
        ]),
      );
    });
  });
});
