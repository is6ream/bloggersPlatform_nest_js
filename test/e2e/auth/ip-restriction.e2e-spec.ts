import { beforeAll, afterAll, describe, it, expect, jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { e2eApiPath } from '../helpers/api-path';
import { EmailAdapter } from 'src/modules/notifications/email-adapter';
import { insertE2eUser } from '../helpers/users-pg-e2e';

jest.setTimeout(60000);

const REGISTRATION_ENDPOINT = e2eApiPath('auth/registration');
const RESENDING_ENDPOINT = e2eApiPath('auth/registration-email-resending');

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

describe('IP restriction — POST /auth/registration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await buildApp());
  });

  beforeEach(async () => {
    await request(app.getHttpServer())
      .delete(e2eApiPath('testing/all-data'))
      .expect(204);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should return 429 if more than 5 requests were sent within 10 seconds, and 204 after waiting', async () => {
    const THROTTLE_LIMIT = 5;

    for (let i = 0; i < THROTTLE_LIMIT; i++) {
      const idx = `-${i}`;
      await request(app.getHttpServer())
        .post(REGISTRATION_ENDPOINT)
        .send({
          login: `ipuser${idx}`,
          password: 'validpass',
          email: `ipuser${idx}@example.com`,
        })
        .expect(204);
    }

    await request(app.getHttpServer())
      .post(REGISTRATION_ENDPOINT)
      .send({
        login: 'ipuser-over-limit',
        password: 'validpass',
        email: 'ipuser-over-limit@example.com',
      })
      .expect(429);

    await new Promise((resolve) => setTimeout(resolve, 11_000));

    await request(app.getHttpServer())
      .post(REGISTRATION_ENDPOINT)
      .send({
        login: 'ipuser1',
        password: 'validpass',
        email: 'ipuser-after-wait@example.com',
      })
      .expect(204);
  });
});

describe('IP restriction — POST /auth/registration-email-resending', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await buildApp());
  });

  beforeEach(async () => {
    await request(app.getHttpServer())
      .delete(e2eApiPath('testing/all-data'))
      .expect(204);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should return 429 if more than 5 requests were sent within 10 seconds, and 204 after waiting', async () => {
    const THROTTLE_LIMIT = 5;
    const email = 'ip-throttle-pending@example.com';

    await insertE2eUser({
      login: 'ip-throttle-pending',
      email,
      passwordPlain: 'validpass',
      isEmailConfirmed: false,
    });

    for (let i = 0; i < THROTTLE_LIMIT; i++) {
      await request(app.getHttpServer())
        .post(RESENDING_ENDPOINT)
        .send({ email })
        .expect(204);
    }

    await request(app.getHttpServer())
      .post(RESENDING_ENDPOINT)
      .send({ email })
      .expect(429);

    await new Promise((resolve) => setTimeout(resolve, 11_000));

    await request(app.getHttpServer())
      .post(RESENDING_ENDPOINT)
      .send({ email })
      .expect(204);
  });
}
);

