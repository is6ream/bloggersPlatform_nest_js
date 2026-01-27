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


describe('Comments Likes E2E Tests', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let mongoConnection: Connection;
  let moduleFixture: TestingModule;
  let commentModel: any;
  let postModel: any;
  let blogModel: any;
  let userModel: any;
  let authToken: string;
  let testUserId: string;
  let testPostId: string;
  let testCommentId: string;

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

    // Очищаем базу
    await userModel.deleteMany({});
    await blogModel.deleteMany({});
    await postModel.deleteMany({});
    await commentModel.deleteMany({});

    // Создаем тестовые данные
    const testUser = await createTestUser(userModel);
    const testUserId = testUser._id.toString();
    // Получаем токен
    const loginResponse = await request(app.getHttpServer())
      .post('/hometask_15/api/auth/login')
      .send({
        loginOrEmail: 'testuser',
        password: 'testpassword',
      });
    authToken = loginResponse.body.accessToken;

    // Создаем блог и пост
    const testBlog = await createTestBlog(blogModel);
    const testPost = await createTestPost(
      postModel,
      testBlog._id.toString(),
      testBlog.name,
    );
    testPostId = testPost._id.toString();

    // Создаем комментарий для тестирования лайков
    const testComment = await createTestCommentForLikes(
      commentModel,
      testPostId,
      testUserId,
      testUser.login,
      {
        content: 'Test comment for like operations',
      }
    );
    testCommentId = testComment._id.toString();
  });

  afterAll(async () => {
    await mongoConnection.close();
    await mongoServer.stop();
    await app.close();
  })})