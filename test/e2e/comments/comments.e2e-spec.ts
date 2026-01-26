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
  let url: string;

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

    //--------- инициализируем модели
    userModel = moduleFixture.get(getModelToken(User.name));
    await userModel.deleteMany({});

    postModel = moduleFixture.get(getModelToken(PostEntity.name));
    commentModel = moduleFixture.get(getModelToken(Comment.name));
    blogModel = moduleFixture.get(getModelToken(Blog.name));

    const testUser = await createTestUser(userModel);

    testUserId = testUser._id.toString();

    const loginResponse = await request(app.getHttpServer())
      .post('/hometask_15/api/auth/login')
      .send({
        loginOrEmail: 'testuser',
        password: 'testpassword',
      });

    authToken = loginResponse.body.accessToken;
    console.log(authToken, 'authToken afrer login response check');

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

  it('should reject invalid content - too short (400)', async () => {
    const invalidData = {
      content: 'short',
    };
    url = `/hometask_15/api/posts/${testPostId}/comments`;
    console.log(authToken, 'auth token check');
    await request(app.getHttpServer())
      .post(url)
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidData)
      .expect(400);
  });

  it('should reject invalid content - too long (400)', async () => {
    const invalidData = {
      content: 'a'.repeat(401),
    };
    url = `/hometask_15/api/posts/${testPostId}/comments`;

    await request(app.getHttpServer())
      .post(url)
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidData)
      .expect(400);
  });

  it('should reject invalid content - is not string', async () => {
    const invalidData = {
      content: 23,
    };

    url = `/hometask_15/api/posts/${testPostId}/comments`;

    await request(app.getHttpServer())
      .post(url)
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidData)
      .expect(400);
  });

  //-------------------------//----------------------------------------------------//

  it('should reject without authorization (401)', async () => {
    const commentData = {
      content: 'Comment without auth',
    };

    url = `/hometask_15/api/posts/${testPostId}/comments`;

    await request(app.getHttpServer()).post(url).send(commentData).expect(401);
  });

  it('should reject with invalid token (401)', async () => {
    const commentData = {
      content: 'Comment with invalid token',
    };

    url = `/hometask_15/api/posts/${testPostId}/comments`;

    await request(app.getHttpServer())
      .post(url)
      .set('Authorization', 'Bearer invalid_token_here')
      .send(commentData)
      .expect(401);
  });

  //-------------------------//----------------------------------------------------//

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

  it('should create multiple comments for same post', async () => {
    const comments = [
      { content: 'First comment with enough length' },
      { content: 'Second comment with enough length' },
      { content: 'Third comment with enough length' },
    ];

    url = `/hometask_15/api/posts/${testPostId}/comments`;

    for (const comment of comments) {
      await request(app.getHttpServer())
        .post(url)
        .set('Authorization', `Bearer ${authToken}`)
        .send(comment)
        .expect(201);
    }
  });
});
