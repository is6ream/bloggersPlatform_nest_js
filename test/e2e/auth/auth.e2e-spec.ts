import { beforeAll, expect } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { INestApplication } from '@nestjs/common';
import { createTestUser } from '../../helpers/factory/user-factory';
import request from 'supertest';

describe('Auth e2e tests', () => {
  let mongoServer: any;
  let mongoClient: any;
  let mongoConnection: any;
  let moduleFixture: any;
  let app: INestApplication;
  let userModel: any;

  // Общие данные для всех тестов
  let testUser: any;
  let testUserId: string;
  let testPostId: string;
  let authToken: string;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();
  });

  it('should success authentication', async () => {
    console.log('test check');
    testUser = await createTestUser(userModel);

    const authResponse = await request(app.getHttpServer())
      .post('/hometask_15/api/auth/login')
      .send({
        loginOrEmail: 'testuser',
        password: 'testpassword',
      });

    expect(authResponse.headers['set-cookie']).toBeDefined();

    const cookies = authResponse.headers['set-cookie'];
    console.log('Cookies check: ', cookies);
    const refreshTokenCookie = cookies;
    //   .find((cookie) =>
    //   cookie.includes('refresh_token'),
    // );

    expect(refreshTokenCookie).toBeDefined();

    expect(refreshTokenCookie).toContain('HttpOnly');
    expect(refreshTokenCookie).toContain('Secure');
  });

  afterAll(async () => {
    if (mongoConnection) await mongoConnection.close();
    if (app) await app.close();
  });
});
