import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { e2eApiPath } from '../../helpers/api-path';

const AUTH_LOGIN_PATH = e2eApiPath('auth/login');

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
