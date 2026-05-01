import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { EmailAdapter } from 'src/modules/notifications/email-adapter';
import { e2eApiPath } from '../helpers/api-path';
import { loginUserHelper } from './helpers/login-user';
import { extractRefreshToken } from './helpers/extract-refresh.token';
import {
  insertE2eUser,
  findE2eUserConfirmationCode,
  findE2eUserRecoveryCode,
} from '../helpers/users-pg-e2e';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import { assignE2eDeviceSessionsPgConfig } from '../helpers/device-sessions-postgres-e2e';

jest.setTimeout(60000);

const REGISTRATION_PATH = e2eApiPath('auth/registration');
const LOGIN_PATH = e2eApiPath('auth/login');
const ME_PATH = e2eApiPath('auth/me');
const CONFIRMATION_PATH = e2eApiPath('auth/registration-confirmation');
const RESENDING_PATH = e2eApiPath('auth/registration-email-resending');
const REFRESH_PATH = e2eApiPath('auth/refresh-token');
const LOGOUT_PATH = e2eApiPath('auth/logout');
const PASSWORD_RECOVERY_PATH = e2eApiPath('auth/password-recovery');
const NEW_PASSWORD_PATH = e2eApiPath('auth/new-password');
const TESTING_PATH = e2eApiPath('testing/all-data');

const DEFAULT_USER = {
  login: 'testuser',
  email: 'test@example.com',
  password: 'testpassword',
};

// ─── Shared app instance ──────────────────────────────────────────────────────

let app: INestApplication;
let moduleFixture: TestingModule;
let emailSpy: jest.Mock;

beforeAll(async () => {
  assignE2eDeviceSessionsPgConfig();
  emailSpy = jest.fn().mockResolvedValue(undefined);

  moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(EmailAdapter)
    .useValue({ sendConfirmationCodeEmail: emailSpy })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  app = moduleFixture.createNestApplication();
  appSetup(app);
  await app.init();
});

afterAll(async () => {
  await app?.close();
});

// clear all data + reset spy before each test
beforeEach(async () => {
  await request(app.getHttpServer()).delete(TESTING_PATH).expect(204);
  emailSpy.mockClear();
});

// ─── POST /auth/registration ──────────────────────────────────────────────────

describe('POST /auth/registration', () => {
  it('400 — login shorter than 3 chars', async () => {
    await request(app.getHttpServer())
      .post(REGISTRATION_PATH)
      .send({ login: 'ab', password: 'validpass', email: 'v@v.com' })
      .expect(400);
  });

  it('400 — login longer than 10 chars', async () => {
    await request(app.getHttpServer())
      .post(REGISTRATION_PATH)
      .send({ login: 'toolonglogin', password: 'validpass', email: 'v@v.com' })
      .expect(400);
  });

  it('400 — login with space', async () => {
    await request(app.getHttpServer())
      .post(REGISTRATION_PATH)
      .send({ login: 'bad user', password: 'validpass', email: 'v@v.com' })
      .expect(400);
  });

  it('400 — login with @ symbol', async () => {
    await request(app.getHttpServer())
      .post(REGISTRATION_PATH)
      .send({ login: 'bad@user', password: 'validpass', email: 'v@v.com' })
      .expect(400);
  });

  it('400 — password shorter than 6 chars', async () => {
    await request(app.getHttpServer())
      .post(REGISTRATION_PATH)
      .send({ login: 'oklogin', password: '123', email: 'v@v.com' })
      .expect(400);
  });

  it('400 — password longer than 20 chars', async () => {
    await request(app.getHttpServer())
      .post(REGISTRATION_PATH)
      .send({
        login: 'oklogin',
        password: 'thispasswordistoolongforvalidation',
        email: 'v@v.com',
      })
      .expect(400);
  });

  it('400 — invalid email format', async () => {
    await request(app.getHttpServer())
      .post(REGISTRATION_PATH)
      .send({ login: 'oklogin', password: 'validpass', email: 'not-an-email' })
      .expect(400);
  });

  it('400 — missing required fields', async () => {
    await request(app.getHttpServer())
      .post(REGISTRATION_PATH)
      .send({})
      .expect(400);
  });

  it('204 — successful registration + email sent once', async () => {
    await request(app.getHttpServer())
      .post(REGISTRATION_PATH)
      .send(DEFAULT_USER)
      .expect(204);

    expect(emailSpy).toHaveBeenCalledTimes(1);
    expect(emailSpy).toHaveBeenCalledWith(
      DEFAULT_USER.email,
      expect.any(String),
    );
  });

  it('204 — duplicate login is silently ignored, email not sent again', async () => {
    await request(app.getHttpServer())
      .post(REGISTRATION_PATH)
      .send(DEFAULT_USER)
      .expect(204);

    emailSpy.mockClear();

    await request(app.getHttpServer())
      .post(REGISTRATION_PATH)
      .send({ ...DEFAULT_USER, email: 'other@example.com' })
      .expect(400);

    expect(emailSpy).toHaveBeenCalledTimes(0);
  });
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await insertE2eUser({
      login: DEFAULT_USER.login,
      email: DEFAULT_USER.email,
      passwordPlain: DEFAULT_USER.password,
      isEmailConfirmed: true,
    });
  });

  it('400 — empty loginOrEmail', async () => {
    await request(app.getHttpServer())
      .post(LOGIN_PATH)
      .send({ loginOrEmail: '', password: 'somepass' })
      .expect(400);
  });

  it('400 — empty password', async () => {
    await request(app.getHttpServer())
      .post(LOGIN_PATH)
      .send({ loginOrEmail: 'testuser', password: '' })
      .expect(400);
  });

  it('401 — wrong password', async () => {
    await request(app.getHttpServer())
      .post(LOGIN_PATH)
      .send({ loginOrEmail: DEFAULT_USER.login, password: 'wrongpassword' })
      .expect(401);
  });

  it('401 — non-existent user', async () => {
    await request(app.getHttpServer())
      .post(LOGIN_PATH)
      .send({ loginOrEmail: 'nobody', password: 'somepass' })
      .expect(401);
  });

  it('200 — returns accessToken + refreshToken HttpOnly cookie', async () => {
    const res = await request(app.getHttpServer())
      .post(LOGIN_PATH)
      .send({
        loginOrEmail: DEFAULT_USER.login,
        password: DEFAULT_USER.password,
      })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(typeof res.body.accessToken).toBe('string');
    expect(res.body.accessToken.length).toBeGreaterThan(0);

    const cookie = res.headers['set-cookie'];
    const refreshToken = extractRefreshToken(cookie);
    expect(refreshToken).toBeTruthy();

    const firstCookie = Array.isArray(cookie) ? cookie[0] : (cookie as string);
    expect(firstCookie).toContain('HttpOnly');
  });
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────

