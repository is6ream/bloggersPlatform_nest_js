// test/posts.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect } from 'mongoose';

describe('PostsController (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let mongoConnection: Connection;

  // Тестовые данные
  let userToken: string;
  let userId: string;
  let userLogin: string;
  let blogId: string;
  const postIds: string[] = [];

  beforeAll(async () => {
    // Создаем in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('DATABASE_CONNECTION')
      .useValue(await connect(uri))
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // Получаем подключение для очистки БД
    mongoConnection = (await connect(uri)).connection;
  });

  beforeEach(async () => {
    // Очищаем БД перед каждым тестом
    await mongoConnection.dropDatabase();

    // Регистрируем и авторизуем пользователя
    userLogin = 'testuser';
    const password = 'testpassword123';

    // Регистрация пользователя
    await request(app.getHttpServer())
      .post('/sa/users')
      .send({
        login: userLogin,
        password: password,
        email: 'test@example.com',
      })
      .expect(201);

    // Авторизация
    const authResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        loginOrEmail: userLogin,
        password: password,
      })
      .expect(200);

    userToken = authResponse.body.accessToken;
    userId = authResponse.body.userId || 'test-user-id';

    // Создаем блог для постов
    const blogResponse = await request(app.getHttpServer())
      .post('/blogger/blogs')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Test Blog',
        description: 'Test blog description',
        websiteUrl: 'https://testblog.com',
      })
      .expect(201);

    blogId = blogResponse.body.id;
  });

  afterAll(async () => {
    // Закрываем приложение и соединение с БД
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongoServer.stop();
    await app.close();
  });

  describe('GET /posts - получение всех постов с лайками', () => {
    it('должен вернуть посты с правильными данными о лайках для авторизованного пользователя', async () => {
      // Шаг 1: Создаем 4 поста
      const postsData = [
        {
          title: 'Post 1',
          shortDescription: 'Description 1',
          content: 'Content 1',
        },
        {
          title: 'Post 2',
          shortDescription: 'Description 2',
          content: 'Content 2',
        },
        {
          title: 'Post 3',
          shortDescription: 'Description 3',
          content: 'Content 3',
        },
        {
          title: 'Post 4',
          shortDescription: 'Description 4',
          content: 'Content 4',
        },
      ];

      for (const postData of postsData) {
        const response = await request(app.getHttpServer())
          .post(`/blogger/blogs/${blogId}/posts`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(postData)
          .expect(201);

        postIds.push(response.body.id);
      }

      // Шаг 2: Ставим лайки на посты
      // Создаем еще 2 пользователей для разнообразия лайков
      const otherUsers = [
        { login: 'user2', password: 'password2' },
        { login: 'user3', password: 'password3' },
      ];

      const otherTokens: string[] = [];

      for (const user of otherUsers) {
        // Регистрация
        await request(app.getHttpServer())
          .post('/sa/users')
          .send({
            login: user.login,
            password: user.password,
            email: `${user.login}@example.com`,
          })
          .expect(201);

        // Авторизация
        const authResp = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            loginOrEmail: user.login,
            password: user.password,
          })
          .expect(200);

        otherTokens.push(authResp.body.accessToken);
      }

      // Ставим лайки на посты разными пользователями
      // Пост 1: лайк от тестового пользователя + 2 других пользователя
      await request(app.getHttpServer())
        .put(`/posts/${postIds[0]}/like-status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ likeStatus: 'Like' })
        .expect(204);

      for (const token of otherTokens) {
        await request(app.getHttpServer())
          .put(`/posts/${postIds[0]}/like-status`)
          .set('Authorization', `Bearer ${token}`)
          .send({ likeStatus: 'Like' })
          .expect(204);
      }

      // Пост 2: лайк только от тестового пользователя
      await request(app.getHttpServer())
        .put(`/posts/${postIds[1]}/like-status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ likeStatus: 'Like' })
        .expect(204);

      // Пост 3: дизлайк от тестового пользователя
      await request(app.getHttpServer())
        .put(`/posts/${postIds[2]}/like-status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ likeStatus: 'Dislike' })
        .expect(204);

      // Пост 4: оставляем без лайков

      // Даем время на обновление данных (если нужно)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Шаг 3: Делаем запрос на получение постов (авторизованным пользователем)
      const response = await request(app.getHttpServer())
        .get('/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          pageNumber: 1,
          pageSize: 10,
          sortBy: 'createdAt',
          sortDirection: 'desc',
        })
        .expect(200);

      const responseBody = response.body;

      // Шаг 4: Проверяем структуру ответа
      expect(responseBody).toHaveProperty('pagesCount');
      expect(responseBody).toHaveProperty('page');
      expect(responseBody).toHaveProperty('pageSize');
      expect(responseBody).toHaveProperty('totalCount');
      expect(responseBody).toHaveProperty('items');
      expect(Array.isArray(responseBody.items)).toBe(true);
      expect(responseBody.items.length).toBe(4);

      // Шаг 5: Проверяем каждый пост
      const posts = responseBody.items;

      // Пост 1 (3 лайка)
      const post1 = posts.find((p: any) => p.id === postIds[0]);
      expect(post1).toBeDefined();
      expect(post1.extendedLikesInfo.likesCount).toBe(3);
      expect(post1.extendedLikesInfo.dislikesCount).toBe(0);
      expect(post1.extendedLikesInfo.myStatus).toBe('Like'); // Пользователь поставил лайк
      expect(post1.extendedLikesInfo.newestLikes.length).toBe(3);

      // Проверяем, что userLogin в newestLikes соответствует логину пользователя
      const userLikeInPost1 = post1.extendedLikesInfo.newestLikes.find(
        (like: any) => like.login === userLogin,
      );
      expect(userLikeInPost1).toBeDefined();
      expect(userLikeInPost1.userId).toBe(userId);

      // Пост 2 (1 лайк от тестового пользователя)
      const post2 = posts.find((p: any) => p.id === postIds[1]);
      expect(post2.extendedLikesInfo.likesCount).toBe(1);
      expect(post2.extendedLikesInfo.dislikesCount).toBe(0);
      expect(post2.extendedLikesInfo.myStatus).toBe('Like');
      expect(post2.extendedLikesInfo.newestLikes.length).toBe(1);
      expect(post2.extendedLikesInfo.newestLikes[0].login).toBe(userLogin);

      // Пост 3 (дизлайк от тестового пользователя)
      const post3 = posts.find((p: any) => p.id === postIds[2]);
      expect(post3.extendedLikesInfo.likesCount).toBe(0);
      expect(post3.extendedLikesInfo.dislikesCount).toBe(1);
      expect(post3.extendedLikesInfo.myStatus).toBe('Dislike');
      expect(post3.extendedLikesInfo.newestLikes.length).toBe(0);

      // Пост 4 (без реакций)
      const post4 = posts.find((p: any) => p.id === postIds[3]);
      expect(post4.extendedLikesInfo.likesCount).toBe(0);
      expect(post4.extendedLikesInfo.dislikesCount).toBe(0);
      expect(post4.extendedLikesInfo.myStatus).toBe('None');
      expect(post4.extendedLikesInfo.newestLikes.length).toBe(0);
    });

    it('должен вернуть myStatus = "None" для неавторизованного пользователя', async () => {
      // Создаем пост
      const postResponse = await request(app.getHttpServer())
        .post(`/blogger/blogs/${blogId}/posts`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Post',
          shortDescription: 'Test Description',
          content: 'Test Content',
        })
        .expect(201);

      const postId = postResponse.body.id;

      // Ставим лайк от авторизованного пользователя
      await request(app.getHttpServer())
        .put(`/posts/${postId}/like-status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ likeStatus: 'Like' })
        .expect(204);

      // Запрос без авторизации
      const response = await request(app.getHttpServer())
        .get('/posts')
        .query({
          pageNumber: 1,
          pageSize: 10,
        })
        .expect(200);

      const post = response.body.items.find((p: any) => p.id === postId);
      expect(post).toBeDefined();
      expect(post.extendedLikesInfo.myStatus).toBe('None');
      expect(post.extendedLikesInfo.newestLikes.length).toBeGreaterThan(0);
    });
  });

  describe('GET /posts/{id} - получение конкретного поста', () => {
    it('должен вернуть пост с лайками и правильным userLogin', async () => {
      // Создаем пост
      const postResponse = await request(app.getHttpServer())
        .post(`/blogger/blogs/${blogId}/posts`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Single Post',
          shortDescription: 'Single Description',
          content: 'Single Content',
        })
        .expect(201);

      const postId = postResponse.body.id;

      // Ставим лайк
      await request(app.getHttpServer())
        .put(`/posts/${postId}/like-status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ likeStatus: 'Like' })
        .expect(204);

      // Запрашиваем пост авторизованным пользователем
      const response = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.id).toBe(postId);
      expect(response.body.extendedLikesInfo.myStatus).toBe('Like');
      expect(response.body.extendedLikesInfo.likesCount).toBe(1);

      // Проверяем, что userLogin в newestLikes соответствует
      expect(response.body.extendedLikesInfo.newestLikes).toHaveLength(1);
      expect(response.body.extendedLikesInfo.newestLikes[0].login).toBe(
        userLogin,
      );
      expect(response.body.extendedLikesInfo.newestLikes[0].userId).toBe(
        userId,
      );
    });
  });
});
