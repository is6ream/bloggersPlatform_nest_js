import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User } from 'src/modules/user-accounts/domain/userEntity';
import { PostEntity } from 'src/modules/bloggers-platform/posts/domain/postEntity';
import { AppModule } from 'src/modules/app-module/appModule';
import request from 'supertest';
import { BcryptService } from 'src/modules/user-accounts/application/bcrypt-service';

describe('Comments E2E Tests', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let mongoConnection: Connection;
  let moduleFixture: TestingModule;
  let commentModel: any;
  let userModel: any;
  let authToken: string;
  let testPostId: string;
  let testUserId: string;

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
    await app.init();

    userModel = moduleFixture.get(getModelToken(User.name));
    const postModel = moduleFixture.get(getModelToken(PostEntity.name));
    commentModel = moduleFixture.get(getModelToken('Comment'));

    const password: string = 'passwordHash';
    const passwordHash: string = await new BcryptService().generateHash(
      password,
    );

    const testUser = await userModel.create({
      login: 'danil2002',
      email: 'danil@email.com',
      passwordHash: passwordHash,
    });
    testUserId = testUser._id.toString();

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        loginOrEmail: 'danil2002',
        password: 'passwordHash',
      });

    authToken = loginResponse.body.accessToken;

    const testPost = await postModel.create({
      title: 'Test Post',
      shortDescription: 'Test Description',
      content: 'Test Content',
      blogId: 'test-blog-id',
      blogName: 'Test Blog',
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    });
    testPostId = testPost._id.toString();
  });

  afterAll(async () => {
    await mongoConnection.close();
    await mongoServer.stop();
    await app.close();
  });

  beforeEach(async () => {
    await commentModel.deleteMany({});
  });

  beforeAll(async () => {
    await userModel.deleteMany({});
  });

  it('should reject invalid content - too short (400)', async () => {
    const invalidData = {
      content: 'short',
    };

    await request(app.getHttpServer())
      .post(`/posts/${testPostId}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidData)
      .expect(400);
  });

  it('should reject invalid content - too long (400)', async () => {
    const invalidData = {
      content: 'a'.repeat(401), // Допустим максимум 400 символов
    };

    await request(app.getHttpServer())
      .post(`/posts/${testPostId}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidData)
      .expect(400);
  });

  it('should reject without authorization (401)', async () => {
    const commentData = {
      content: 'Comment without auth',
    };

    await request(app.getHttpServer())
      .post(`/posts/${testPostId}/comments`)
      .send(commentData)
      .expect(401);
  });

  it('should reject with invalid token (401)', async () => {
    const commentData = {
      content: 'Comment with invalid token',
    };

    await request(app.getHttpServer())
      .post(`/posts/${testPostId}/comments`)
      .set('Authorization', 'Bearer invalid_token_here')
      .send(commentData)
      .expect(401);
  });

  it('should reject for non-existent post (404)', async () => {
    const nonExistentPostId = '507f1f77bcf86cd799439011'; // Valid ObjectId
    const commentData = {
      content: 'Comment for non-existent post',
    };

    await request(app.getHttpServer())
      .post(`/posts/${nonExistentPostId}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(commentData)
      .expect(404);
  });

  it('should reject invalid post ID format (400)', async () => {
    const invalidPostId = 'not-a-valid-object-id';
    const commentData = {
      content: 'Comment with invalid post ID',
    };

    await request(app.getHttpServer())
      .post(`/posts/${invalidPostId}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(commentData)
      .expect(400);
  });

  it('should create multiple comments for same post', async () => {
    const comments = [
      { content: 'First comment with enough length' },
      { content: 'Second comment with enough length' },
      { content: 'Third comment with enough length' },
    ];

    for (const comment of comments) {
      await request(app.getHttpServer())
        .post(`/posts/${testPostId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(comment)
        .expect(201);
    }

    // Можно добавить проверку что все комментарии создались
    // GET /posts/:id/comments и проверить count
  });

  describe('Integration: Comment + Like status', () => {
    it('should return comment with correct myStatus', async () => {
      // 1. Создаем комментарий
      const createResponse = await request(app.getHttpServer())
        .post(`/posts/${testPostId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Comment to test like status' })
        .expect(201);

      const commentId = createResponse.body.id;

      // 2. Проверяем что изначально myStatus = 'None'
      expect(createResponse.body.likesInfo.myStatus).toBe('None');

      // 3. Ставим лайк (если есть эндпоинт PUT /comments/:id/like-status)
      await request(app.getHttpServer())
        .put(`/comments/${commentId}/like-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ likeStatus: 'Like' })
        .expect(204); // или 200

      // 4. Получаем комментарий снова и проверяем myStatus
      const getResponse = await request(app.getHttpServer())
        .get(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.likesInfo.myStatus).toBe('Like');
    });
  });
});
