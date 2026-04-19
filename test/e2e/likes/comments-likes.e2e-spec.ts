import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { e2eApiPath } from '../helpers/api-path';

const BASIC_AUTH = `Basic ${Buffer.from('admin:qwerty').toString('base64')}`;
const TESTING_PATH = e2eApiPath('testing/all-data');

describe('Comments Likes E2E Tests - One user, one comment scenarios (raw SQL)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  const POSTS_BASE = e2eApiPath('posts');
  const SA_BLOGS_BASE = e2eApiPath('sa/blogs');
  const SA_USERS = e2eApiPath('sa/users');
  const AUTH_LOGIN = e2eApiPath('auth/login');
  const COMMENTS_BASE = e2eApiPath('comments');

  let authToken: string;
  let testPostId: string;

  const basicAuthHeader = (login: string, password: string) =>
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

    const suffix = randomUUID().replace(/-/g, '').slice(0, 8);
    const userLogin = `u${suffix}`.slice(0, 10);
    const userPassword = 'testpass12';
    const adminLogin = 'admin';
    const adminPassword = 'qwerty';

    await request(app.getHttpServer())
      .post(SA_USERS)
      .set('Authorization', basicAuthHeader(adminLogin, adminPassword))
      .send({
        login: userLogin,
        password: userPassword,
        email: `${suffix}@example.com`,
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post(AUTH_LOGIN)
      .send({
        loginOrEmail: userLogin,
        password: userPassword,
      })
      .expect(200);

    authToken = loginResponse.body.accessToken;

    const blogResponse = await request(app.getHttpServer())
      .post(SA_BLOGS_BASE)
      .set('Authorization', BASIC_AUTH)
      .send({
        name: 'test-blog',
        description: 'blog for comment likes e2e',
        websiteUrl: 'https://testblog.com',
      })
      .expect(201);

    const blogId = blogResponse.body.id;

    const postResponse = await request(app.getHttpServer())
      .post(POSTS_BASE)
      .set('Authorization', BASIC_AUTH)
      .send({
        title: 'Post for comment likes',
        shortDescription: 'Short',
        content: 'Full content for comment likes e2e',
        blogId,
      })
      .expect(201);

    testPostId = postResponse.body.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  async function createCommentViaApi(content: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post(`${POSTS_BASE}/${testPostId}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content })
      .expect(201);
    return res.body.id as string;
  }

  it('1. No like → send Like → should set Like status', async () => {
    const testCommentId = await createCommentViaApi(
      'Comment for like test 1',
    );

    const initialResponse = await request(app.getHttpServer())
      .get(`${COMMENTS_BASE}/${testCommentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(initialResponse.body.likesInfo.myStatus).toBe('None');
    expect(initialResponse.body.likesInfo.likesCount).toBe(0);
    expect(initialResponse.body.likesInfo.dislikesCount).toBe(0);

    await request(app.getHttpServer())
      .put(`${COMMENTS_BASE}/${testCommentId}/like-status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        likeStatus: 'Like',
      })
      .expect(204);

    const finalResponse = await request(app.getHttpServer())
      .get(`${COMMENTS_BASE}/${testCommentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(finalResponse.body.likesInfo.myStatus).toBe('Like');
    expect(finalResponse.body.likesInfo.likesCount).toBe(1);
    expect(finalResponse.body.likesInfo.dislikesCount).toBe(0);
  });

  it('3. Has Like → send Dislike → should set Dislike status', async () => {
    const testCommentId = await createCommentViaApi(
      'Comment for like test 3',
    );

    await request(app.getHttpServer())
      .put(`${COMMENTS_BASE}/${testCommentId}/like-status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        likeStatus: 'Like',
      })
      .expect(204);

    const afterLike = await request(app.getHttpServer())
      .get(`${COMMENTS_BASE}/${testCommentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(afterLike.body.likesInfo.myStatus).toBe('Like');
    expect(afterLike.body.likesInfo.likesCount).toBe(1);
    expect(afterLike.body.likesInfo.dislikesCount).toBe(0);

    await request(app.getHttpServer())
      .put(`${COMMENTS_BASE}/${testCommentId}/like-status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        likeStatus: 'Dislike',
      })
      .expect(204);

    const finalResponse = await request(app.getHttpServer())
      .get(`${COMMENTS_BASE}/${testCommentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(finalResponse.body.likesInfo.myStatus).toBe('Dislike');
    expect(finalResponse.body.likesInfo.likesCount).toBe(0);
    expect(finalResponse.body.likesInfo.dislikesCount).toBe(1);
  });
});
