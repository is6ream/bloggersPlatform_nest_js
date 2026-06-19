import { HttpStatus, INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { e2eApiPath } from '../../helpers/api-path';

const AUTH_LOGIN_PATH = e2eApiPath('auth/login');

export async function createAccessTokenForUser(
  app: INestApplication,
  userId: string,
): Promise<string> {
  const jwtService = app.get(JwtService);
  const configService = app.get(ConfigService);
  const secret = configService.getOrThrow<string>('JWT_SECRET');

  return jwtService.signAsync(
    { sub: userId, deviceId: randomUUID() },
    { secret, expiresIn: '15m' },
  );
}

export async function loginAndGetAccessToken(
  app: INestApplication,
  loginOrEmail: string,
  password: string,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post(AUTH_LOGIN_PATH)
    .send({ loginOrEmail, password })
    .expect(HttpStatus.OK);

  return res.body.accessToken as string;
}
