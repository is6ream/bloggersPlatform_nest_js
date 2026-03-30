import { beforeAll, expect } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { createTestUser } from '../../helpers/factory/user-factory';
import { e2eApiPath } from '../helpers/api-path';
import { loginUserHelper } from './helpers/login-user';
import { extractRefreshToken } from './helpers/extract-refresh.token';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  assignE2eDeviceSessionsPgConfig,
} from '../helpers/device-sessions-postgres-e2e';

describe('Auth refresh-token e2e', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let jwtService: JwtService;
  let configService: ConfigService;
  let credentials: { loginOrEmail: string; password: string };

  beforeAll(async () => {
    assignE2eDeviceSessionsPgConfig();

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();
  });

  beforeEach(async () => {
    await request(app.getHttpServer()).delete(e2eApiPath('testing/all-data')).expect(204);
    const user = await createTestUser();
    credentials = { loginOrEmail: user.login, password: user.password };
  });

  it('should issue new access/refresh tokens for valid refreshToken', async () => {
    const loginResponse = await loginUserHelper(app, undefined, credentials);

    const cookieHeader = loginResponse.headers['set-cookie'];
    const refreshToken = extractRefreshToken(cookieHeader);

    expect(refreshToken).toBeDefined();

    const agent = request.agent(app.getHttpServer());
    agent.jar.setCookie(`refreshToken=${refreshToken}`);

    const refreshResponse = await agent
      .post(e2eApiPath('auth/refresh-token'))
      .expect(200)
      .expect('Content-Type', /json/);

    const newCookieHeader = refreshResponse.headers['set-cookie'];
    const newRefreshToken = extractRefreshToken(newCookieHeader);

    expect(refreshResponse.body.accessToken).toBeDefined();
    expect(typeof refreshResponse.body.accessToken).toBe('string');

    expect(newRefreshToken).toBeDefined();
    expect(typeof newRefreshToken).toBe('string');
  });

  it('should return 401 when reusing same refresh token after it was already used', async () => {
    const loginResponse = await loginUserHelper(app, undefined, credentials);
    const cookieHeader = loginResponse.headers['set-cookie'];
    const savedRefreshToken = extractRefreshToken(cookieHeader);
    expect(savedRefreshToken).toBeDefined();

    await request(app.getHttpServer())
      .post(e2eApiPath('auth/refresh-token'))
      .set('Cookie', `refreshToken=${savedRefreshToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(e2eApiPath('auth/refresh-token'))
      .set('Cookie', `refreshToken=${savedRefreshToken}`)
      .expect(401);
  });

  it('should return 401 for invalid refreshToken', async () => {
    await request(app.getHttpServer())
      .post(e2eApiPath('auth/refresh-token'))
      .set('Cookie', 'refreshToken=invalid-token')
      .expect(401);
  });

  it('should return 401 for expired refreshToken on /auth/refresh-token', async () => {
    const secret = configService.get<string>('JWT_REFRESH_SECRET') as string;

    const expiredToken = await jwtService.signAsync(
      { sub: 'someUserId', deviceId: 'someDeviceId' },
      {
        secret,
        expiresIn: -10,
      },
    );

    await request(app.getHttpServer())
      .post(e2eApiPath('auth/refresh-token'))
      .set('Cookie', `refreshToken=${expiredToken}`)
      .expect(401);
  });

  it('should return 401 for expired refreshToken on /auth/logout', async () => {
    const secret = configService.get<string>('JWT_REFRESH_SECRET') as string;

    const expiredToken = await jwtService.signAsync(
      { sub: 'someUserId', deviceId: 'someDeviceId' },
      {
        secret,
        expiresIn: -10,
      },
    );

    await request(app.getHttpServer())
      .post(e2eApiPath('auth/logout'))
      .set('Cookie', `refreshToken=${expiredToken}`)
      .expect(401);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});

