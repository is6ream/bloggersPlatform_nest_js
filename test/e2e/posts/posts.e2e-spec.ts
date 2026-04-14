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
const POSTS_BASE = e2eApiPath('posts');
const BLOGS_BASE = e2eApiPath('blogs');

const NON_EXISTENT_UUID = '00000000-0000-4000-8000-000000000099';

function expectPostShape(
  body: Record<string, unknown>,
  expected: {
    id: string;
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
    blogName: string;
  },
) {
  expect(body).toMatchObject({
    id: expected.id,
    title: expected.title,
    shortDescription: expected.shortDescription,
    content: expected.content,
    blogId: expected.blogId,
    blogName: expected.blogName,
  });
  expect(typeof body.createdAt).toBe('string');
  expect(body.extendedLikesInfo).toEqual(
    expect.objectContaining({
      likesCount: expect.any(Number),
      dislikesCount: expect.any(Number),
      myStatus: expect.any(String),
      newestLikes: expect.any(Array),
    }),
  );
}

describe('Posts query API (e2e, raw SQL)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

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
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /posts (getAllPosts)', () => {
    it('200 — пустой список с пагинацией по умолчанию', async () => {
      const res = await request(app.getHttpServer()).get(POSTS_BASE).expect(200);

      expect(res.body).toEqual({
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });

    it('200 — после создания постов возвращает корректную структуру и счётчики', async () => {
      const blogRes = await request(app.getHttpServer())
        .post(BLOGS_BASE)
        .set('Authorization', BASIC_AUTH)
        .send({
          name: 'sql-blog',
          description: 'desc',
          websiteUrl: 'https://example.com',
        })
        .expect(201);

      const blogId = blogRes.body.id as string;
      const blogName = blogRes.body.name as string;

      const created: Array<{
        id: string;
        title: string;
        shortDescription: string;
        content: string;
      }> = [];

      for (let i = 1; i <= 3; i++) {
        const r = await request(app.getHttpServer())
          .post(POSTS_BASE)
          .set('Authorization', BASIC_AUTH)
          .send({
            title: `title-${i}`,
            shortDescription: `short-${i}`,
            content: `content-${i}`.repeat(3),
            blogId,
          })
          .expect(201);
        created.push({
          id: r.body.id,
          title: r.body.title,
          shortDescription: r.body.shortDescription,
          content: r.body.content,
        });
      }

      const listRes = await request(app.getHttpServer())
        .get(POSTS_BASE)
        .query({
          pageNumber: 1,
          pageSize: 10,
          sortBy: 'createdAt',
          sortDirection: 'desc',
        })
        .expect(200);

      expect(listRes.body.pagesCount).toBe(1);
      expect(listRes.body.page).toBe(1);
      expect(listRes.body.pageSize).toBe(10);
      expect(listRes.body.totalCount).toBe(3);
      expect(Array.isArray(listRes.body.items)).toBe(true);
      expect(listRes.body.items).toHaveLength(3);

      for (const item of listRes.body.items) {
        const match = created.find((c) => c.id === item.id);
        expect(match).toBeDefined();
        expectPostShape(item, {
          id: match!.id,
          title: match!.title,
          shortDescription: match!.shortDescription,
          content: match!.content,
          blogId,
          blogName,
        });
        expect(item.extendedLikesInfo.likesCount).toBe(0);
        expect(item.extendedLikesInfo.dislikesCount).toBe(0);
        expect(item.extendedLikesInfo.myStatus).toBe('None');
        expect(item.extendedLikesInfo.newestLikes).toEqual([]);
      }
    });

    it('200 — пагинация и сортировка по title asc', async () => {
      const blogRes = await request(app.getHttpServer())
        .post(BLOGS_BASE)
        .set('Authorization', BASIC_AUTH)
        .send({
          name: 'sort-blog',
          description: 'd',
          websiteUrl: 'https://sort.com',
        })
        .expect(201);

      const blogId = blogRes.body.id as string;

      const titles = ['gamma', 'alpha', 'beta'];
      for (const title of titles) {
        await request(app.getHttpServer())
          .post(POSTS_BASE)
          .set('Authorization', BASIC_AUTH)
          .send({
            title,
            shortDescription: `${title}-s`,
            content: `${title}-c`,
            blogId,
          })
          .expect(201);
      }

      const page1 = await request(app.getHttpServer())
        .get(POSTS_BASE)
        .query({
          pageNumber: 1,
          pageSize: 2,
          sortBy: 'title',
          sortDirection: 'asc',
        })
        .expect(200);

      expect(page1.body.totalCount).toBe(3);
      expect(page1.body.pagesCount).toBe(2);
      expect(page1.body.items).toHaveLength(2);
      expect(page1.body.items[0].title).toBe('alpha');
      expect(page1.body.items[1].title).toBe('beta');

      const page2 = await request(app.getHttpServer())
        .get(POSTS_BASE)
        .query({
          pageNumber: 2,
          pageSize: 2,
          sortBy: 'title',
          sortDirection: 'asc',
        })
        .expect(200);

      expect(page2.body.items).toHaveLength(1);
      expect(page2.body.items[0].title).toBe('gamma');
    });
  });

  describe('GET /posts/:id (getPostById)', () => {
    it('404 — несуществующий пост', async () => {
      await request(app.getHttpServer())
        .get(`${POSTS_BASE}/${NON_EXISTENT_UUID}`)
        .expect(404);
    });

    it('200 — пост совпадает с данными после создания', async () => {
      const blogRes = await request(app.getHttpServer())
        .post(BLOGS_BASE)
        .set('Authorization', BASIC_AUTH)
        .send({
          name: 'one-post',
          description: 'd',
          websiteUrl: 'https://one.com',
        })
        .expect(201);

      const blogId = blogRes.body.id as string;
      const blogName = blogRes.body.name as string;

      const createRes = await request(app.getHttpServer())
        .post(POSTS_BASE)
        .set('Authorization', BASIC_AUTH)
        .send({
          title: 'unique-title',
          shortDescription: 'unique-short',
          content: 'unique-body-content',
          blogId,
        })
        .expect(201);

      const postId = createRes.body.id as string;

      const getRes = await request(app.getHttpServer())
        .get(`${POSTS_BASE}/${postId}`)
        .expect(200);

      expectPostShape(getRes.body, {
        id: postId,
        title: 'unique-title',
        shortDescription: 'unique-short',
        content: 'unique-body-content',
        blogId,
        blogName,
      });
      expect(getRes.body.extendedLikesInfo.likesCount).toBe(0);
      expect(getRes.body.extendedLikesInfo.dislikesCount).toBe(0);
      expect(getRes.body.extendedLikesInfo.myStatus).toBe('None');
      expect(getRes.body.extendedLikesInfo.newestLikes).toEqual([]);
    });

    it('404 — удалённый пост не отдаётся', async () => {
      const blogRes = await request(app.getHttpServer())
        .post(BLOGS_BASE)
        .set('Authorization', BASIC_AUTH)
        .send({
          name: 'del-blog',
          description: 'd',
          websiteUrl: 'https://del.com',
        })
        .expect(201);

      const createRes = await request(app.getHttpServer())
        .post(POSTS_BASE)
        .set('Authorization', BASIC_AUTH)
        .send({
          title: 'to-delete',
          shortDescription: 's',
          content: 'c',
          blogId: blogRes.body.id,
        })
        .expect(201);

      const postId = createRes.body.id as string;

      await request(app.getHttpServer())
        .delete(`${POSTS_BASE}/${postId}`)
        .set('Authorization', BASIC_AUTH)
        .expect(204);

      await request(app.getHttpServer())
        .get(`${POSTS_BASE}/${postId}`)
        .expect(404);
    });
  });
});
