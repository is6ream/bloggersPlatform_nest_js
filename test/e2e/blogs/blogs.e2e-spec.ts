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
const SA_BLOGS_PATH = e2eApiPath('sa/blogs');
const BLOGS_PATH = e2eApiPath('blogs');
const NON_EXISTENT_BLOG_ID = '00000000-0000-4000-8000-000000000099';
const NON_EXISTENT_POST_ID = '00000000-0000-4000-8000-000000000088';

const VALID_POST_BODY = {
  title: 'post-title',
  shortDescription: 'post-short-description',
  content: 'post-content',
};

type BlogInput = {
  name: string;
  description: string;
  websiteUrl: string;
};

const VALID_BLOG_INPUT: BlogInput = {
  name: 'blog-name',
  description: 'blog-description',
  websiteUrl: 'https://example.com',
};

describe('Blogs API (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  const createBlog = async (input: BlogInput = VALID_BLOG_INPUT) => {
    const res = await request(app.getHttpServer())
      .post(SA_BLOGS_PATH)
      .set('Authorization', BASIC_AUTH)
      .send(input)
      .expect(201);

    return res.body as {
      id: string;
      name: string;
      description: string;
      websiteUrl: string;
      createdAt: string;
      isMembership: boolean;
    };
  };

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

  describe('GET /blogs', () => {
    it('200 — empty list with default pagination', async () => {
      const res = await request(app.getHttpServer()).get(BLOGS_PATH).expect(200);

      expect(res.body).toEqual({
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });

    it('200 — supports pagination + searchNameTerm', async () => {
      await createBlog({
        name: 'alpha',
        description: 'alpha desc',
        websiteUrl: 'https://alpha.com',
      });
      await createBlog({
        name: 'beta',
        description: 'beta desc',
        websiteUrl: 'https://beta.com',
      });
      await createBlog({
        name: 'alphabet',
        description: 'alphabet desc',
        websiteUrl: 'https://alphabet.com',
      });

      const res = await request(app.getHttpServer())
        .get(BLOGS_PATH)
        .query({ searchNameTerm: 'alpha', pageNumber: 1, pageSize: 2 })
        .expect(200);

      expect(res.body.page).toBe(1);
      expect(res.body.pageSize).toBe(2);
      expect(res.body.totalCount).toBe(2);
      expect(res.body.pagesCount).toBe(1);
      expect(res.body.items).toHaveLength(2);
      expect(
        res.body.items.every((b: { name: string }) => b.name.includes('alpha')),
      ).toBe(true);
    });
  });

  describe('GET /blogs/:id', () => {
    it('404 — for non-existent blog', async () => {
      await request(app.getHttpServer())
        .get(`${BLOGS_PATH}/${NON_EXISTENT_BLOG_ID}`)
        .expect(404);
    });

    it('200 — returns existing blog', async () => {
      const created = await createBlog();

      const res = await request(app.getHttpServer())
        .get(`${BLOGS_PATH}/${created.id}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: created.id,
        name: VALID_BLOG_INPUT.name,
        description: VALID_BLOG_INPUT.description,
        websiteUrl: VALID_BLOG_INPUT.websiteUrl,
        isMembership: false,
      });
      expect(res.body.createdAt).toBeDefined();
    });
  });

  describe('POST /blogs', () => {
    it('401 — without Basic Auth', async () => {
      await request(app.getHttpServer())
        .post(SA_BLOGS_PATH)
        .send(VALID_BLOG_INPUT)
        .expect(401);
    });

    it('400 — invalid payload', async () => {
      await request(app.getHttpServer())
        .post(SA_BLOGS_PATH)
        .set('Authorization', BASIC_AUTH)
        .send({
          name: 'x'.repeat(16),
          description: '',
          websiteUrl: 'not-url',
        })
        .expect(400);
    });

    it('201 — creates blog', async () => {
      const res = await request(app.getHttpServer())
        .post(SA_BLOGS_PATH)
        .set('Authorization', BASIC_AUTH)
        .send(VALID_BLOG_INPUT)
        .expect(201);

      expect(res.body).toMatchObject({
        name: VALID_BLOG_INPUT.name,
        description: VALID_BLOG_INPUT.description,
        websiteUrl: VALID_BLOG_INPUT.websiteUrl,
        isMembership: false,
      });
      expect(typeof res.body.id).toBe('string');
      expect(res.body.createdAt).toBeDefined();
    });
  });

  describe('PUT /blogs/:id', () => {
    it('401 — without Basic Auth', async () => {
      const created = await createBlog();

      await request(app.getHttpServer())
        .put(`${SA_BLOGS_PATH}/${created.id}`)
        .send(VALID_BLOG_INPUT)
        .expect(401);
    });

    it('404 — for non-existent blog', async () => {
      await request(app.getHttpServer())
        .put(`${SA_BLOGS_PATH}/${NON_EXISTENT_BLOG_ID}`)
        .set('Authorization', BASIC_AUTH)
        .send(VALID_BLOG_INPUT)
        .expect(404);
    });

    it('204 — updates blog', async () => {
      const created = await createBlog();
      const updateBody = {
        name: 'updated',
        description: 'updated description',
        websiteUrl: 'https://updated.com',
      };

      await request(app.getHttpServer())
        .put(`${SA_BLOGS_PATH}/${created.id}`)
        .set('Authorization', BASIC_AUTH)
        .send(updateBody)
        .expect(204);

      const getRes = await request(app.getHttpServer())
        .get(`${BLOGS_PATH}/${created.id}`)
        .expect(200);

      expect(getRes.body).toMatchObject(updateBody);
    });
  });

  describe('DELETE /blogs/:id', () => {
    it('401 — without Basic Auth', async () => {
      const created = await createBlog();

      await request(app.getHttpServer())
        .delete(`${SA_BLOGS_PATH}/${created.id}`)
        .expect(401);
    });

    it('404 — for non-existent blog', async () => {
      await request(app.getHttpServer())
        .delete(`${SA_BLOGS_PATH}/${NON_EXISTENT_BLOG_ID}`)
        .set('Authorization', BASIC_AUTH)
        .expect(404);
    });

    it('204 — deletes blog and hides it from reads', async () => {
      const created = await createBlog();

      await request(app.getHttpServer())
        .delete(`${SA_BLOGS_PATH}/${created.id}`)
        .set('Authorization', BASIC_AUTH)
        .expect(204);

      await request(app.getHttpServer())
        .get(`${BLOGS_PATH}/${created.id}`)
        .expect(404);

      const listRes = await request(app.getHttpServer()).get(BLOGS_PATH).expect(200);
      expect(listRes.body.items.some((b: { id: string }) => b.id === created.id)).toBe(
        false,
      );
    });
  });

  describe('POST /blogs/:id/posts + GET /blogs/:id/posts', () => {
    it('201 + 200 — creates post for blog and returns it in blog posts feed', async () => {
      const blog = await createBlog();

      const createPostRes = await request(app.getHttpServer())
        .post(`${SA_BLOGS_PATH}/${blog.id}/posts`)
        .set('Authorization', BASIC_AUTH)
        .send(VALID_POST_BODY)
        .expect(201);

      expect(createPostRes.body).toMatchObject({
        blogId: blog.id,
        blogName: blog.name,
        title: 'post-title',
      });

      const getPostsRes = await request(app.getHttpServer())
        .get(`${SA_BLOGS_PATH}/${blog.id}/posts`)
        .set('Authorization', BASIC_AUTH)
        .expect(200);

      expect(getPostsRes.body.totalCount).toBe(1);
      expect(getPostsRes.body.items[0].id).toBe(createPostRes.body.id);
    });

    it('404 — create post for non-existent blog', async () => {
      await request(app.getHttpServer())
        .post(`${SA_BLOGS_PATH}/${NON_EXISTENT_BLOG_ID}/posts`)
        .set('Authorization', BASIC_AUTH)
        .send(VALID_POST_BODY)
        .expect(404);
    });

    it('401 — GET blog posts without Basic Auth', async () => {
      const blog = await createBlog();
      await request(app.getHttpServer())
        .get(`${SA_BLOGS_PATH}/${blog.id}/posts`)
        .expect(401);
    });

    it('404 — GET posts for non-existent blog', async () => {
      await request(app.getHttpServer())
        .get(`${SA_BLOGS_PATH}/${NON_EXISTENT_BLOG_ID}/posts`)
        .set('Authorization', BASIC_AUTH)
        .expect(404);
    });
  });

  describe('GET /blogs/:blogId/posts (public)', () => {
    it('200 — returns paginated posts for existing blog', async () => {
      const blog = await createBlog();

      await request(app.getHttpServer())
        .post(`${SA_BLOGS_PATH}/${blog.id}/posts`)
        .set('Authorization', BASIC_AUTH)
        .send({
          title: 'alpha-post',
          shortDescription: 'alpha-short',
          content: 'alpha-content',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`${SA_BLOGS_PATH}/${blog.id}/posts`)
        .set('Authorization', BASIC_AUTH)
        .send({
          title: 'beta-post',
          shortDescription: 'beta-short',
          content: 'beta-content',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`${BLOGS_PATH}/${blog.id}/posts`)
        .query({ pageNumber: 1, pageSize: 1, sortBy: 'createdAt', sortDirection: 'desc' })
        .expect(200);

      expect(res.body.page).toBe(1);
      expect(res.body.pageSize).toBe(1);
      expect(res.body.totalCount).toBe(2);
      expect(res.body.pagesCount).toBe(2);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0]).toMatchObject({
        blogId: blog.id,
      });
    });

    it('404 — blog not found', async () => {
      await request(app.getHttpServer())
        .get(`${BLOGS_PATH}/${NON_EXISTENT_BLOG_ID}/posts`)
        .expect(404);
    });
  });

  describe('PUT /sa/blogs/:blogId/posts/:postId', () => {
    it('204 — обновляет пост и отражается в списке постов блога', async () => {
      const blog = await createBlog();
      const createPostRes = await request(app.getHttpServer())
        .post(`${SA_BLOGS_PATH}/${blog.id}/posts`)
        .set('Authorization', BASIC_AUTH)
        .send(VALID_POST_BODY)
        .expect(201);

      const updateBody = {
        title: 'updated-title',
        shortDescription: 'updated-short',
        content: 'updated-content-body',
      };

      await request(app.getHttpServer())
        .put(`${SA_BLOGS_PATH}/${blog.id}/posts/${createPostRes.body.id}`)
        .set('Authorization', BASIC_AUTH)
        .send(updateBody)
        .expect(204);

      const listRes = await request(app.getHttpServer())
        .get(`${SA_BLOGS_PATH}/${blog.id}/posts`)
        .set('Authorization', BASIC_AUTH)
        .expect(200);

      expect(listRes.body.items).toHaveLength(1);
      expect(listRes.body.items[0]).toMatchObject({
        id: createPostRes.body.id,
        ...updateBody,
        blogId: blog.id,
      });
    });

    it('401 — без Basic Auth', async () => {
      const blog = await createBlog();
      const createPostRes = await request(app.getHttpServer())
        .post(`${SA_BLOGS_PATH}/${blog.id}/posts`)
        .set('Authorization', BASIC_AUTH)
        .send(VALID_POST_BODY)
        .expect(201);

      await request(app.getHttpServer())
        .put(`${SA_BLOGS_PATH}/${blog.id}/posts/${createPostRes.body.id}`)
        .send({ title: 't', shortDescription: 's', content: 'c' })
        .expect(401);
    });

    it('400 — некорректное тело', async () => {
      const blog = await createBlog();
      const createPostRes = await request(app.getHttpServer())
        .post(`${SA_BLOGS_PATH}/${blog.id}/posts`)
        .set('Authorization', BASIC_AUTH)
        .send(VALID_POST_BODY)
        .expect(201);

      await request(app.getHttpServer())
        .put(`${SA_BLOGS_PATH}/${blog.id}/posts/${createPostRes.body.id}`)
        .set('Authorization', BASIC_AUTH)
        .send({
          title: '',
          shortDescription: 'ok-short',
          content: 'ok-content',
        })
        .expect(400);
    });

    it('404 — блог не существует', async () => {
      await request(app.getHttpServer())
        .put(`${SA_BLOGS_PATH}/${NON_EXISTENT_BLOG_ID}/posts/${NON_EXISTENT_POST_ID}`)
        .set('Authorization', BASIC_AUTH)
        .send({
          title: 't',
          shortDescription: 'short-desc-here',
          content: 'content-here',
        })
        .expect(404);
    });

    it('404 — пост не существует', async () => {
      const blog = await createBlog();
      await request(app.getHttpServer())
        .put(`${SA_BLOGS_PATH}/${blog.id}/posts/${NON_EXISTENT_POST_ID}`)
        .set('Authorization', BASIC_AUTH)
        .send({
          title: 't',
          shortDescription: 'short-desc-here',
          content: 'content-here',
        })
        .expect(404);
    });

    it('404 — пост принадлежит другому блогу', async () => {
      const blogA = await createBlog();
      const blogB = await createBlog({
        name: 'other-blog',
        description: 'other',
        websiteUrl: 'https://other.com',
      });

      const createPostRes = await request(app.getHttpServer())
        .post(`${SA_BLOGS_PATH}/${blogA.id}/posts`)
        .set('Authorization', BASIC_AUTH)
        .send(VALID_POST_BODY)
        .expect(201);

      await request(app.getHttpServer())
        .put(`${SA_BLOGS_PATH}/${blogB.id}/posts/${createPostRes.body.id}`)
        .set('Authorization', BASIC_AUTH)
        .send({
          title: 't',
          shortDescription: 'short-desc-here',
          content: 'content-here',
        })
        .expect(404);
    });
  });
});
