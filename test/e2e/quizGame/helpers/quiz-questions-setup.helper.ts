import { GAME_QUESTIONS_COUNT } from 'src/modules/quizGame/constants/game-questions-count';
import { superAdminApi } from '../../helpers/super-admin-api';

type HttpServer = Parameters<typeof import('supertest')>[0];

const DEFAULT_QUESTION_INPUT = {
  body: 'What is NestJS framework?',
  correctAnswers: ['A progressive Node.js framework'],
};

export async function seedPublishedQuestions(
  httpServer: HttpServer,
  count: number = GAME_QUESTIONS_COUNT,
): Promise<void> {
  const saApi = superAdminApi(httpServer);

  for (let i = 0; i < count; i++) {
    const createRes = await saApi.quiz
      .create({
        body: `${DEFAULT_QUESTION_INPUT.body} #${i + 1}`,
        correctAnswers: DEFAULT_QUESTION_INPUT.correctAnswers,
      })
      .expect(201);

    await saApi.quiz
      .changePublicationStatus(createRes.body.id as string, true)
      .expect(204);
  }
}
