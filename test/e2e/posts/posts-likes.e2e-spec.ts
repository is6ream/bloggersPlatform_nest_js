import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { e2eApiPath } from '../helpers/api-path';

const BASIC_AUTH = `Basic ${Buffer.from('admin:qwerty').toString('base64')}`;
const TESTING_PATH = e2eApiPath('testing/all-data');

describe('Posts Likes E2E Test', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  const POSTS_BASE = e2eApiPath('posts');
  const BLOGS_BASE = e2eApiPath('sa/blogs');
  const SA_USERS = e2eApiPath('sa/users');
  const AUTH_LOGIN = e2eApiPath('auth/login');

  let userToken: string;
  let userId: string;
  let userLogin: string;
  let blogId: string;
  const postIds: string[] = [];

  const basicAuth = (login: string, password: string) =>
    `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();
  });

  beforeEach(async () => {
    await request(app.getHttpServer()).delete(TESTING_PATH).expect(204);
    postIds.length = 0;

    userLogin = 'testuser';
    const userPassword = 'testpassword123';
    const adminLogin = 'admin';
    const adminPassword = 'qwerty';

    const createUserRes = await request(app.getHttpServer())
      .post(SA_USERS)
      .set('Authorization', basicAuth(adminLogin, adminPassword))
      .send({
        login: userLogin,
        password: userPassword,
        email: 'testuser@example.com',
      })
      .expect(201);

    userId = createUserRes.body.id;

    const loginResponse = await request(app.getHttpServer())
      .post(AUTH_LOGIN)
      .send({
        loginOrEmail: userLogin,
        password: userPassword,
      })
      .expect(200);

    userToken = loginResponse.body.accessToken;

    console.log("base path: ", BLOGS_BASE)

    const blogResponse = await request(app.getHttpServer())
      .post(BLOGS_BASE)
      .set('Authorization', basicAuth(adminLogin, adminPassword))
      .send({
        name: 'test-blog',
        description: 'blog for posts e2e',
        websiteUrl: 'https://testblog.com',
      })
      .expect(201);

    blogId = blogResponse.body.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('Создаем 4 поста, ставим лайки, проверяем что userLogin в ответе совпадает', async () => {
    const postsData = [
      {
        title: 'Post 1 about programming',
        shortDescription: 'Short 1',
        content: 'Full content one',
        blogId,
      },
      {
        title: 'Post 2 about Nest.js',
        shortDescription: 'Short 2',
        content: 'Nest.js content',
        blogId,
      },
      {
        title: 'Post 3 about databases',
        shortDescription: 'Short 3',
        content: 'Database content',
        blogId,
      },
      {
        title: 'Post 4 about testing',
        shortDescription: 'Short 4',
        content: 'Testing content',
        blogId,
      },
    ];

    for (let i = 0; i < postsData.length; i++) {
      const response = await request(app.getHttpServer())
        .post(POSTS_BASE)
        .set('Authorization', BASIC_AUTH)
        .send(postsData[i])
        .expect(201);

      postIds.push(response.body.id);
    }

    const otherUsers = [
      { login: 'john_doe', password: 'password123', email: 'john@example.com' },
      {
        login: 'jane_smith',
        password: 'password456',
        email: 'jane@example.com',
      },
    ];

    for (const user of otherUsers) {
      await request(app.getHttpServer())
        .post(SA_USERS)
        .set('Authorization', BASIC_AUTH)
        .send({
          login: user.login,
          password: user.password,
          email: user.email,
        })
        .expect(201);
    }

    const otherTokens: string[] = [];
    for (const user of otherUsers) {
      const authResponse = await request(app.getHttpServer())
        .post(AUTH_LOGIN)
        .send({
          loginOrEmail: user.login,
          password: user.password,
        })
        .expect(200);

      otherTokens.push(authResponse.body.accessToken);
    }

    await request(app.getHttpServer())
      .put(`${POSTS_BASE}/${postIds[0]}/like-status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ likeStatus: 'Like' })
      .expect(204);

    for (let i = 0; i < otherTokens.length; i++) {
      await request(app.getHttpServer())
        .put(`${POSTS_BASE}/${postIds[0]}/like-status`)
        .set('Authorization', `Bearer ${otherTokens[i]}`)
        .send({ likeStatus: 'Like' })
        .expect(204);
    }

    await request(app.getHttpServer())
      .put(`${POSTS_BASE}/${postIds[1]}/like-status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ likeStatus: 'Like' })
      .expect(204);

    await request(app.getHttpServer())
      .put(`${POSTS_BASE}/${postIds[2]}/like-status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ likeStatus: 'Dislike' })
      .expect(204);

    await request(app.getHttpServer())
      .put(`${POSTS_BASE}/${postIds[2]}/like-status`)
      .set('Authorization', `Bearer ${otherTokens[0]}`)
      .send({ likeStatus: 'Like' })
      .expect(204);

    await request(app.getHttpServer())
      .put(`${POSTS_BASE}/${postIds[3]}/like-status`)
      .set('Authorization', `Bearer ${otherTokens[1]}`)
      .send({ likeStatus: 'Like' })
      .expect(204);

    const response = await request(app.getHttpServer())
      .get(POSTS_BASE)
      .set('Authorization', `Bearer ${userToken}`)
      .query({
        pageNumber: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      })
      .expect(200);

    expect(response.body).toHaveProperty('pagesCount');
    expect(response.body).toHaveProperty('page', 1);
    expect(response.body).toHaveProperty('pageSize', 10);
    expect(response.body).toHaveProperty('totalCount', 4);
    expect(response.body).toHaveProperty('items');
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBe(4);

    const posts = response.body.items;

    const post1 = posts.find((p: { id: string }) => p.id === postIds[0]);
    expect(post1).toBeDefined();
    expect(post1.extendedLikesInfo.likesCount).toBe(3);
    expect(post1.extendedLikesInfo.dislikesCount).toBe(0);
    expect(post1.extendedLikesInfo.myStatus).toBe('Like');
    expect(post1.extendedLikesInfo.newestLikes.length).toBe(3);

    const userLikeInPost1 = post1.extendedLikesInfo.newestLikes.find(
      (like: { login: string }) => like.login === userLogin,
    );

    expect(userLikeInPost1).toBeDefined();
    expect(userLikeInPost1.login).toBe(userLogin);
    expect(userLikeInPost1.userId).toBe(userId);

    const post2 = posts.find((p: { id: string }) => p.id === postIds[1]);
    expect(post2.extendedLikesInfo.likesCount).toBe(1);
    expect(post2.extendedLikesInfo.dislikesCount).toBe(0);
    expect(post2.extendedLikesInfo.myStatus).toBe('Like');
    expect(post2.extendedLikesInfo.newestLikes.length).toBe(1);
    expect(post2.extendedLikesInfo.newestLikes[0].login).toBe(userLogin);

    const post3 = posts.find((p: { id: string }) => p.id === postIds[2]);
    expect(post3.extendedLikesInfo.likesCount).toBe(1);
    expect(post3.extendedLikesInfo.dislikesCount).toBe(1);
    expect(post3.extendedLikesInfo.myStatus).toBe('Dislike');
    expect(post3.extendedLikesInfo.newestLikes.length).toBe(1);
    expect(post3.extendedLikesInfo.newestLikes[0].login).toBe(
      otherUsers[0].login,
    );

    const post4 = posts.find((p: { id: string }) => p.id === postIds[3]);
    expect(post4.extendedLikesInfo.likesCount).toBe(1);
    expect(post4.extendedLikesInfo.dislikesCount).toBe(0);
    expect(post4.extendedLikesInfo.myStatus).toBe('None');
    expect(post4.extendedLikesInfo.newestLikes.length).toBe(1);
    expect(post4.extendedLikesInfo.newestLikes[0].login).toBe(
      otherUsers[1].login,
    );
  });

  it('должен возвращать myStatus = "None" для неавторизованного пользователя', async () => {
    const postResponse = await request(app.getHttpServer())
      .post(POSTS_BASE)
      .set('Authorization', BASIC_AUTH)
      .send({
        title: 'Unauthorized myStatus',
        shortDescription: 'Short',
        content: 'Content body',
        blogId,
      })
      .expect(201);

    const postId = postResponse.body.id;

    await request(app.getHttpServer())
      .put(`${POSTS_BASE}/${postId}/like-status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ likeStatus: 'Like' })
      .expect(204);

    const response = await request(app.getHttpServer())
      .get(POSTS_BASE)
      .query({
        pageNumber: 1,
        pageSize: 10,
      })
      .expect(200);

    const post = response.body.items.find((p: { id: string }) => p.id === postId);
    expect(post).toBeDefined();
    expect(post.extendedLikesInfo.myStatus).toBe('None');
    expect(post.extendedLikesInfo.newestLikes.length).toBe(1);
  });
});
