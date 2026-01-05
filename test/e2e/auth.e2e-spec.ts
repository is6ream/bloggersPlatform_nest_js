import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from 'src/modules/app-module/appModule';

//поднять в докере бд
//докер декстоп виндовс - как поднять монго
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    try {
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();

      await mongoose.connect(mongoUri);

      const moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider('MONGODB_URI')
        .useValue(mongoUri)
        .compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    } catch (err: unknown) {
      console.log(err);
    }
  });

  afterAll(async () => {
    await app.close();

    await mongoose.disconnect();

    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  it('/auth/registration (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/registration')
      .send({
        login: 'testuser',
        password: 'password123',
        email: 'test@example.com',
      })
      .expect(201);
  });
});
