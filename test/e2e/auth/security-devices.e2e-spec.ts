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

jest.setTimeout(60000);

const ENDPOINT = '/hometask_16/api/security/devices';

describe('GET /security/devices', () => {
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

    const db = new Database(deviceSessionsSqlitePath);
    const sessionRow = db
      .prepare(
        `SELECT device_id, last_active_date FROM device_sessions WHERE device_id = ?`,
      )
      .get(deviceIdBefore) as
      | { device_id: string; last_active_date: string }
      | undefined;
    db.close();

    expect(sessionRow).toBeDefined();
    expect(sessionRow!.device_id).toBe(deviceIdBefore);
    expect(sessionRow!.last_active_date).toBeDefined();
    expect(new Date(sessionRow!.last_active_date).getTime()).not.toBeNaN();
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

  it('Four devices: login 4 times from different devices, logout one, GET /security/devices returns list without logged-out device', async () => {
    const authPrefix = '/hometask_16/api/auth';

    await new Promise((r) => setTimeout(r, 11000));

    const login1 = await loginUserHelper(app, 'Device-One');
    await loginUserHelper(app, 'Device-Two');
    await loginUserHelper(app, 'Device-Three');
    const login4 = await loginUserHelper(app, 'Device-Four');

    const refreshToken1 = extractRefreshToken(login1.headers['set-cookie']);
    const refreshToken4 = extractRefreshToken(login4.headers['set-cookie']);

    expect(refreshToken1).toBeDefined();
    expect(refreshToken4).toBeDefined();
    if (!refreshToken4) return;

    const payload4 = jwtService.decode(refreshToken4) as { deviceId?: string } | null;
    expect(payload4?.deviceId).toBeDefined();
    const loggedOutDeviceId = payload4?.deviceId ?? '';

    const devicesBeforeLogout = await request(app.getHttpServer())
      .get(ENDPOINT)
      .set('Cookie', `refreshToken=${refreshToken4}`)
      .expect(200);

    expect(Array.isArray(devicesBeforeLogout.body)).toBe(true);
    const deviceIdsBefore = devicesBeforeLogout.body.map(
      (s: { deviceId: string }) => s.deviceId,
    );
    expect(deviceIdsBefore).toContain(loggedOutDeviceId);

    await request(app.getHttpServer())
      .post(`${authPrefix}/logout`)
      .set('Cookie', `refreshToken=${refreshToken4}`)
      .expect(204);

    const devicesAfterLogout = await request(app.getHttpServer())
      .get(ENDPOINT)
      .set('Cookie', `refreshToken=${refreshToken1}`)
      .expect(200)
      .expect('Content-Type', /json/);

    expect(Array.isArray(devicesAfterLogout.body)).toBe(true);
    const remainingDeviceIds = devicesAfterLogout.body.map(
      (s: { deviceId: string }) => s.deviceId,
    );
    expect(remainingDeviceIds).not.toContain(loggedOutDeviceId);
    expect(devicesAfterLogout.body).toHaveLength(devicesBeforeLogout.body.length - 1);

    await request(app.getHttpServer())
      .get(ENDPOINT)
      .set('Cookie', `refreshToken=${refreshToken4}`)
      .expect(401);
  });
});
