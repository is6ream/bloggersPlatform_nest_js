import { beforeAll, expect } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { INestApplication } from '@nestjs/common';
import { createTestUser } from '../../helpers/factory/user-factory';
import { loginUserHelper } from './helpers/login-user';
import { extractRefreshToken } from './helpers/extract-refresh.token';
import { UserModelType } from 'src/modules/user-accounts/domain/userEntity';
import { getModelToken } from '@nestjs/mongoose';
import { User } from 'src/modules/user-accounts/domain/userEntity';
describe('Auth e2e tests', () => {
  let mongoServer: any;
  let mongoClient: any;
  let mongoConnection: any;
  let moduleFixture: TestingModule;
  let app: INestApplication;
  let userModel: UserModelType;

  let testUser: any;
  let testUserId: string;
  let testPostId: string;
  let authToken: string;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    userModel = moduleFixture.get<UserModelType>(getModelToken(User.name));

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();

    await createTestUser(userModel);
  });

  it('should return refreshToken in HttpOnly Secure cookie', async () => {
    const response = await loginUserHelper(app);

    expect(response.status).toBe(200);

    const cookieHeader = response.headers['set-cookie'];

    expect(cookieHeader).toBeDefined();

    const refreshToken = extractRefreshToken(cookieHeader);

    expect(refreshToken).toBeDefined();
    expect(typeof refreshToken).toBe('string');

    const firstCookie =
      Array.isArray(cookieHeader) && cookieHeader.length > 0
        ? cookieHeader[0]
        : (cookieHeader as string);

    expect(firstCookie).toContain('HttpOnly');
    expect(firstCookie).toContain('Secure');
  });

  it('should return accessToken in body and refreshToken in cookie on POST /auth/login', async () => {
    const response = await loginUserHelper(app);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body.accessToken).toBeDefined();
    expect(typeof response.body.accessToken).toBe('string');
    expect(response.body.accessToken.length).toBeGreaterThan(0);

    const cookieHeader = response.headers['set-cookie'];
    expect(cookieHeader).toBeDefined();

    const refreshToken = extractRefreshToken(cookieHeader);
    expect(refreshToken).toBeDefined();
    expect(typeof refreshToken).toBe('string');
    expect(refreshToken!.length).toBeGreaterThan(0);
  });

  afterAll(async () => {
    if (mongoConnection) await mongoConnection.close();
    if (app) await app.close();
  });
});
