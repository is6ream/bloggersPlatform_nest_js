import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { e2eApiPath } from 'test/e2e/helpers/api-path';
import { deleteAllE2eUsers } from 'test/helpers/factory/user-factory';
import { ensureIntegrationPgEnv } from '../helpers/ensure-integration-pg-env';
import {
  SendAnswerCommand,
  SendAnswerUsecase,
} from 'src/modules/quizGame/application/useCases/send-answer.usecase';
import { GameRepository } from 'src/modules/quizGame/infrastructure/game/game.repository';
import { GAME_QUESTIONS_COUNT } from 'src/modules/quizGame/constants/game-questions-count';
import { GameStatus } from 'src/modules/quizGame/types/game-status';
import { createActiveQuizGame } from './helpers/active-quiz-game-setup.helper';

const TESTING_PATH = e2eApiPath('testing/all-data');

describe('SendAnswerUsecase (integration)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let sendAnswerUsecase: SendAnswerUsecase;
  let commandBus: CommandBus;
  let gameRepository: GameRepository;

  beforeAll(async () => {
    ensureIntegrationPgEnv();

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();

    sendAnswerUsecase = moduleFixture.get(SendAnswerUsecase);
    commandBus = moduleFixture.get(CommandBus);
    gameRepository = moduleFixture.get(GameRepository);
  });

  beforeEach(async () => {
    await request(app.getHttpServer()).delete(TESTING_PATH).expect(204);
    await deleteAllE2eUsers();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('environment sanity', () => {
    it('creates Active game with two players and questions', async () => {
      const setup = await createActiveQuizGame(
        moduleFixture,
        app.getHttpServer(),
      );

      const game = await gameRepository.findActiveGameWithQuestionsByUserId(
        setup.firstPlayerUserId,
      );

      console.log("game: ", game)

      expect(game).not.toBeNull();
      expect(game!.id).toBe(setup.gameId);
      expect(game!.gameStatus).toBe(GameStatus.Active);
      expect(game!.gameQuestions).toHaveLength(GAME_QUESTIONS_COUNT);
    });
  });

  describe('execute', () => {
    it('sends answer for active game', async () => {
      const setup = await createActiveQuizGame(
        moduleFixture,
        app.getHttpServer(),
      );

      const result = await sendAnswerUsecase.execute(
        new SendAnswerCommand(
          setup.firstPlayerUserId,
          'A progressive Node.js framework',
        ),
      );

      expect(result).toBeDefined();
    });
  });
});
