import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import request from 'supertest';
import { createCustomTestUser } from '../../helpers/factory/custom-user.factory';
import { deleteAllE2eUsers } from '../../helpers/factory/user-factory';
import { e2eApiPath } from '../helpers/api-path';
import { loginAndGetAccessToken } from './helpers/auth.helper';
import { pairGameQuizApi } from './helpers/pair-game-quiz-api';
import {
  countPlayersInGame,
  findGameIdsWithMoreThanTwoPlayers,
} from './helpers/quiz-game-db.helper';
import { seedPublishedQuestions } from './helpers/quiz-questions-setup.helper';

const TESTING_PATH = e2eApiPath('testing/all-data');

describe('QuizGame connect-to-pair concurrency (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let dataSource: DataSource;

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

    const createdA = await createCustomTestUser({
      login: 'quizuser_a',
      password: 'pass_a',
    });
    const createdB = await createCustomTestUser({
      login: 'quizuser_b',
      password: 'pass_b',
    });
    const createdC = await createCustomTestUser({
      login: 'quizuser_c',
      password: 'pass_c',
    });

    userAToken = await loginAndGetAccessToken(
      app,
      createdA.user.login,
      createdA.password,
    );
    userBToken = await loginAndGetAccessToken(
      app,
      createdB.user.login,
      createdB.password,
    );
    userCToken = await loginAndGetAccessToken(
      app,
      createdC.user.login,
      createdC.password,
    );

    await seedPublishedQuestions(app.getHttpServer());
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('при одновременном подключении двух игроков к одной pending-игре в ней остаётся ровно 2 игрока', async () => {
    const quizApi = pairGameQuizApi(app.getHttpServer());

    const userAResponse = await quizApi
      .connectToPair(userAToken)
      .expect(HttpStatus.OK);

    const pendingGameId = userAResponse.body.id as string;

    expect(userAResponse.body.status).toBe('PendingSecondPlayer');
    expect(userAResponse.body.secondPlayerProgress).toBeNull();

    const [userBResponse, userCResponse] = await Promise.all([
      quizApi.connectToPair(userBToken),
      quizApi.connectToPair(userCToken),
    ]);

    expect(userBResponse.status).toBe(HttpStatus.OK);
    expect(userCResponse.status).toBe(HttpStatus.OK);

    const joinedGameIds = [
      userBResponse.body.id as string,
      userCResponse.body.id as string,
    ];

    const joinedPendingGameCount = joinedGameIds.filter(
      (gameId) => gameId === pendingGameId,
    ).length;

    expect(joinedPendingGameCount).toBe(1);

    const playersInPendingGame = await countPlayersInGame(
      dataSource,
      pendingGameId,
    );
    expect(playersInPendingGame).toBe(2);

    const gamesWithThreePlayers = await findGameIdsWithMoreThanTwoPlayers(
      dataSource,
    );
    expect(gamesWithThreePlayers).toHaveLength(0);
  });
});
