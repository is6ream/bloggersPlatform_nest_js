import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { SA_QUIZ_PATH, superAdminApi } from '../../helpers/super-admin-api';

const BASIC_AUTH = `Basic ${Buffer.from('admin:qwerty').toString('base64')}`;

const VALID_QUESTION_INPUT = {
  body: 'What is NestJS framework?',
  correctAnswers: ['A progressive Node.js framework'],
};

const UPDATED_QUESTION_INPUT = {
  body: 'Updated NestJS question body text',
  correctAnswers: ['Updated correct answer'],
};

const NON_EXISTENT_QUESTION_ID = '00000000-0000-4000-8000-000000000099';

describe('SA Quiz (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let saApi: ReturnType<typeof superAdminApi>;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();

    saApi = superAdminApi(app.getHttpServer());
  });

  beforeEach(async () => {
    await saApi.clearAllData().expect(204);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /sa/quiz', () => {
    it('401 — без Basic Auth', async () => {
      await request(app.getHttpServer()).get(SA_QUIZ_PATH).expect(401);
    });

    it('200 — возвращает пагинацию с Basic Auth', async () => {
      const res = await saApi.quiz.getAll().expect(200);

      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body).toMatchObject({
        totalCount: expect.any(Number),
        page: expect.any(Number),
        pageSize: expect.any(Number),
        pagesCount: expect.any(Number),
      });
      expect(res.body.totalCount).toBeGreaterThanOrEqual(0);
      expect(res.body.items).toHaveLength(0);
    });
  });

  describe('POST /sa/quiz/questions — updatedAt', () => {
});

  describe('PUT /sa/quiz/questions/:id — updatedAt', () => {
    it('после обновления updatedAt становится не null', async () => {
      const createRes = await saApi.quiz.create(VALID_QUESTION_INPUT).expect(201);
      const id = createRes.body.id as string;

      await saApi.quiz.update(id, UPDATED_QUESTION_INPUT).expect(204);

      const listRes = await saApi.quiz.getAll().expect(200);
      const updated = listRes.body.items.find(
        (q: { id: string }) => q.id === id,
      );

      expect(updated.updatedAt).toEqual(expect.any(String));
    });
  });

  describe('GET /sa/quiz/questions — пагинация и сортировка', () => {
    const BODIES = [
      'question body03',
      'question body01',
      'question body05',
      'question body02',
      'question body04',
    ];

    async function seedQuestions(bodies: string[]): Promise<void> {
      for (const body of bodies) {
        await saApi.quiz.create({ body, correctAnswers: ['correct1'] }).expect(201);
      }
    }

    it('sortBy=body&sortDirection=asc — вопросы отсортированы по body по возрастанию', async () => {
      await seedQuestions(BODIES);

      const res = await saApi.quiz
        .getAll({ sortBy: 'body', sortDirection: 'asc' })
        .expect(200);

      const receivedBodies = res.body.items.map(
        (q: { body: string }) => q.body,
      );
      expect(receivedBodies).toEqual([...BODIES].sort());
    });

    it('sortBy=body&sortDirection=desc — вопросы отсортированы по body по убыванию', async () => {
      await seedQuestions(BODIES);

      const res = await saApi.quiz
        .getAll({ sortBy: 'body', sortDirection: 'desc' })
        .expect(200);

      const receivedBodies = res.body.items.map(
        (q: { body: string }) => q.body,
      );
      expect(receivedBodies).toEqual([...BODIES].sort().reverse());
    });

    it('пагинация — корректные метаданные и размер страницы', async () => {
      await seedQuestions(BODIES);

      const res = await saApi.quiz
        .getAll({ pageSize: 2, pageNumber: 1, sortBy: 'body', sortDirection: 'asc' })
        .expect(200);

      expect(res.body).toMatchObject({
        totalCount: BODIES.length,
        page: 1,
        pageSize: 2,
        pagesCount: Math.ceil(BODIES.length / 2),
      });
      expect(res.body.items).toHaveLength(2);
    });

    it('в списке у всех вопросов updatedAt равен null до обновления', async () => {
      await seedQuestions(BODIES);

      const res = await saApi.quiz.getAll().expect(200);

      for (const item of res.body.items) {
        expect(item.updatedAt).toBeNull();
      }
    });
  });

  describe('POST /sa/quiz', () => {
    it('401 — без Basic Auth', async () => {
      await request(app.getHttpServer())
        .post(SA_QUIZ_PATH)
        .send(VALID_QUESTION_INPUT)
        .expect(401);
    });

    it('400 — некорректный формат данных', async () => {
      const res = await request(app.getHttpServer())
        .post(SA_QUIZ_PATH)
        .set('Authorization', BASIC_AUTH)
        .send({
          body: 'short',
          correctAnswers: [],
        })
        .expect(400);

      expect(res.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(res.body.errorsMessages)).toBe(true);
      expect(res.body.errorsMessages.length).toBeGreaterThan(0);
    });

    it('201 — создаёт вопрос и возвращает view model', async () => {
      const res = await saApi.quiz.create(VALID_QUESTION_INPUT).expect(201);

      expect(res.body).toMatchObject({
        body: VALID_QUESTION_INPUT.body,
        correctAnswers: VALID_QUESTION_INPUT.correctAnswers,
        published: false,
      });
      expect(typeof res.body.id).toBe('string');
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.updatedAt).toBeNull();
    });
  });

  describe('DELETE /sa/quiz/:id', () => {
    it('401 — без Basic Auth', async () => {
      const createRes = await saApi.quiz.create(VALID_QUESTION_INPUT).expect(201);

      await request(app.getHttpServer())
        .delete(`${SA_QUIZ_PATH}/${createRes.body.id}`)
        .expect(401);
    });

    it('404 — для несуществующего id', async () => {
      await saApi.quiz.delete(NON_EXISTENT_QUESTION_ID).expect(404);
    });

    it('204 — удаляет вопрос, после чего он не попадает в список', async () => {
      const createRes = await saApi.quiz.create(VALID_QUESTION_INPUT).expect(201);
      const id = createRes.body.id as string;

      await saApi.quiz.delete(id).expect(204);

      const listRes = await saApi.quiz.getAll().expect(200);

      const found = listRes.body.items.find((q: { id: string }) => q.id === id);
      expect(found).toBeUndefined();
      expect(listRes.body.totalCount).toBe(0);
    });
  });

  describe('PUT /sa/quiz/:id', () => {
    it('401 — без Basic Auth', async () => {
      const createRes = await saApi.quiz.create(VALID_QUESTION_INPUT).expect(201);

      await request(app.getHttpServer())
        .put(`${SA_QUIZ_PATH}/${createRes.body.id}`)
        .send(UPDATED_QUESTION_INPUT)
        .expect(401);
    });

    it('404 — для несуществующего id', async () => {
      await saApi.quiz
        .update(NON_EXISTENT_QUESTION_ID, UPDATED_QUESTION_INPUT)
        .expect(404);
    });

    it('400 — некорректный формат данных', async () => {
      const createRes = await saApi.quiz.create(VALID_QUESTION_INPUT).expect(201);

      const res = await saApi.quiz
        .update(createRes.body.id as string, {
          body: 'short',
          correctAnswers: [],
        })
        .expect(400);

      expect(res.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(res.body.errorsMessages)).toBe(true);
      expect(res.body.errorsMessages.length).toBeGreaterThan(0);
    });

    it('400 — published true без correctAnswers', async () => {
      const createRes = await saApi.quiz.create(VALID_QUESTION_INPUT).expect(201);

      const res = await request(app.getHttpServer())
        .put(`${SA_QUIZ_PATH}/${createRes.body.id}`)
        .set('Authorization', BASIC_AUTH)
        .send({
          body: 'Valid question body for publish check',
          published: true,
        })
        .expect(400);

      expect(res.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(res.body.errorsMessages)).toBe(true);
      expect(res.body.errorsMessages.length).toBeGreaterThan(0);
    });

    it('204 — обновляет вопрос', async () => {
      const createRes = await saApi.quiz.create(VALID_QUESTION_INPUT).expect(201);
      const id = createRes.body.id as string;

      await saApi.quiz.update(id, UPDATED_QUESTION_INPUT).expect(204);

      const listRes = await saApi.quiz.getAll().expect(200);
      const updated = listRes.body.items.find((q: { id: string }) => q.id === id);

      expect(updated).toMatchObject({
        body: UPDATED_QUESTION_INPUT.body,
        correctAnswers: UPDATED_QUESTION_INPUT.correctAnswers,
        published: false,
      });
    });
  });

  describe('PUT /sa/quiz/:id/publish', () => {
    it('401 — без Basic Auth', async () => {
      const createRes = await saApi.quiz.create(VALID_QUESTION_INPUT).expect(201);

      await request(app.getHttpServer())
        .put(`${SA_QUIZ_PATH}/${createRes.body.id}/publish`)
        .send({ published: true })
        .expect(401);
    });

    it('400 — некорректный формат данных', async () => {
      const createRes = await saApi.quiz.create(VALID_QUESTION_INPUT).expect(201);

      const res = await request(app.getHttpServer())
        .put(`${SA_QUIZ_PATH}/${createRes.body.id}/publish`)
        .set('Authorization', BASIC_AUTH)
        .send({ published: 'not-a-boolean' })
        .expect(400);

      expect(res.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(res.body.errorsMessages)).toBe(true);
      expect(res.body.errorsMessages.length).toBeGreaterThan(0);
    });

    it('400 — у вопроса нет корректных correctAnswers при published: true', async () => {
      const createRes = await saApi.quiz.create(VALID_QUESTION_INPUT).expect(201);
      const id = createRes.body.id as string;

      await app.get(DataSource).query(
        `UPDATE quiz_questions SET "correctAnswers" = '[]'::jsonb WHERE id = $1`,
        [id],
      );

      const res = await saApi.quiz.changePublicationStatus(id, true).expect(400);

      expect(res.body).toHaveProperty('errorsMessages');
      expect(res.body.errorsMessages[0].message).toContain('correct answers');
    });

    it('204 — публикует вопрос с валидными correctAnswers', async () => {
      const createRes = await saApi.quiz.create(VALID_QUESTION_INPUT).expect(201);
      const id = createRes.body.id as string;

      await saApi.quiz.changePublicationStatus(id, true).expect(204);

      const listRes = await saApi.quiz
        .getAll({ publishedStatus: 'Published' })
        .expect(200);

      const published = listRes.body.items.find((q: { id: string }) => q.id === id);

      expect(published).toMatchObject({
        id,
        published: true,
        body: VALID_QUESTION_INPUT.body,
      });
    });
  });
});
