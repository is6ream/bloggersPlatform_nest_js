import { HttpStatus, INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/modules/app-module/app-module';
import { appSetup } from 'src/setup/app.setup';
import { getModelToken } from '@nestjs/mongoose';
import { PostEntity } from 'src/modules/bloggers-platform/posts/domain/postEntity';
import { Blog } from 'src/modules/bloggers-platform/blogs/domain/blogEntity';
import { Like } from 'src/modules/bloggers-platform/likes/domain/like-entity';
import { createTestBlog } from '../../helpers/factory/blog-factory';
import request from 'supertest';
import { createCustomTestUser } from '../../helpers/factory/custom-user.factory';
import { deleteAllE2eUsers } from '../../helpers/factory/user-factory';
import { e2eApiPath } from '../helpers/api-path';

describe('Post Likes E2E tests', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let mongoConnection: Connection;
  let moduleFixture: TestingModule;

  let postModel: any;
  let blogModel: any;
  let likeModel: any;

  const BASIC_AUTH = 'Basic YWRtaW46cXdlcnR5';

  let user1: any;
  let user2: any;
  let user1Token: string;
  let user2Token: string;

  async function loginAndGetAccessToken(
    loginOrEmail: string,
    password: string,
  ) {
    const res = await request(app.getHttpServer())
      .post(e2eApiPath('auth/login'))
      .send({ loginOrEmail, password })
      .expect(HttpStatus.OK);

    expect(res.body.accessToken).toEqual(expect.any(String));

    return res.body.accessToken as string;
  }

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
    likeModel = moduleFixture.get(getModelToken(Like.name));

    await deleteAllE2eUsers();
    await blogModel.deleteMany({});
    await postModel.deleteMany({});
    await likeModel.deleteMany({});

    const created1 = await createCustomTestUser({
      login: 'user1',
      password: 'pass1',
    });
    user1 = created1.user;
    user1Token = await loginAndGetAccessToken('user1', created1.password);

    const created2 = await createCustomTestUser({
      login: 'user2',
      password: 'pass2',
    });
    user2 = created2.user;
    user2Token = await loginAndGetAccessToken('user2', created2.password);
  });

  afterAll(async () => {
    await mongoConnection.close();
    await mongoServer.stop();
    await app.close();
  });

  beforeEach(async () => {
    await blogModel.deleteMany({});
    await postModel.deleteMany({});
    await likeModel.deleteMany({});
  });

  it('like/dislike flow + myStatus checks', async () => {
    // 1) create blog
    const createBlogResponse = await request(app.getHttpServer())
      .post(e2eApiPath('blogs'))
      .set('Authorization', BASIC_AUTH)
      .send({
        name: 'string',
        description: 'string',
        websiteUrl: 'https://slamick.com',
      })
      .expect(HttpStatus.CREATED);

    const blogId = createBlogResponse.body.id;

    // 2) create post
    const createPostResponse = await request(app.getHttpServer())
      .post(e2eApiPath('posts'))
      .set('Authorization', BASIC_AUTH)
      .send({
        title: 'new post title',
        shortDescription: 'new post shortDescription',
        content: 'new post content',
        blogId,
      })
      .expect(HttpStatus.CREATED);

    const postId = createPostResponse.body.id;

    // 3) user1 likes (PUT must return 204)
    await request(app.getHttpServer())
      .put(e2eApiPath(`posts/${postId}/like-status`))
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ likeStatus: 'Like' })
      .expect(HttpStatus.NO_CONTENT);

    // 4) get by user2 => myStatus should be None, but likesCount should include user1 like
    const getByUser2 = await request(app.getHttpServer())
      .get(e2eApiPath(`posts/${postId}`))
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(HttpStatus.OK);

    expect(getByUser2.body.extendedLikesInfo).toEqual(
      expect.objectContaining({
        likesCount: 1,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: expect.any(Array),
      }),
    );

    if (getByUser2.body.extendedLikesInfo.newestLikes.length) {
      expect(getByUser2.body.extendedLikesInfo.newestLikes[0]).toEqual(
        expect.objectContaining({
          userId: user1.id,
          addedAt: expect.any(String),
          login: expect.any(String),
        }),
      );
    }

    // 5) user2 dislikes (PUT must return 204)
    await request(app.getHttpServer())
      .put(e2eApiPath(`posts/${postId}/like-status`))
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ likeStatus: 'Dislike' })
      .expect(HttpStatus.NO_CONTENT);

    // 6) get by user1 => myStatus should be Like; dislikesCount increments
    const getByUser1 = await request(app.getHttpServer())
      .get(e2eApiPath(`posts/${postId}`))
      .set('Authorization', `Bearer ${user1Token}`)
      .expect(HttpStatus.OK);

    expect(getByUser1.body.extendedLikesInfo).toEqual(
      expect.objectContaining({
        likesCount: 1,
        dislikesCount: 1,
        myStatus: 'Like',
        newestLikes: expect.any(Array),
      }),
    );
  });
});
