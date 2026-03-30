import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { e2eApiPath } from '../helpers/api-path';

const BASIC_AUTH = `Basic ${Buffer.from('admin:qwerty').toString('base64')}`;
const SA_USERS_PATH = e2eApiPath('sa/users');
const TESTING_PATH = e2eApiPath('testing/all-data');

type CreateSaUserDto = {
  login: string;
  password: string;
  email: string;
};

function makeSaUserInput(prefix = 'sauser'): CreateSaUserDto {
  const suffix = Math.random().toString(36).slice(2, 6);
  const safePrefix = prefix.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 5) || 'user';
  const login = `${safePrefix}${suffix}`.slice(0, 10);
  return {
    login,
    password: '12345678',
    email: `${safePrefix}${suffix}@example.com`,
  };
}

describe('SA users (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

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
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /sa/users', () => {
    it('401 — без Basic Auth', async () => {
      await request(app.getHttpServer()).get(SA_USERS_PATH).expect(401);
    });

    it('200 — возвращает пагинацию c Basic Auth', async () => {
      const res = await request(app.getHttpServer())
        .get(SA_USERS_PATH)
        .set('Authorization', BASIC_AUTH)
        .expect(200);

      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body).toHaveProperty('totalCount');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('pageSize');
      expect(res.body).toHaveProperty('pagesCount');
    });

    it('200 — фильтрует по searchLoginTerm', async () => {
      const user = makeSaUserInput('findme');

      await request(app.getHttpServer())
        .post(SA_USERS_PATH)
        .set('Authorization', BASIC_AUTH)
        .send(user)
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(SA_USERS_PATH)
        .query({ searchLoginTerm: 'find', pageNumber: 1, pageSize: 10 })
        .set('Authorization', BASIC_AUTH)
        .expect(200);

      expect(res.body.items.some((u: { login: string }) => u.login === user.login)).toBe(
        true,
      );
    });
  });

  describe('POST /sa/users', () => {
    it('201 — создаёт пользователя и возвращает view model', async () => {
      const body = makeSaUserInput();

      const createRes = await request(app.getHttpServer())
        .post(SA_USERS_PATH)
        .set('Authorization', BASIC_AUTH)
        .send(body)
        .expect(201);

      expect(createRes.body).toMatchObject({
        login: body.login,
        email: body.email,
      });
      expect(typeof createRes.body.id).toBe('string');
      expect(createRes.body.createdAt).toBeDefined();
    });

    it('201 — после создания пользователь появляется в списке', async () => {
      const body = makeSaUserInput('listed');

      await request(app.getHttpServer())
        .post(SA_USERS_PATH)
        .set('Authorization', BASIC_AUTH)
        .send(body)
        .expect(201);

      const listRes = await request(app.getHttpServer())
        .get(SA_USERS_PATH)
        .set('Authorization', BASIC_AUTH)
        .expect(200);

      expect(listRes.body.totalCount).toBeGreaterThanOrEqual(1);
      const found = listRes.body.items.find((u: { login: string }) => u.login === body.login);
      expect(found).toBeDefined();
      expect(found.email).toBe(body.email);
    });

    it('400 — дублирующийся login', async () => {
      const body = makeSaUserInput('dup');

      await request(app.getHttpServer())
        .post(SA_USERS_PATH)
        .set('Authorization', BASIC_AUTH)
        .send(body)
        .expect(201);

      await request(app.getHttpServer())
        .post(SA_USERS_PATH)
        .set('Authorization', BASIC_AUTH)
        .send({ ...body, email: `other_${Date.now().toString(36)}@test.local` })
        .expect(400);
    });
  });

  describe('DELETE /sa/users/:id', () => {
    it('204 — удаляет пользователя, после чего он не попадает в выдачу', async () => {
      const body = makeSaUserInput('todel');

      const createRes = await request(app.getHttpServer())
        .post(SA_USERS_PATH)
        .set('Authorization', BASIC_AUTH)
        .send(body)
        .expect(201);

      const id = createRes.body.id as string;

      await request(app.getHttpServer())
        .delete(`${SA_USERS_PATH}/${id}`)
        .set('Authorization', BASIC_AUTH)
        .expect(204);

      const listRes = await request(app.getHttpServer())
        .get(SA_USERS_PATH)
        .set('Authorization', BASIC_AUTH)
        .expect(200);

      const found = listRes.body.items.find((u: { id: string }) => u.id === id);
      expect(found).toBeUndefined();
    });

    it('404 — для несуществующего id', async () => {
      await request(app.getHttpServer())
        .delete(`${SA_USERS_PATH}/00000000-0000-4000-8000-000000000099`)
        .set('Authorization', BASIC_AUTH)
        .expect(404);
    });
  });
});
