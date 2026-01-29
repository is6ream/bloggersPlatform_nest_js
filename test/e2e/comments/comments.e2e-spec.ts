import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User } from 'src/modules/user-accounts/domain/userEntity';
import { PostEntity } from 'src/modules/bloggers-platform/posts/domain/postEntity';
import { AppModule } from 'src/modules/app-module/appModule';
import request from 'supertest';
import { Comment } from 'src/modules/bloggers-platform/comments/domain/commentEntity';
import { Blog } from 'src/modules/bloggers-platform/blogs/domain/blogEntity';
import { createTestUser } from '../../helpers/factory/user-factory';
import { createTestBlog } from '../../helpers/factory/blog-factory';
import { createTestPost } from '../../helpers/factory/post-factory';
import { appSetup } from 'src/setup/app.setup';

describe('Comments E2E Tests', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let mongoConnection: Connection;
  let moduleFixture: TestingModule;
  let commentModel: any;
  let userModel: any;
  let postModel: any;
  let blogModel: any;
  let authToken: string;
  let testPostId: string;
  let testUserId: string;

  // Константы для URL
  const BASE_URL = '/hometask_15/api';
  const POSTS_BASE = `${BASE_URL}/posts`;
  const COMMENTS_BASE = `${BASE_URL}/comments`;

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

    // Инициализируем модели
    userModel = moduleFixture.get(getModelToken(User.name));
    postModel = moduleFixture.get(getModelToken(PostEntity.name));
    commentModel = moduleFixture.get(getModelToken(Comment.name));
    blogModel = moduleFixture.get(getModelToken(Blog.name));

    // Очищаем базу пользователей
    await userModel.deleteMany({});

    // Создаем тестовые данные
    const testUser = await createTestUser(userModel);
    testUserId = testUser._id.toString();

    // Получаем токен авторизации
    const loginResponse = await request(app.getHttpServer())
      .post(`${BASE_URL}/auth/login`)
      .send({
        loginOrEmail: 'testuser',
        password: 'testpassword',
      });
    authToken = loginResponse.body.accessToken;

    // Создаем блог и пост
    const testBlog = await createTestBlog(blogModel);
    const testPost = await createTestPost(
      postModel,
      testBlog._id.toString(),
      testBlog.name,
    );
    testPostId = testPost._id.toString();
  });

  beforeEach(async () => {
    await commentModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoConnection.close();
    await mongoServer.stop();
    await app.close();
  });

  // --------------------- Группа 1: Валидация контента (400 ошибки) ---------------------
  describe('POST /posts/:postId/comments - Content validation', () => {
    const getCommentUrl = (postId = testPostId) =>
      `${POSTS_BASE}/${postId}/comments`;

    it('should reject content that is too short (400)', async () => {
      await request(app.getHttpServer())
        .post(getCommentUrl())
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'short' })
        .expect(400);
    });

    it('should reject content that is too long (400)', async () => {
      await request(app.getHttpServer())
        .post(getCommentUrl())
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'a'.repeat(401) })
        .expect(400);
    });

    it('should reject content that is not a string (400)', async () => {
      await request(app.getHttpServer())
        .post(getCommentUrl())
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 23 })
        .expect(400);
    });
  });

  // --------------------- Группа 2: Авторизация (401 ошибки) ---------------------
  describe('POST /posts/:postId/comments - Authorization', () => {
    const getCommentUrl = () => `${POSTS_BASE}/${testPostId}/comments`;
    const validCommentData = {
      content: 'Valid comment content with enough length',
    };

    it('should reject request without authorization header (401)', async () => {
      await request(app.getHttpServer())
        .post(getCommentUrl())
        .send(validCommentData)
        .expect(401);
    });

    it('should reject request with invalid token (401)', async () => {
      await request(app.getHttpServer())
        .post(getCommentUrl())
        .set('Authorization', 'Bearer invalid_token_here')
        .send(validCommentData)
        .expect(401);
    });
  });

  // --------------------- Группа 3: Валидация поста (404 ошибки) ---------------------
  describe('POST /posts/:postId/comments - Post validation', () => {
    const validCommentData = {
      content: 'Valid comment content with enough length',
    };

    it('should reject comment for non-existent post (404)', async () => {
      const nonExistentPostId = '507f1f77bcf86cd799439011';

      await request(app.getHttpServer())
        .post(`${POSTS_BASE}/${nonExistentPostId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(validCommentData)
        .expect(404);
    });
  });

  // --------------------- Группа 4: Успешные операции ---------------------
  describe('POST /posts/:postId/comments - Success cases', () => {
    const getCommentUrl = () => `${POSTS_BASE}/${testPostId}/comments`;

    it('should create multiple comments for the same post', async () => {
      const comments = [
        { content: 'First comment with enough length' },
        { content: 'Second comment with enough length' },
        { content: 'Third comment with enough length' },
      ];

      for (const comment of comments) {
        await request(app.getHttpServer())
          .post(getCommentUrl())
          .set('Authorization', `Bearer ${authToken}`)
          .send(comment)
          .expect(201);
      }

      // Опционально: проверить что все создались
      const allComments = await commentModel.find({});
      expect(allComments).toHaveLength(3);
    });
  });

  // --------------------- Группа 5: Обновление комментариев ---------------------
  describe('PUT /comments/:id - Update operations', () => {
    it('should reject update when content is not a string (400)', async () => {
      // Создаем тестовый комментарий
      const comment = await commentModel.create({
        content: 'Original comment content',
        commentatorInfo: {
          userId: testUserId,
          userLogin: 'testuser',
        },
        likesInfo: {
          likesCount: 0,
          dislikesCount: 0,
        },
        postId: testPostId,
      });

      const commentUrl = `${COMMENTS_BASE}/${comment._id.toString()}`;

      // Пытаемся обновить с контентом типа number вместо string
      const invalidUpdateDto = { content: 123456789 }; // number вместо string

      await request(app.getHttpServer())
        .put(commentUrl)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdateDto)
        .expect(400);
    });

    it('should require authorization for updating comment (401)', async () => {
      // Создаем тестовый комментарий
      const comment = await commentModel.create({
        content: 'testtestttesttesttesttest',
        commentatorInfo: {
          userId: 'testuserId',
          userLogin: 'testuserLogin',
        },
        likesInfo: {
          likesCount: 0,
          dislikesCount: 0,
        },
      });

      const commentUrl = `${COMMENTS_BASE}/${comment._id.toString()}`;
      const updateCommentDto = { content: '12345678910111213141515616' };

      // Пытаемся обновить без авторизации
      await request(app.getHttpServer())
        .put(commentUrl)
        .send(updateCommentDto)
        .expect(401);
    });

    it("should return 403 Forbidden when updating another user's comment", async () => {
      // Создаем отдельного пользователя с его комментарием
      const anotherUser = await createTestUser(userModel, {
        login: 'another',
        email: 'another@example.com',
      });

      const anotherUserComment = await commentModel.create({
        content: 'Comment from another user',
        commentatorInfo: {
          userId: anotherUser._id.toString(),
          userLogin: 'another',
        },
        likesInfo: { likesCount: 0, dislikesCount: 0 },
        postId: testPostId,
      });

      // Основной пользователь пытается обновить чужой комментарий
      await request(app.getHttpServer())
        .put(`${COMMENTS_BASE}/${anotherUserComment._id.toString()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: "Trying to update someone else's comment" })
        .expect(403);
    });

    it('should return 404 when updating non-existent comment', async () => {
      const nonExistentCommentId = '507f1f77bcf86cd799439011';

      const validUpdateDto = {
        content: 'This comment does not exist',
      };

      await request(app.getHttpServer())
        .put(`${COMMENTS_BASE}/${nonExistentCommentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(validUpdateDto)
        .expect(404);
    });

    it('should return 204 successfully', async () => {
      //создали пользователя
      const testUser = await createTestUser(userModel);
      testUserId = testUser._id.toString();
      //авторизовались им
      const loginResponse = await request(app.getHttpServer())
        .post(`${BASE_URL}/auth/login`)
        .send({
          loginOrEmail: 'testuser',
          password: 'testpassword',
        });
      authToken = loginResponse.body.accessToken;
      console.log(authToken, 'auth token before comment created');
      //создали комментарий этим пользователем
      const comment = await commentModel.create({
        content: 'Original comment content',
        commentatorInfo: {
          userId: testUserId,
          userLogin: 'testuser',
        },
        likesInfo: {
          likesCount: 0,
          dislikesCount: 0,
        },
        postId: testPostId,
      });

      const content = { content: 't'.repeat(22) };
      const commentId = comment._id.toString();
      const url = `${COMMENTS_BASE}/${commentId}`;
      //обновили комментарий тем же пользователем
      console.log(authToken, 'auth token before comment updated');
      await request(app.getHttpServer())
        .put(url)
        .set('Authorization', `Bearer ${authToken}`)
        .send(content)
        .expect(204);
    });
  });
});
