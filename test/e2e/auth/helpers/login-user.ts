import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';

export async function loginUserHelper(
  app: INestApplication,
): Promise<Response> {
  return request(app.getHttpServer())
    .post('/hometask_16/api/auth/login')
    .send({
      loginOrEmail: 'testuser',
      password: 'testpassword',
    })
    .expect(200);
}