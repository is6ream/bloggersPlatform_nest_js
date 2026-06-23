import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { QuestionRepository } from 'src/modules/quizGame/infrastructure/questions/question.repository';
import { QuestionOrmEntity } from 'src/modules/quizGame/entities/question.orm-entity';
import { SA_QUIZ_PATH, superAdminApi } from 'test/e2e/helpers/super-admin-api';
import { e2eApiPath } from 'test/e2e/helpers/api-path';
import { ensureIntegrationPgEnv } from '../helpers/ensure-integration-pg-env';

const TESTING_PATH = e2eApiPath('testing/all-data');
const BASIC_AUTH = `Basic ${Buffer.from('admin:qwerty').toString('base64')}`;
const NON_EXISTENT_QUESTION_ID = '00000000-0000-4000-8000-000000000099';

const VALID_QUESTION_INPUT = {
  body: 'What is NestJS framework?',
  correctAnswers: ['A progressive Node.js framework'],
};

describe('PUT /sa/quiz/questions/:id/publish (integration)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let questionRepository: QuestionRepository;
  let saApi: ReturnType<typeof superAdminApi>;

  async function seedQuestion(
    overrides: Partial<typeof VALID_QUESTION_INPUT> = {},
  ): Promise<QuestionOrmEntity> {
    const question = QuestionOrmEntity.create({
      ...VALID_QUESTION_INPUT,
      ...overrides,
    });
    await questionRepository.save(question);
    return question;
  }

  beforeAll(async () => {
    ensureIntegrationPgEnv();

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();

    questionRepository = moduleFixture.get(QuestionRepository);
    saApi = superAdminApi(app.getHttpServer());
  });

  beforeEach(async () => {
    await request(app.getHttpServer()).delete(TESTING_PATH).expect(204);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('401 — без Basic Auth, статус публикации в БД не меняется', async () => {
    const question = await seedQuestion();

    await request(app.getHttpServer())
      .put(`${SA_QUIZ_PATH}/${question.id}/publish`)
      .send({ published: true })
      .expect(401);

    const stored = await questionRepository.findOrNotFoundFail(question.id);
    expect(stored.published).toBe(false);
  });

  it('400 — published не boolean, статус публикации в БД не меняется', async () => {
    const question = await seedQuestion();

    const res = await request(app.getHttpServer())
      .put(`${SA_QUIZ_PATH}/${question.id}/publish`)
      .set('Authorization', BASIC_AUTH)
      .send({ published: 'not-a-boolean' })
      .expect(400);

    expect(res.body).toHaveProperty('errorsMessages');
    expect(Array.isArray(res.body.errorsMessages)).toBe(true);
    expect(res.body.errorsMessages.length).toBeGreaterThan(0);

    const stored = await questionRepository.findOrNotFoundFail(question.id);
    expect(stored.published).toBe(false);
  });

  it('404 — несуществующий id', async () => {
    await saApi.quiz
      .changePublicationStatus(NON_EXISTENT_QUESTION_ID, true)
      .expect(404);
  });

  it('204 — публикует вопрос, в БД published становится true', async () => {
    const question = await seedQuestion();

    await saApi.quiz.changePublicationStatus(question.id, true).expect(204);

    const stored = await questionRepository.findOrNotFoundFail(question.id);
    expect(stored.published).toBe(true);
  });

  it('204 — снимает вопрос с публикации, в БД published становится false', async () => {
    const question = await seedQuestion();
    question.changePublicationStatus(true);
    await questionRepository.save(question);

    await saApi.quiz.changePublicationStatus(question.id, false).expect(204);

    const stored = await questionRepository.findOrNotFoundFail(question.id);
    expect(stored.published).toBe(false);
  });

  it('400 — published: true при пустых correctAnswers, в БД published остаётся false', async () => {
    const question = await seedQuestion({ correctAnswers: [] });

    const res = await saApi.quiz
      .changePublicationStatus(question.id, true)
      .expect(400);

    expect(res.body).toHaveProperty('errorsMessages');
    expect(Array.isArray(res.body.errorsMessages)).toBe(true);
    expect(res.body.errorsMessages.length).toBeGreaterThan(0);

    const stored = await questionRepository.findOrNotFoundFail(question.id);
    expect(stored.published).toBe(false);
  });
});
