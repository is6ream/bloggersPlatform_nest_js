import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from 'src/modules/appModule/appModule';
import { appSetup } from 'src/setup/app.setup';
import { App } from 'supertest/types';
import request from 'supertest';
import { UsersService } from 'src/modules/user-accounts/application/user-service';
import { createFourUsers, usersEntities } from '../helpers/createUsers';

describe('User CRUD (e2e)', () => {
  let app: INestApplication<App>;
  let usersService: UsersService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();

    usersService = moduleFixture.get<UsersService>(UsersService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users, GET', async () => {
    await createFourUsers(usersEntities, usersService);
    return request(app.getHttpServer())
      .get('/hometask_13/api/users')
      .expect(200);
  });
});
