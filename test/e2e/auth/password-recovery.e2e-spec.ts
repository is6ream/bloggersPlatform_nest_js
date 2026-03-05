import { beforeAll, expect } from '@jest/globals';
import { INestApplication } from '@nestjs/common';

jest.setTimeout(60000);
import { TestingModule, Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { User, UserModelType } from 'src/modules/user-accounts/domain/userEntity';
import { getModelToken } from '@nestjs/mongoose';
import { createTestUser } from '../../helpers/factory/user-factory';

const ENDPOINT = '/hometask_16/api/auth/password-recovery';

async function buildApp(): Promise<{ app: INestApplication; moduleFixture: TestingModule; userModel: UserModelType }> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const userModel = moduleFixture.get<UserModelType>(getModelToken(User.name));

  const app = moduleFixture.createNestApplication();
  appSetup(app);
  await app.init();

  return { app, moduleFixture, userModel };
}

describe('POST /auth/password-recovery — 204 / 400', () => {
  let app: INestApplication;
  let userModel: UserModelType;

  beforeAll(async () => {
    ({ app, userModel } = await buildApp());
    await createTestUser(userModel);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should return 204 when email belongs to an existing user', async () => {
    await request(app.getHttpServer())
      .post(ENDPOINT)
      .send({ email: 'test@example.com' })
      .expect(204);
  });

  it('should return 204 even when email does not exist in the system', async () => {
    await request(app.getHttpServer())
      .post(ENDPOINT)
      .send({ email: 'nonexistent@example.com' })
      .expect(204);
  });

  it('should return 400 when email has invalid format', async () => {
    await request(app.getHttpServer())
      .post(ENDPOINT)
      .send({ email: 'not-valid-email' })
      .expect(400);
  });

  it('should return 400 when email is missing @domain', async () => {
    await request(app.getHttpServer())
      .post(ENDPOINT)
      .send({ email: '@nodomain' })
      .expect(400);
  });

  it('should return 400 when email field is empty string', async () => {
    await request(app.getHttpServer())
      .post(ENDPOINT)
      .send({ email: '' })
      .expect(400);
  });
});

describe('POST /auth/password-recovery — 429 throttle', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await buildApp());
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should return 429 after exceeding 5 requests within the TTL window', async () => {
    const THROTTLE_LIMIT = 5;

    for (let i = 0; i < THROTTLE_LIMIT; i++) {
      await request(app.getHttpServer())
        .post(ENDPOINT)
        .send({ email: 'throttle-test@example.com' })
        .expect(204);
    }

    await request(app.getHttpServer())
      .post(ENDPOINT)
      .send({ email: 'throttle-test@example.com' })
      .expect(429);
  });
});
