import { beforeAll, expect } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { User, UserModelType } from 'src/modules/user-accounts/domain/userEntity';
import { getModelToken } from '@nestjs/mongoose';
import { createTestUser } from '../../helpers/factory/user-factory';
import { loginUserHelper } from './helpers/login-user';
import { extractRefreshToken } from './helpers/extract-refresh.token';

describe('Auth refresh-token e2e', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let userModel: UserModelType;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    userModel = moduleFixture.get<UserModelType>(getModelToken(User.name));

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();
  });

  it('should issue new access/refresh tokens for valid refreshToken', async () => {
    await createTestUser(userModel);

    const loginResponse = await loginUserHelper(app);

    const cookieHeader = loginResponse.headers['set-cookie'];
    const refreshToken = extractRefreshToken(cookieHeader);

    expect(refreshToken).toBeDefined();

    const agent = request.agent(app.getHttpServer());
    agent.jar.setCookie(`refreshToken=${refreshToken}`);

    const refreshResponse = await agent
      .post('/hometask_16/api/auth/refresh-token')
      .expect(201)
      .expect('Content-Type', /json/);

    const newCookieHeader = refreshResponse.headers['set-cookie'];
    const newRefreshToken = extractRefreshToken(newCookieHeader);

    expect(refreshResponse.body.accessToken).toBeDefined();
    expect(typeof refreshResponse.body.accessToken).toBe('string');

    expect(newRefreshToken).toBeDefined();
    expect(typeof newRefreshToken).toBe('string');
  });

  it('should return 401 for invalid refreshToken', async () => {
    const agent = request.agent(app.getHttpServer());
    agent.jar.setCookie(`refreshToken=invalid-token`);

    await agent.post('/hometask_16/api/auth/refresh-token').expect(401);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});

