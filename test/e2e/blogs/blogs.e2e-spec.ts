import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeAll, expect } from '@jest/globals';
import { AppModule } from 'src/modules/app-module/appModule';
import { appSetup } from 'src/setup/app.setup';
import { getModelToken } from '@nestjs/mongoose';
import { PostEntity } from 'src/modules/bloggers-platform/posts/domain/postEntity';
import {
  Blog,
  BlogDocument,
} from 'src/modules/bloggers-platform/blogs/domain/blogEntity';
import { createTestBlog } from '../../helpers/factory/blog-factory';
import request from 'supertest';
import { createTestBlogs } from '../../helpers/blogs/create-blogs-helper';
describe('Blogs E2E Tests', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let mongoConnection: Connection;
  let moduleFixture: TestingModule;
  let postModel: any;
  let blogModel: any;
  let testBlogId: any;
  let testPostId: any;

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

    postModel = moduleFixture.get(getModelToken(PostEntity.name));
    blogModel = moduleFixture.get(getModelToken(Blog.name));
  });

  beforeEach(async () => {
    await blogModel.deleteMany({});
  });

  describe('GET /blogs', () => {
    it('should get all blogs', async () => {
      //нужно создать 4 блога и протестировать req.body
      await createTestBlogs(blogModel, 4);
      let response = await request(app.getHttpServer())
        .get('/hometask_15/api/blogs')
        .expect(200);

      console.log(response.body, 'response body check');
      expect(response.body.items.length).toBe(4);
    });

    it('should have correct pagination structure', async () => {
      await createTestBlogs(blogModel, 4);

      const response = await request(app.getHttpServer())
        .get('/hometask_15/api/blogs')
        .expect(200);

      //ожидаемое количество страниц
      const expectedPagesCount = Math.ceil(
        response.body.totalCount / response.body.pageSize,
      );
      expect(response.body.pagesCount).toBe(expectedPagesCount);

      // page не должен быть больше pagesCount
      expect(response.body.page).toBeLessThanOrEqual(response.body.pagesCount);
    });

    it('should use default query parameters when not provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/hometask_15/api/blogs')
        .expect(200);

      // Проверяем дефолтные значения
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBeGreaterThan(0);
      expect(response.body.pageSize).toBe(10);
    });

    it('should not return deleted blogs', async () => {
      // Создаем и удаляем один блог
      const blogToDelete: BlogDocument = await createTestBlog(blogModel, {
        name: 'To be deleted',
      });
      blogToDelete.makeDeleted();
      console.log(blogToDelete, 'check delete field');
      await blogToDelete.save();

      const response = await request(app.getHttpServer())
        .get('/hometask_15/api/blogs')
        .expect(200);

      // Убеждаемся, что удаленный блог не в ответе
      const deletedBlogInResponse = response.body.items.find(
        (b: any) => b.id === blogToDelete._id.toString(),
      );
      expect(deletedBlogInResponse).toEqual(undefined);
    });
  });

  const VALID_AUTH = 'Basic YWRtaW46cXdlcnR5'; // admin:qwerty
  let testBlog: any;

  describe('POST /blogs', () => {
    it('should create blog successfully - 201 Created', async () => {
      const blogData = {
        name: 'New Blog',
        description: 'Blog description',
        websiteUrl: 'https://example.com',
      };

      const response = await request(app.getHttpServer())
        .post('/hometask_15/api/blogs')
        .set('Authorization', VALID_AUTH)
        .send(blogData)
        .expect(201);

      // Базовая проверка ответа
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(blogData.name);
      expect(response.body.description).toBe(blogData.description);
      expect(response.body.websiteUrl).toBe(blogData.websiteUrl);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('isMembership');
    });

    it('should return 401 Unauthorized without auth', async () => {
      const blogData = {
        name: 'Unauthorized Blog',
        description: 'Should fail',
        websiteUrl: 'https://example.com',
      };

      await request(app.getHttpServer())
        .post('/hometask_15/api/blogs')
        .send(blogData) // нет Authorization header
        .expect(401);
    });

    it('should return 400 Bad Request for invalid data', async () => {
      const invalidBlogData = {
        name: '123456789101112123', // слишком длинное имя
        description: 'Valid description',
        websiteUrl: 'not-a-valid-url', // невалидный URL
      };

      await request(app.getHttpServer())
        .post('/hometask_15/api/blogs')
        .set('Authorization', VALID_AUTH)
        .send(invalidBlogData)
        .expect(400);
    });
  });
});
