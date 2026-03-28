import { afterAll, beforeAll, expect } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { INestApplication } from '@nestjs/common';
import { createTestUser } from '../../helpers/factory/user-factory';
import { loginUserHelper } from './helpers/login-user';
import { extractRefreshToken } from './helpers/extract-refresh.token';

describe('Auth e2e tests', () => {
  let moduleFixture: TestingModule;
  let app: INestApplication;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();

    await createTestUser();
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
    if (app) await app.close();
  });
});
