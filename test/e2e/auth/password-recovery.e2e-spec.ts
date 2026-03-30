import { beforeAll, expect } from '@jest/globals';
import { INestApplication } from '@nestjs/common';

jest.setTimeout(60000);
import { TestingModule, Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { createTestUser } from '../../helpers/factory/user-factory';
import { e2eApiPath } from '../helpers/api-path';
import { EmailAdapter } from 'src/modules/notifications/email-adapter';

const ENDPOINT = e2eApiPath('auth/password-recovery');

async function buildApp(): Promise<{ app: INestApplication; moduleFixture: TestingModule }> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(EmailAdapter)
    .useValue({
      sendRecoveryCodeEmail: jest.fn().mockResolvedValue(undefined),
      sendConfirmationCodeEmail: jest.fn().mockResolvedValue(undefined),
    })
    .compile();

  const app = moduleFixture.createNestApplication();
  appSetup(app);
  await app.init();

  return { app, moduleFixture };
}

describe('POST /auth/password-recovery — 204 / 400', () => {
  let app: INestApplication;
  let existingUserEmail = '';

  beforeAll(async () => {
    ({ app } = await buildApp());
    await request(app.getHttpServer()).delete(e2eApiPath('testing/all-data')).expect(204);
    const user = await createTestUser();
    existingUserEmail = user.email;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should return 204 when email belongs to an existing user', async () => {
    await request(app.getHttpServer())
      .post(ENDPOINT)
      .send({ email: existingUserEmail })
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
