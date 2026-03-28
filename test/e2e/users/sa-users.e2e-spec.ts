import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { e2eApiPath } from '../helpers/api-path';
import { deleteAllE2eUsers } from '../../helpers/factory/user-factory';

const BASIC_AUTH = `Basic ${Buffer.from('admin:qwerty').toString('base64')}`;

describe('SA users (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  const saUsersPath = () => e2eApiPath('sa/users');

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();
  });

  beforeEach(async () => {
    await deleteAllE2eUsers();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET /sa/users — 401 без Basic Auth', async () => {
    await request(app.getHttpServer()).get(saUsersPath()).expect(401);
  });

  it('GET /sa/users — 200 и структура пагинации с Basic Auth', async () => {
    const res = await request(app.getHttpServer())
      .get(saUsersPath())
      .set('Authorization', BASIC_AUTH)
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body).toHaveProperty('totalCount');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('pageSize');
    expect(res.body).toHaveProperty('pagesCount');
  });

  it('POST /sa/users — 201, затем пользователь в списке', async () => {
    const body = {
      login: 'sauser1',
      password: '12345678',
      email: 'sauser1@test.local',
    };

    const createRes = await request(app.getHttpServer())
      .post(saUsersPath())
      .set('Authorization', BASIC_AUTH)
      .send(body)
      .expect(201);

    expect(createRes.body).toMatchObject({
      login: body.login,
      email: body.email,
    });
    expect(typeof createRes.body.id).toBe('string');
    expect(createRes.body.createdAt).toBeDefined();

    const listRes = await request(app.getHttpServer())
      .get(saUsersPath())
      .set('Authorization', BASIC_AUTH)
      .expect(200);

    expect(listRes.body.totalCount).toBeGreaterThanOrEqual(1);
    const found = listRes.body.items.find((u: { login: string }) => u.login === body.login);
    expect(found).toBeDefined();
    expect(found.email).toBe(body.email);
  });

  it('POST /sa/users — 400 при дублирующемся login', async () => {
    const body = {
      login: 'dupuser',
      password: '12345678',
      email: 'dup1@test.local',
    };

    await request(app.getHttpServer())
      .post(saUsersPath())
      .set('Authorization', BASIC_AUTH)
      .send(body)
      .expect(201);

    await request(app.getHttpServer())
      .post(saUsersPath())
      .set('Authorization', BASIC_AUTH)
      .send({ ...body, email: 'dup2@test.local' })
      .expect(400);
  });

  it('DELETE /sa/users/:id — 204 и пользователь не попадает в выдачу', async () => {
    const body = {
      login: 'todel',
      password: '12345678',
      email: 'todel@test.local',
    };

    const createRes = await request(app.getHttpServer())
      .post(saUsersPath())
      .set('Authorization', BASIC_AUTH)
      .send(body)
      .expect(201);

    const id = createRes.body.id as string;

    await request(app.getHttpServer())
      .delete(`${saUsersPath()}/${id}`)
      .set('Authorization', BASIC_AUTH)
      .expect(204);

    const listRes = await request(app.getHttpServer())
      .get(saUsersPath())
      .set('Authorization', BASIC_AUTH)
      .expect(200);

    const found = listRes.body.items.find((u: { id: string }) => u.id === id);
    expect(found).toBeUndefined();
  });

  it('DELETE /sa/users/:id — 404 для несуществующего id', async () => {
    await request(app.getHttpServer())
      .delete(`${saUsersPath()}/00000000-0000-4000-8000-000000000099`)
      .set('Authorization', BASIC_AUTH)
      .expect(404);
  });

  it('GET /sa/users — поиск по searchLoginTerm', async () => {
    await request(app.getHttpServer())
      .post(saUsersPath())
      .set('Authorization', BASIC_AUTH)
      .send({
        login: 'findme',
        password: '12345678',
        email: 'findme@test.local',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(saUsersPath())
      .query({ searchLoginTerm: 'find', pageNumber: 1, pageSize: 10 })
      .set('Authorization', BASIC_AUTH)
      .expect(200);

    expect(res.body.items.some((u: { login: string }) => u.login === 'findme')).toBe(true);
  });
});
