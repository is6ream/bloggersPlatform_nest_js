import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/modules/app-module/appModule';
import { appSetup } from 'src/setup/app.setup';
import { getModelToken } from '@nestjs/mongoose';
import { PostEntity } from 'src/modules/bloggers-platform/posts/domain/postEntity';
import { Blog } from 'src/modules/bloggers-platform/blogs/domain/blogEntity';
import { User } from 'src/modules/user-accounts/domain/userEntity';
import { createTestUser } from '../../helpers/factory/user-factory';
import request from 'supertest';
import { createTestBlog } from '../../helpers/factory/blog-factory';
import { createTestPost } from '../../helpers/factory/post-factory';
import { createTestCommentForLikes } from '../../helpers/factory/comments-factory';
import { Comment } from 'src/modules/bloggers-platform/comments/domain/commentEntity';
import { expect } from '@jest/globals';
import { Like } from 'src/modules/bloggers-platform/likes/domain/like-entity';

describe('Comments Likes E2E Tests - One user, one comment scenarios', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let mongoConnection: Connection;
  let moduleFixture: TestingModule;
  let commentModel: any;
  let postModel: any;
  let blogModel: any;
  let userModel: any;
  let likeModel: any;

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

    commentModel = moduleFixture.get(getModelToken(Comment.name));
    postModel = moduleFixture.get(getModelToken(PostEntity.name));
    blogModel = moduleFixture.get(getModelToken(Blog.name));
    userModel = moduleFixture.get(getModelToken(User.name));
    likeModel = moduleFixture.get(getModelToken(Like.name));

    // Очищаем базу перед созданием общих данных
    await userModel.deleteMany({});
    await blogModel.deleteMany({});
    await postModel.deleteMany({});
    await commentModel.deleteMany({});
    await likeModel.deleteMany({});

    // Создаем общие данные (пользователь, блог, пост)
    testUser = await createTestUser(userModel);
    testUserId = testUser._id.toString();

    // Получаем токен
    const loginResponse = await request(app.getHttpServer())
      .post('/hometask_15/api/auth/login')
      .send({
        loginOrEmail: 'testuser',
        password: 'testpassword',
      });
    authToken = loginResponse.body.accessToken;

    // Создаем блог и пост (один на все тесты)
    const testBlog = await createTestBlog(blogModel);
    const testPost = await createTestPost(
      postModel,
      testBlog._id.toString(),
      testBlog.name,
    );
    testPostId = testPost._id.toString();
  });

  afterAll(async () => {
    await mongoConnection.close();
    await mongoServer.stop();
    await app.close();
  });

  beforeEach(async () => {
    // Перед КАЖДЫМ тестом очищаем только комментарии и лайки
    // Пользователь, блог и пост остаются (они созданы в beforeAll)
    await commentModel.deleteMany({});
    await likeModel.deleteMany({});
  });

  // Тест 1: Нет лайка → шлем Like → статус Like
  it('1. No like → send Like → should set Like status', async () => {
    // Создаем новый комментарий для этого теста
    const testComment = await createTestCommentForLikes(
      commentModel,
      testPostId,
      testUserId,
      testUser.login,
      {
        content: 'Comment for like test 1',
      },
    );
    const testCommentId = testComment._id.toString();

    // 1. Проверяем начальный статус (должен быть None)
    const initialResponse = await request(app.getHttpServer())
      .get(`/hometask_15/api/comments/${testCommentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(initialResponse.body.likesInfo.myStatus).toBe('None');
    expect(initialResponse.body.likesInfo.likesCount).toBe(0);
    expect(initialResponse.body.likesInfo.dislikesCount).toBe(0);

    // 2. Шлем Like
    await request(app.getHttpServer())
      .put(`/hometask_15/api/comments/${testCommentId}/like-status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        likeStatus: 'Like',
      })
      .expect(204);

    // 3. Проверяем, что статус изменился на Like
    const finalResponse = await request(app.getHttpServer())
      .get(`/hometask_15/api/comments/${testCommentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(finalResponse.body.likesInfo.myStatus).toBe('Like');
    expect(finalResponse.body.likesInfo.likesCount).toBe(1);
    expect(finalResponse.body.likesInfo.dislikesCount).toBe(0);
  });

  // Тест 2: Есть Like → шлем Dislike → статус Dislike
  it('3. Has Like → send Dislike → should set Dislike status', async () => {
    // Создаем новый комментарий для этого теста
    const testComment = await createTestCommentForLikes(
      commentModel,
      testPostId,
      testUserId,
      testUser.login,
      {
        content: 'Comment for like test 3',
      },
    );
    const testCommentId = testComment._id.toString();

    // 1. Сначала ставим Like
    await request(app.getHttpServer())
      .put(`/hometask_15/api/comments/${testCommentId}/like-status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        likeStatus: 'Like',
      })
      .expect(204);

    // 2. Проверяем, что Like установился
    const afterLike = await request(app.getHttpServer())
      .get(`/hometask_15/api/comments/${testCommentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(afterLike.body.likesInfo.myStatus).toBe('Like');
    expect(afterLike.body.likesInfo.likesCount).toBe(1);
    expect(afterLike.body.likesInfo.dislikesCount).toBe(0);

    // 3. Шлем Dislike (должен заменить Like на Dislike)
    await request(app.getHttpServer())
      .put(`/hometask_15/api/comments/${testCommentId}/like-status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        likeStatus: 'Dislike',
      })
      .expect(204);

    // 4. Проверяем, что статус изменился на Dislike
    const finalResponse = await request(app.getHttpServer())
      .get(`/hometask_15/api/comments/${testCommentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(finalResponse.body.likesInfo.myStatus).toBe('Dislike');
    expect(finalResponse.body.likesInfo.likesCount).toBe(0);
    expect(finalResponse.body.likesInfo.dislikesCount).toBe(1);
  });
});
