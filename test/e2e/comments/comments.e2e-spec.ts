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
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { createTestUser } from '../../helpers/factory/user-factory';
import { e2eApiPath } from '../helpers/api-path';

const BASIC_AUTH = `Basic ${Buffer.from('admin:qwerty').toString('base64')}`;
const TESTING_PATH = e2eApiPath('testing/all-data');

describe('Comments E2E Tests', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let dataSource: DataSource;
  let authToken: string;
  let testPostId: string;
  let testUserId: string;

  const POSTS_BASE = e2eApiPath('posts');
  const COMMENTS_BASE = e2eApiPath('comments');
  const SA_BLOGS_BASE = e2eApiPath('sa/blogs');

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();
    dataSource = moduleFixture.get(DataSource);
  });

  beforeEach(async () => {
    await request(app.getHttpServer()).delete(TESTING_PATH).expect(204);

    const testUser = await createTestUser({
      login: 'testuser',
      email: `testuser_${Date.now()}@example.com`,
    });
    testUserId = testUser.id;

    const loginResponse = await request(app.getHttpServer())
      .post(e2eApiPath('auth/login'))
      .send({
        loginOrEmail: 'testuser',
        password: 'testpassword',
      })
      .expect(200);
    authToken = loginResponse.body.accessToken;

    const blogRes = await request(app.getHttpServer())
      .post(SA_BLOGS_BASE)
      .set('Authorization', BASIC_AUTH)
      .send({
        name: 'cmt-e2e-blog',
        description: 'blog for comments e2e',
        websiteUrl: 'https://example.com',
      })
      .expect(201);
    const blogId = blogRes.body.id as string;

    const postRes = await request(app.getHttpServer())
      .post(POSTS_BASE)
      .set('Authorization', BASIC_AUTH)
      .send({
        title: 'Post for comments e2e',
        shortDescription: 'short desc for comments',
        content: 'Main post content '.repeat(25),
        blogId,
      })
      .expect(201);
    testPostId = postRes.body.id as string;
  });

  afterAll(async () => {
    await app.close();
  });

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
        .send({ content: 'a'.repeat(301) })
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

      const countRows = await dataSource.query(
        `SELECT COUNT(*)::int AS count FROM comments WHERE "postId" = $1 AND "deleteAt" IS NULL`,
        [testPostId],
      );
      expect(Number(countRows[0]?.count ?? 0)).toBe(3);
    });
  });

  describe('GET /posts/:postId/comments', () => {
    const getCommentsUrl = (postId = testPostId) =>
      `${POSTS_BASE}/${postId}/comments`;

    it('returns paginated comments for the post after creating several via POST', async () => {
      const contents = [
        'Alpha comment text meets minimum length',
        'Bravo comment text meets minimum length',
        'Charlie comment text meets minimum length',
      ];
      const createdIds: string[] = [];

      for (const content of contents) {
        const res = await request(app.getHttpServer())
          .post(`${POSTS_BASE}/${testPostId}/comments`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ content })
          .expect(201);
        createdIds.push(res.body.id);
        expect(res.body.content).toBe(content);
      }

      const listRes = await request(app.getHttpServer())
        .get(getCommentsUrl())
        .expect(200);

      expect(listRes.body).toMatchObject({
        page: 1,
        pageSize: 10,
        totalCount: 3,
        pagesCount: 1,
      });
      expect(listRes.body.items).toHaveLength(3);

      const returnedIds = listRes.body.items.map((i: { id: string }) => i.id);
      expect(returnedIds.sort()).toEqual([...createdIds].sort());

      // По умолчанию сортировка по createdAt desc — последний созданный первый
      expect(listRes.body.items[0].id).toBe(createdIds[2]);
      expect(listRes.body.items[2].id).toBe(createdIds[0]);

      for (const item of listRes.body.items) {
        expect(item).toMatchObject({
          id: expect.any(String),
          content: expect.any(String),
          commentatorInfo: {
            userId: testUserId,
            userLogin: 'testuser',
          },
          createdAt: expect.any(String),
          likesInfo: {
            likesCount: expect.any(Number),
            dislikesCount: expect.any(Number),
            myStatus: 'None',
          },
        });
      }
    });
  });

  describe('PUT /comments/:id - Update operations', () => {
    it('should reject update when content is not a string (400)', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`${POSTS_BASE}/${testPostId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Original comment content long enough' })
        .expect(201);

      const commentUrl = `${COMMENTS_BASE}/${createRes.body.id}`;

      await request(app.getHttpServer())
        .put(commentUrl)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 123456789 })
        .expect(400);
    });

    it('should require authorization for updating comment (401)', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`${POSTS_BASE}/${testPostId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'testtestttesttesttesttest long enough' })
        .expect(201);

      const commentUrl = `${COMMENTS_BASE}/${createRes.body.id}`;

      await request(app.getHttpServer())
        .put(commentUrl)
        .send({ content: '12345678910111213141515616' })
        .expect(401);
    });

    it("should return 403 Forbidden when updating another user's comment", async () => {
      const anotherUser = await createTestUser({
        login: 'another',
        email: `another_${Date.now()}@example.com`,
      });

      const anotherLogin = await request(app.getHttpServer())
        .post(e2eApiPath('auth/login'))
        .send({
          loginOrEmail: anotherUser.login,
          password: anotherUser.password,
        })
        .expect(200);

      const createRes = await request(app.getHttpServer())
        .post(`${POSTS_BASE}/${testPostId}/comments`)
        .set('Authorization', `Bearer ${anotherLogin.body.accessToken}`)
        .send({ content: 'Comment from another user long enough' })
        .expect(201);

      await request(app.getHttpServer())
        .put(`${COMMENTS_BASE}/${createRes.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: "Trying to update someone else's comment long" })
        .expect(403);
    });

    it('should return 404 when updating non-existent comment', async () => {
      const nonExistentCommentId = '507f1f77bcf86cd799439011';

      await request(app.getHttpServer())
        .put(`${COMMENTS_BASE}/${nonExistentCommentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'This comment does not exist long enough' })
        .expect(404);
    });

    it('should return 204 successfully', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`${POSTS_BASE}/${testPostId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Original comment content long enough' })
        .expect(201);

      const content = { content: 't'.repeat(22) };
      const commentId = createRes.body.id as string;
      const url = `${COMMENTS_BASE}/${commentId}`;

      await request(app.getHttpServer())
        .put(url)
        .set('Authorization', `Bearer ${authToken}`)
        .send(content)
        .expect(204);
    });
  });

  describe('DELETE /comments/:id', () => {
    describe('Success cases', () => {
      it('should delete own comment - 204 No Content', async () => {
        const createRes = await request(app.getHttpServer())
          .post(`${POSTS_BASE}/${testPostId}/comments`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ content: 'Comment to be deleted long enough' })
          .expect(201);

        const commentUrl = `${COMMENTS_BASE}/${createRes.body.id}`;

        await request(app.getHttpServer())
          .delete(commentUrl)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(204);

        const deletedCommentRows = await dataSource.query(
          `SELECT "deleteAt" FROM comments WHERE id = $1`,
          [createRes.body.id],
        );
        expect(deletedCommentRows[0]?.deleteAt).not.toBeNull();
      });
    });

    describe('Authorization errors', () => {
      it('should return 401 Unauthorized without token', async () => {
        const createRes = await request(app.getHttpServer())
          .post(`${POSTS_BASE}/${testPostId}/comments`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ content: 'Comment for auth test long enough' })
          .expect(201);

        await request(app.getHttpServer())
          .delete(`${COMMENTS_BASE}/${createRes.body.id}`)
          .expect(401);
      });

      it('should return 401 Unauthorized with invalid token', async () => {
        const createRes = await request(app.getHttpServer())
          .post(`${POSTS_BASE}/${testPostId}/comments`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ content: 'Comment for invalid token long' })
          .expect(201);

        await request(app.getHttpServer())
          .delete(`${COMMENTS_BASE}/${createRes.body.id}`)
          .set('Authorization', 'Bearer invalid_token_here')
          .expect(401);
      });
    });

    describe('Ownership errors', () => {
      let otherUserToken: string;
      let otherUserCommentId: string;

      beforeEach(async () => {
        await createTestUser({
          login: 'otheruser',
          email: `otheruser_${Date.now()}@example.com`,
        });

        const loginResponse = await request(app.getHttpServer())
          .post(e2eApiPath('auth/login'))
          .send({
            loginOrEmail: 'otheruser',
            password: 'testpassword',
          })
          .expect(200);
        otherUserToken = loginResponse.body.accessToken;

        const createRes = await request(app.getHttpServer())
          .post(`${POSTS_BASE}/${testPostId}/comments`)
          .set('Authorization', `Bearer ${otherUserToken}`)
          .send({ content: 'Comment from other user long enough' })
          .expect(201);
        otherUserCommentId = createRes.body.id as string;
      });

      it("should return 403 Forbidden when deleting someone else's comment", async () => {
        await request(app.getHttpServer())
          .delete(`${COMMENTS_BASE}/${otherUserCommentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });

      it('should allow owner to delete their own comment', async () => {
        await request(app.getHttpServer())
          .delete(`${COMMENTS_BASE}/${otherUserCommentId}`)
          .set('Authorization', `Bearer ${otherUserToken}`)
          .expect(204);
      });
    });

    describe('Not found errors', () => {
      it('should return 404 for non-existent comment', async () => {
        const nonExistentId = '507f1f77bcf86cd799439011';

        await request(app.getHttpServer())
          .delete(`${COMMENTS_BASE}/${nonExistentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });

      it('should return 404 for already deleted comment', async () => {
        const createRes = await request(app.getHttpServer())
          .post(`${POSTS_BASE}/${testPostId}/comments`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ content: 'Already deleted comment long enough' })
          .expect(201);

        await dataSource.query(
          `UPDATE comments SET "deleteAt" = NOW() WHERE id = $1`,
          [createRes.body.id],
        );

        await request(app.getHttpServer())
          .delete(`${COMMENTS_BASE}/${createRes.body.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });

      it('should return 404 for invalid comment ID (not found)', async () => {
        await request(app.getHttpServer())
          .delete(`${COMMENTS_BASE}/invalid-id-format`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });

    describe('Edge cases', () => {
      it('should handle deleting comment with likes', async () => {
        const createRes = await request(app.getHttpServer())
          .post(`${POSTS_BASE}/${testPostId}/comments`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ content: 'Popular comment text long enough' })
          .expect(201);

        await dataSource.query(
          `UPDATE comments SET "likesCount" = 10, "dislikesCount" = 3 WHERE id = $1`,
          [createRes.body.id],
        );

        await request(app.getHttpServer())
          .delete(`${COMMENTS_BASE}/${createRes.body.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(204);

        const deletedCommentRows = await dataSource.query(
          `SELECT "deleteAt" FROM comments WHERE id = $1`,
          [createRes.body.id],
        );
        expect(deletedCommentRows[0]?.deleteAt).not.toBeNull();
      });

      it('should not delete comment twice', async () => {
        const createRes = await request(app.getHttpServer())
          .post(`${POSTS_BASE}/${testPostId}/comments`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ content: 'Comment for double delete long enough' })
          .expect(201);

        await request(app.getHttpServer())
          .delete(`${COMMENTS_BASE}/${createRes.body.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(204);

        await request(app.getHttpServer())
          .delete(`${COMMENTS_BASE}/${createRes.body.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });
  });
});
