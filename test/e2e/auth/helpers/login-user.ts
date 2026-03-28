import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';

const defaultCredentials = {
  loginOrEmail: 'testuser',
  password: 'testpassword',
};

export async function loginUserHelper(
  app: INestApplication,
  userAgent?: string,
): Promise<Response> {
  let req = request(app.getHttpServer()).post('/hometask_16/api/auth/login');

  if (userAgent) {
    req = req.set('User-Agent', userAgent);
  }

  return req.send(defaultCredentials);
}