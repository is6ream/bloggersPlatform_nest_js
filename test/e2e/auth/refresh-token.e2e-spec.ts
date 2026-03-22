import { beforeAll, expect } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import request from 'supertest';
import Database from 'better-sqlite3';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { User, UserModelType } from 'src/modules/user-accounts/domain/userEntity';
import { getModelToken } from '@nestjs/mongoose';
import { createTestUser } from '../../helpers/factory/user-factory';
import { loginUserHelper } from './helpers/login-user';
import { extractRefreshToken } from './helpers/extract-refresh.token';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { assignE2eDeviceSessionsDbPath } from '../helpers/device-sessions-sqlite-e2e';

describe('Auth refresh-token e2e', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let userModel: UserModelType;
  let deviceSessionsSqlitePath: string;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeAll(async () => {
    deviceSessionsSqlitePath = assignE2eDeviceSessionsDbPath();

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    userModel = moduleFixture.get<UserModelType>(getModelToken(User.name));
    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);

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
    await userModel.deleteMany({});
    const db = new Database(deviceSessionsSqlitePath);
    db.prepare('DELETE FROM device_sessions').run();
    db.close();
    await createTestUser(userModel);

    const loginResponse = await loginUserHelper(app);
    const cookieHeader = loginResponse.headers['set-cookie'];
    const savedRefreshToken = extractRefreshToken(cookieHeader);
    expect(savedRefreshToken).toBeDefined();

    await request(app.getHttpServer())
      .post('/hometask_16/api/auth/refresh-token')
      .set('Cookie', `refreshToken=${savedRefreshToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/hometask_16/api/auth/refresh-token')
      .set('Cookie', `refreshToken=${savedRefreshToken}`)
      .expect(401);
  });

  it('should return 401 for invalid refreshToken', async () => {
    await request(app.getHttpServer())
      .post('/hometask_16/api/auth/refresh-token')
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
      .post('/hometask_16/api/auth/refresh-token')
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
      .post('/hometask_16/api/auth/logout')
      .set('Cookie', `refreshToken=${expiredToken}`)
      .expect(401);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});

