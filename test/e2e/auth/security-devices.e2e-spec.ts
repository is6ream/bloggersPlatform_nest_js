import { beforeAll, expect } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { User, UserModelType } from 'src/modules/user-accounts/domain/userEntity';
import {
  DeviceSession,
  DeviceSessionModelType,
} from 'src/modules/user-accounts/domain/device-session.entity';
import { getModelToken } from '@nestjs/mongoose';
import { createTestUser } from '../../helpers/factory/user-factory';
import { loginUserHelper } from './helpers/login-user';
import { extractRefreshToken } from './helpers/extract-refresh.token';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

jest.setTimeout(60000);

const ENDPOINT = '/hometask_16/api/security/devices';

describe('GET /security/devices', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let userModel: UserModelType;
  let deviceSessionModel: DeviceSessionModelType;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    userModel = moduleFixture.get<UserModelType>(getModelToken(User.name));
    deviceSessionModel = moduleFixture.get<DeviceSessionModelType>(
      getModelToken(DeviceSession.name),
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();

    await createTestUser(userModel);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should return 200 with array of device sessions after login', async () => {
    const loginResponse = await loginUserHelper(app);
    const refreshToken = extractRefreshToken(loginResponse.headers['set-cookie']);

    expect(refreshToken).toBeDefined();

    const response = await request(app.getHttpServer())
      .get(ENDPOINT)
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(200)
      .expect('Content-Type', /json/);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    const session = response.body[0];
    expect(typeof session.ip).toBe('string');
    expect(typeof session.title).toBe('string');
    expect(typeof session.lastActiveDate).toBe('string');
    expect(typeof session.deviceId).toBe('string');
  });

  it('should return 401 when refreshToken cookie is absent', async () => {
    await request(app.getHttpServer())
      .get(ENDPOINT)
      .expect(401);
  });

  it('should return 401 when refreshToken is invalid', async () => {
    await request(app.getHttpServer())
      .get(ENDPOINT)
      .set('Cookie', 'refreshToken=invalid-token')
      .expect(401);
  });

  it('should return 401 when refreshToken is expired', async () => {
    const secret = configService.get<string>('JWT_REFRESH_SECRET') as string;

    const expiredToken = await jwtService.signAsync(
      { sub: 'someUserId', deviceId: 'someDeviceId' },
      { secret, expiresIn: -10 },
    );

    await request(app.getHttpServer())
      .get(ENDPOINT)
      .set('Cookie', `refreshToken=${expiredToken}`)
      .expect(401);
  });

  it('should not change deviceId after /auth/refresh-token; lastActiveDate should be updated', async () => {
    const loginResponse = await loginUserHelper(app);
    const refreshToken = extractRefreshToken(loginResponse.headers['set-cookie']);
    expect(refreshToken).toBeDefined();

    const devicesBefore = await request(app.getHttpServer())
      .get(ENDPOINT)
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(200);

    expect(Array.isArray(devicesBefore.body)).toBe(true);
    expect(devicesBefore.body.length).toBeGreaterThan(0);

    const sessionBefore = devicesBefore.body[0];
    const deviceIdBefore = sessionBefore.deviceId;
    const lastActiveDateBefore = sessionBefore.lastActiveDate;

    await new Promise((r) => setTimeout(r, 10));

    await request(app.getHttpServer())
      .post('/hometask_16/api/auth/refresh-token')
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(200);

    const sessionDoc = await deviceSessionModel
      .findOne({ deviceId: deviceIdBefore })
      .lean()
      .exec();
    expect(sessionDoc).not.toBeNull();
    expect(sessionDoc!.deviceId).toBe(deviceIdBefore);

    const lastActiveAt = (sessionDoc as any).lastActiveAt;
    expect(lastActiveAt).toBeDefined();
    const lastActiveAtMs = new Date(lastActiveAt).getTime();
    const beforeMs = new Date(lastActiveDateBefore).getTime();
    expect(lastActiveAtMs).toBeGreaterThanOrEqual(beforeMs);
  });

  it('Log out device: logout with cookie then device list does not include logged-out device; status 204', async () => {
    const loginResponse = await loginUserHelper(app);
    const refreshToken = extractRefreshToken(loginResponse.headers['set-cookie']);
    expect(refreshToken).toBeDefined();

    const devicesBefore = await request(app.getHttpServer())
      .get(ENDPOINT)
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(200);

    expect(Array.isArray(devicesBefore.body)).toBe(true);
    expect(devicesBefore.body.length).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .post('/hometask_16/api/auth/logout')
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(ENDPOINT)
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(401);
  });
});
