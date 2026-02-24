import { beforeAll, expect } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { INestApplication } from '@nestjs/common';
import { createTestUser } from '../../helpers/factory/user-factory';
import { loginUserHelper } from './helpers/login-user';
import request from 'supertest';
import { extractRefreshToken } from './helpers/extract-refresh.token';
import { UserModelType } from 'src/modules/user-accounts/domain/userEntity';

describe('Auth e2e tests', () => {
  let mongoServer: any;
  let mongoClient: any;
  let mongoConnection: any;
  let moduleFixture: any;
  let app: INestApplication;
  let userModel!: UserModelType;

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

  it('should return refreshToken in HttpOnly Secure cookie', async () => {
    console.log('is userModel exist check: ', userModel);

    await createTestUser(userModel);
    const response = await loginUserHelper(app);

    const cookie = response.headers['set-cookie'];

    expect(cookie).toBeDefined();

    const refreshToken = extractRefreshToken(cookie as string);

    expect(refreshToken).toBeDefined();
    expect(typeof refreshToken).toBe('string');
    // expect(refreshToken.length).toBeGreaterThan(10);

    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
  });

  afterAll(async () => {
    if (mongoConnection) await mongoConnection.close();
    if (app) await app.close();
  });
});
