import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';
import { e2eApiPath } from '../../helpers/api-path';

const defaultCredentials = {
  loginOrEmail: 'testuser',
  password: 'testpassword',
};

type LoginCredentials = {
  loginOrEmail: string;
  password: string;
};

export async function loginUserHelper(
  app: INestApplication,
  userAgent?: string,
  credentials: LoginCredentials = defaultCredentials,
): Promise<Response> {
  let req = request(app.getHttpServer()).post(e2eApiPath('auth/login'));

  if (userAgent) {
    req = req.set('User-Agent', userAgent);
  }

  return req.send(credentials);
}