describe('GET /auth/me', () => {
  beforeEach(async () => {
    await insertE2eUser({
      login: DEFAULT_USER.login,
      email: DEFAULT_USER.email,
      passwordPlain: DEFAULT_USER.password,
      isEmailConfirmed: true,
    });
  });

  it('401 — no Authorization header', async () => {
    await request(app.getHttpServer()).get(ME_PATH).expect(401);
  });

  it('401 — invalid JWT', async () => {
    await request(app.getHttpServer())
      .get(ME_PATH)
      .set('Authorization', 'Bearer invalidtoken')
      .expect(401);
  });

  it('401 — expired JWT', async () => {
    const jwtService = moduleFixture.get<JwtService>(JwtService);
    const configService = moduleFixture.get<ConfigService>(ConfigService);
    const secret = configService.get<string>('JWT_SECRET') as string;

    const expiredToken = await jwtService.signAsync(
      { id: 'some-user-id' },
      { secret, expiresIn: -10 },
    );

    await request(app.getHttpServer())
      .get(ME_PATH)
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('200 — returns user info with valid accessToken', async () => {
    const loginRes = await loginUserHelper(app);
    const accessToken = loginRes.body.accessToken as string;

    const res = await request(app.getHttpServer())
      .get(ME_PATH)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('email', DEFAULT_USER.email);
    expect(res.body).toHaveProperty('login', DEFAULT_USER.login);
    expect(res.body).toHaveProperty('userId');
    expect(typeof res.body.userId).toBe('string');
  });
});

// ─── POST /auth/registration-confirmation ─────────────────────────────────────

describe('POST /auth/registration-confirmation', () => {
  it('400 — missing code field', async () => {
    await request(app.getHttpServer())
      .post(CONFIRMATION_PATH)
      .send({})
      .expect(400);
  });

  it('400 — non-existent confirmation code', async () => {
    await request(app.getHttpServer())
      .post(CONFIRMATION_PATH)
      .send({ code: 'non-existent-code-00000000' })
      .expect(400);
  });

  it('400 — already confirmed user', async () => {
    await insertE2eUser({
      login: 'confirmed',
      email: 'confirmed@example.com',
      passwordPlain: 'pass1234',
      isEmailConfirmed: true,
    });

    const code = await findE2eUserConfirmationCode('confirmed@example.com');
    expect(code).toBeTruthy();

    await request(app.getHttpServer())
      .post(CONFIRMATION_PATH)
      .send({ code })
      .expect(400);
  });

  it('204 — valid code confirms the user', async () => {
    await insertE2eUser({
      login: 'toconfirm',
      email: 'toconfirm@example.com',
      passwordPlain: 'pass1234',
      isEmailConfirmed: false,
    });

    const code = await findE2eUserConfirmationCode('toconfirm@example.com');
    expect(code).toBeTruthy();

    await request(app.getHttpServer())
      .post(CONFIRMATION_PATH)
      .send({ code })
      .expect(204);
  });
});

// ─── POST /auth/registration-email-resending ──────────────────────────────────

describe('POST /auth/registration-email-resending', () => {
  it('400 — invalid email format', async () => {
    await request(app.getHttpServer())
      .post(RESENDING_PATH)
      .send({ email: 'not-an-email' })
      .expect(400);
  });

  it('400 — non-existent email', async () => {
    await request(app.getHttpServer())
      .post(RESENDING_PATH)
      .send({ email: 'nobody@example.com' })
      .expect(400);
  });

  it('400 — email already confirmed', async () => {
    await insertE2eUser({
      login: 'alreadyconf',
      email: 'alreadyconf@example.com',
      passwordPlain: 'pass1234',
      isEmailConfirmed: true,
    });

    await request(app.getHttpServer())
      .post(RESENDING_PATH)
      .send({ email: 'alreadyconf@example.com' })
      .expect(400);
  });

  it('204 — valid unconfirmed email resends confirmation code', async () => {
    await insertE2eUser({
      login: 'pendinguser',
      email: 'pending@example.com',
      passwordPlain: 'pass1234',
      isEmailConfirmed: false,
    });

    await request(app.getHttpServer())
      .post(RESENDING_PATH)
      .send({ email: 'pending@example.com' })
      .expect(204);

    expect(emailSpy).toHaveBeenCalledTimes(1);
    expect(emailSpy).toHaveBeenCalledWith(
      'pending@example.com',
      expect.any(String),
    );
  });
});

// ─── POST /auth/refresh-token ─────────────────────────────────────────────────

describe('POST /auth/refresh-token', () => {
  beforeEach(async () => {
    await insertE2eUser({
      login: DEFAULT_USER.login,
      email: DEFAULT_USER.email,
      passwordPlain: DEFAULT_USER.password,
      isEmailConfirmed: true,
    });
  });

  it('401 — no refreshToken cookie', async () => {
    await request(app.getHttpServer()).post(REFRESH_PATH).expect(401);
  });

  it('401 — invalid refreshToken value', async () => {
    await request(app.getHttpServer())
      .post(REFRESH_PATH)
      .set('Cookie', 'refreshToken=invalid-token')
      .expect(401);
  });

  it('401 — expired refreshToken', async () => {
    const jwtService = moduleFixture.get<JwtService>(JwtService);
    const configService = moduleFixture.get<ConfigService>(ConfigService);
    const secret = configService.get<string>('JWT_REFRESH_SECRET') as string;

    const expiredToken = await jwtService.signAsync(
      { sub: 'some-id', deviceId: 'some-device' },
      { secret, expiresIn: -10 },
    );

    await request(app.getHttpServer())
      .post(REFRESH_PATH)
      .set('Cookie', `refreshToken=${expiredToken}`)
      .expect(401);
  });

  it('401 — reusing same refreshToken after it was already rotated', async () => {
    const loginRes = await loginUserHelper(app);
    const savedToken = extractRefreshToken(loginRes.headers['set-cookie']);
    expect(savedToken).toBeTruthy();

    await request(app.getHttpServer())
      .post(REFRESH_PATH)
      .set('Cookie', `refreshToken=${savedToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(REFRESH_PATH)
      .set('Cookie', `refreshToken=${savedToken}`)
      .expect(401);
  });

  it('200 — valid token returns new accessToken + new refreshToken', async () => {
    const loginRes = await loginUserHelper(app);
    const oldToken = extractRefreshToken(loginRes.headers['set-cookie']);
    expect(oldToken).toBeTruthy();

    const res = await request(app.getHttpServer())
      .post(REFRESH_PATH)
      .set('Cookie', `refreshToken=${oldToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(typeof res.body.accessToken).toBe('string');

    const newToken = extractRefreshToken(res.headers['set-cookie']);
    expect(newToken).toBeTruthy();
    expect(newToken).not.toBe(oldToken);
  });
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────

describe('POST /auth/logout', () => {
  beforeEach(async () => {
    await insertE2eUser({
      login: DEFAULT_USER.login,
      email: DEFAULT_USER.email,
      passwordPlain: DEFAULT_USER.password,
      isEmailConfirmed: true,
    });
  });

  it('401 — no refreshToken cookie', async () => {
    await request(app.getHttpServer()).post(LOGOUT_PATH).expect(401);
  });

  it('401 — expired refreshToken', async () => {
    const jwtService = moduleFixture.get<JwtService>(JwtService);
    const configService = moduleFixture.get<ConfigService>(ConfigService);
    const secret = configService.get<string>('JWT_REFRESH_SECRET') as string;

    const expiredToken = await jwtService.signAsync(
      { sub: 'some-id', deviceId: 'some-device' },
      { secret, expiresIn: -10 },
    );

    await request(app.getHttpServer())
      .post(LOGOUT_PATH)
      .set('Cookie', `refreshToken=${expiredToken}`)
      .expect(401);
  });

  it('204 — successful logout; same token on /refresh-token returns 401', async () => {
    const loginRes = await loginUserHelper(app);
    const token = extractRefreshToken(loginRes.headers['set-cookie']);
    expect(token).toBeTruthy();

    await request(app.getHttpServer())
      .post(LOGOUT_PATH)
      .set('Cookie', `refreshToken=${token}`)
      .expect(204);

    await request(app.getHttpServer())
      .post(REFRESH_PATH)
      .set('Cookie', `refreshToken=${token}`)
      .expect(401);
  });
});

// ─── POST /auth/password-recovery ─────────────────────────────────────────────

describe('POST /auth/password-recovery', () => {
  it('400 — invalid email format', async () => {
    await request(app.getHttpServer())
      .post(PASSWORD_RECOVERY_PATH)
      .send({ email: 'not-valid-email' })
      .expect(400);
  });

  it('400 — email with missing domain', async () => {
    await request(app.getHttpServer())
      .post(PASSWORD_RECOVERY_PATH)
      .send({ email: '@nodomain' })
      .expect(400);
  });

  it('204 — non-existent email returns 204 (no info leak)', async () => {
    await request(app.getHttpServer())
      .post(PASSWORD_RECOVERY_PATH)
      .send({ email: 'nobody@example.com' })
      .expect(204);

    expect(emailSpy).toHaveBeenCalledTimes(0);
  });

  it('204 — existing email returns 204 and sends recovery email', async () => {
    await insertE2eUser({
      login: 'recoverme',
      email: 'recoverme@example.com',
      passwordPlain: 'oldpass123',
      isEmailConfirmed: true,
    });

    await request(app.getHttpServer())
      .post(PASSWORD_RECOVERY_PATH)
      .send({ email: 'recoverme@example.com' })
      .expect(204);

    expect(emailSpy).toHaveBeenCalledTimes(1);
    expect(emailSpy).toHaveBeenCalledWith(
      'recoverme@example.com',
      expect.any(String),
    );
  });
});

// ─── POST /auth/new-password ──────────────────────────────────────────────────

describe('POST /auth/new-password', () => {
  it('400 — newPassword shorter than 6 chars', async () => {
    await request(app.getHttpServer())
      .post(NEW_PASSWORD_PATH)
      .send({ newPassword: 'abc', recoveryCode: 'some-code' })
      .expect(400);
  });

  it('400 — newPassword longer than 20 chars', async () => {
    await request(app.getHttpServer())
      .post(NEW_PASSWORD_PATH)
      .send({
        newPassword: 'thispasswordistoolongforvalidation',
        recoveryCode: 'some-code',
      })
      .expect(400);
  });

  it('400 — missing recoveryCode field', async () => {
    await request(app.getHttpServer())
      .post(NEW_PASSWORD_PATH)
      .send({ newPassword: 'newpass123' })
      .expect(400);
  });

  it('400 — non-existent recoveryCode', async () => {
    await request(app.getHttpServer())
      .post(NEW_PASSWORD_PATH)
      .send({ newPassword: 'newpass123', recoveryCode: 'non-existent-code' })
      .expect(404);
  });

  it('204 — valid recovery code resets password; old login 401, new login 200', async () => {
    await insertE2eUser({
      login: 'pwchange',
      email: 'pwchange@example.com',
      passwordPlain: 'oldpass123',
      isEmailConfirmed: true,
    });

    await request(app.getHttpServer())
      .post(PASSWORD_RECOVERY_PATH)
      .send({ email: 'pwchange@example.com' })
      .expect(204);

    const recoveryCode = await findE2eUserRecoveryCode('pwchange@example.com');
    expect(recoveryCode).toBeTruthy();

    await request(app.getHttpServer())
      .post(NEW_PASSWORD_PATH)
      .send({ newPassword: 'newpass456', recoveryCode })
      .expect(204);

    await request(app.getHttpServer())
      .post(LOGIN_PATH)
      .send({ loginOrEmail: 'pwchange', password: 'oldpass123' })
      .expect(401);

    await request(app.getHttpServer())
      .post(LOGIN_PATH)
      .send({ loginOrEmail: 'pwchange', password: 'newpass456' })
      .expect(200);
  });
});
