import { beforeAll, expect } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect } from 'mongoose';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../../src/modules/app-module/appModule';
import { appSetup } from '../../../src/setup/app.setup';
import { getModelToken } from '@nestjs/mongoose';
import { INestApplication } from '@nestjs/common';
import { User } from '../../../src/modules/user-accounts/domain/userEntity';
import { createTestUser } from '../../helpers/factory/user-factory';
import request from 'supertest';
describe('Auth e2e tests', () => {
  let mongoServer: any;
  let mongoClient: any;
  let mongoConnection: any;
  let moduleFixture: any;
  let app: INestApplication;
  let userModel: any;

  // Общие данные для всех тестов
  let testUser: any;
  let testUserId: string;
  let testPostId: string;
  let authToken: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    mongoConnection = (await connect(mongoUri)).connection;

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('MONGO_CONNECTION')
      .useValue(mongoConnection)
      .compile();

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();

    userModel = moduleFixture.get(getModelToken(User.name));
  });

  it('should success authentication', async () => {
    testUser = await createTestUser(userModel);

    const authResponse = await request(app.getHttpServer())
      .post('/hometask_15/api/auth/login')
      .send({
        loginOrEmail: 'testuser',
        password: 'testpassword',
      });

    // Проверяем, что куки установлены
    expect(authResponse.headers['set-cookie']).toBeDefined();

    // Ищем конкретную куку
    const cookies = authResponse.headers['set-cookie'] ;
    console.log('Cookies check: ', cookies);
    // const refreshTokenCookie = cookies.find((cookie) =>
    //   cookie.includes('refresh_token'),
    // );
    //
    // expect(refreshTokenCookie).toBeDefined();
    //
    // expect(refreshTokenCookie).toContain('HttpOnly');
    // expect(refreshTokenCookie).toContain('Secure'); // если используешь HTTPS
  });

  afterAll(async () => {
    // Очистка после всех тестов
    await mongoConnection.close();
    await mongoServer.stop();
    await app.close();
  });
});
