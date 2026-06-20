import { TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { ConnectToPairCommand } from 'src/modules/quizGame/application/useCases/connect-to-pair.usecase';
import { createTestUser } from 'test/helpers/factory/user-factory';
import { seedPublishedQuestions } from 'test/e2e/quizGame/helpers/quiz-questions-setup.helper';

type HttpServer = Parameters<typeof import('supertest')>[0];

export type ActiveQuizGameSetup = {
  gameId: string;
  firstPlayerUserId: string;
  secondPlayerUserId: string;
  firstPlayerLogin: string;
  secondPlayerLogin: string;
};

export async function createActiveQuizGame(
  moduleFixture: TestingModule,
  httpServer: HttpServer,
): Promise<ActiveQuizGameSetup> {
  await seedPublishedQuestions(httpServer);

  const suffix = randomUUID().slice(0, 8);
  const firstPlayerLogin = `quiz_int_a_${suffix}`;
  const secondPlayerLogin = `quiz_int_b_${suffix}`;

  const createdA = await createTestUser({
    login: firstPlayerLogin,
    password: 'pass_a',
  });
  const createdB = await createTestUser({
    login: secondPlayerLogin,
    password: 'pass_b',
  });

  const commandBus = moduleFixture.get(CommandBus);

  await commandBus.execute(new ConnectToPairCommand(createdA.id));
  const gameId = await commandBus.execute(
    new ConnectToPairCommand(createdB.id),
  );

  return {
    gameId,
    firstPlayerUserId: createdA.id,
    secondPlayerUserId: createdB.id,
    firstPlayerLogin,
    secondPlayerLogin,
  };
}
