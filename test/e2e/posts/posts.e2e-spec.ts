// test/posts-likes.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Connection, connect } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from 'src/modules/app-module/app-module';

describe('Posts Likes E2E Test', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let mongoConnection: Connection;

  // Константы для URL (используем ваши пути)
  const BASE_URL = '/hometask_15/api';
  const POSTS_BASE = `${BASE_URL}/posts`;
  const COMMENTS_BASE = `${BASE_URL}/comments`;
  const BLOGS_BASE = `${BASE_URL}/blogs`;
  const SA_BASE = `${BASE_URL}/sa`;
  const AUTH_BASE = `${BASE_URL}/auth`;

  // Тестовые данные
  let userToken: string;
  let userId: string;
  let userLogin: string;
  let blogId: string;
  const postIds: string[] = [];

  // Быстрый хелпер для Basic Auth
  const basicAuth = (login: string, password: string) =>
    `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`;

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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    mongoConnection = (await connect(uri)).connection;
  });

  beforeEach(async () => {
    // Очищаем БД перед тестом
    await mongoConnection.dropDatabase();

    // Шаг 1: Создаем пользователя через админку (Basic Auth)
    userLogin = 'testuser';
    const userPassword = 'testpassword123';
    const adminLogin = 'admin';
    const adminPassword = 'qwerty';

    // Создаем пользователя через SA
    await request(app.getHttpServer())
      .post(`${BASE_URL}/users`)
      .set('Authorization', basicAuth(adminLogin, adminPassword))
      .send({
        login: userLogin,
        password: userPassword,
        email: 'testuser@example.com',
      })
      .expect(201);

    // Шаг 2: Логинимся как пользователь (получаем Bearer токен)
    const loginResponse = await request(app.getHttpServer())
      .post(`${AUTH_BASE}/login`)
      .send({
        loginOrEmail: userLogin,
        password: userPassword,
      })
      .expect(200);

    userToken = loginResponse.body.accessToken;
    userId =
      loginResponse.body.userId || loginResponse.body.id || 'test-user-id';

    // Шаг 3: Создаем блог для постов
    // Сначала проверим, какой endpoint используется для создания блога
    // Вариант A: если через SA
    const blogResponse = await request(app.getHttpServer())
      .post(`${BLOGS_BASE}`)
      .set('Authorization', basicAuth(adminLogin, adminPassword))
      .send({
        name: 'Тестовый блог',
        description: 'Описание тестового блога',
        websiteUrl: 'https://testblog.com',
      })
      .expect(201);

    blogId = blogResponse.body.id;
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongoServer.stop();
    await app.close();
  });

  it('Создаем 4 поста, ставим лайки, проверяем что userLogin в ответе совпадает', async () => {
    console.log('=== ТЕСТ: Создание постов и проверка лайков ===');
    console.log('Base URL:', BASE_URL);
    console.log('Posts endpoint:', POSTS_BASE);

    // Шаг 1: Создаем 4 поста
    console.log('\n=== Шаг 1: Создаем 4 поста ===');

    const postsData = [
      {
        title: 'Первый пост про программирование',
        shortDescription: 'Краткое описание первого поста',
        content: 'Полное содержание первого поста...',
        blogId: blogId, // Важно: передаем blogId в DTO
      },
      {
        title: 'Второй пост про Nest.js',
        shortDescription: 'Изучаем Nest.js вместе',
        content: 'Nest.js - отличный фреймворк для Node.js...',
        blogId: blogId,
      },
      {
        title: 'Третий пост про MongoDB',
        shortDescription: 'Работа с MongoDB в Nest.js',
        content: 'MongoDB - документоориентированная база данных...',
        blogId: blogId,
      },
      {
        title: 'Четвертый пост про тестирование',
        shortDescription: 'E2E тестирование в Nest.js',
        content: 'Тестирование - важная часть разработки...',
        blogId: blogId,
      },
    ];

    for (let i = 0; i < postsData.length; i++) {
      console.log(`\nСоздаем пост ${i + 1}:`);
      console.log('  Заголовок:', postsData[i].title);
      console.log('  Blog ID:', postsData[i].blogId);

      // Проверяем какой endpoint используется для создания постов:
      // Вариант A: POST /blogs/{blogId}/posts
      // Вариант B: POST /posts с передачей blogId в теле

      // Попробуем оба варианта, но начнем с вашего DTO
      const response = await request(app.getHttpServer())
        .post(`${POSTS_BASE}`) // Прямое создание через posts endpoint
        .set('Authorization', basicAuth('admin', 'qwerty')) // или Bearer токен
        .send(postsData[i])
        .expect(201);

      // Если не работает, попробуем альтернативный вариант:
      // const response = await request(app.getHttpServer())
      //   .post(`${BLOGS_BASE}/${blogId}/posts`)
      //   .set('Authorization', `Bearer ${userToken}`)
      //   .send({
      //     title: postsData[i].title,
      //     shortDescription: postsData[i].shortDescription,
      //     content: postsData[i].content,
      //   })
      //   .expect(201);

      const postId = response.body.id;
      postIds.push(postId);
      console.log(`  ✓ Создан пост с ID: ${postId}`);
    }

    console.log(`\nВсего создано постов: ${postIds.length}`);
    console.log('ID постов:', postIds);

    // Шаг 2: Создаем дополнительных пользователей для лайков
    console.log('\n=== Шаг 2: Создаем дополнительных пользователей ===');

    const otherUsers = [
      { login: 'john_doe', password: 'password123', email: 'john@example.com' },
      {
        login: 'jane_smith',
        password: 'password456',
        email: 'jane@example.com',
      },
    ];

    const adminLogin = 'admin';
    const adminPassword = 'qwerty';

    // Создаем других пользователей через SA
    for (const user of otherUsers) {
      await request(app.getHttpServer())
        .post(`${SA_BASE}/users`)
        .set('Authorization', basicAuth(adminLogin, adminPassword))
        .send({
          login: user.login,
          password: user.password,
          email: user.email,
        })
        .expect(201);
      console.log(`  ✓ Создан пользователь: ${user.login}`);
    }

    // Собираем токены других пользователей
    const otherTokens: string[] = [];
    for (const user of otherUsers) {
      const authResponse = await request(app.getHttpServer())
        .post(`${AUTH_BASE}/login`)
        .send({
          loginOrEmail: user.login,
          password: user.password,
        })
        .expect(200);

      otherTokens.push(authResponse.body.accessToken);
      console.log(`  ✓ Токен получен для: ${user.login}`);
    }

    console.log(`\nВсего дополнительных пользователей: ${otherUsers.length}`);

    // Шаг 3: Распределяем лайки
    console.log('\n=== Шаг 3: Распределяем лайки на посты ===');

    // Пост 1: лайк от нашего пользователя + 2 других пользователя
    console.log(`\nПост 1 (ID: ${postIds[0]}):`);
    console.log('  Добавляем лайк от основного пользователя');
    await request(app.getHttpServer())
      .put(`${POSTS_BASE}/${postIds[0]}/like-status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ likeStatus: 'Like' })
      .expect(204);

    for (let i = 0; i < otherTokens.length; i++) {
      console.log(`  Добавляем лайк от: ${otherUsers[i].login}`);
      await request(app.getHttpServer())
        .put(`${POSTS_BASE}/${postIds[0]}/like-status`)
        .set('Authorization', `Bearer ${otherTokens[i]}`)
        .send({ likeStatus: 'Like' })
        .expect(204);
    }
    console.log(`  ✓ Всего лайков на пост 1: 3`);

    // Пост 2: лайк только от нашего пользователя
    console.log(`\nПост 2 (ID: ${postIds[1]}):`);
    console.log('  Добавляем лайк от основного пользователя');
    await request(app.getHttpServer())
      .put(`${POSTS_BASE}/${postIds[1]}/like-status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ likeStatus: 'Like' })
      .expect(204);
    console.log(`  ✓ Всего лайков на пост 2: 1`);

    // Пост 3: дизлайк от нашего пользователя, лайк от другого
    console.log(`\nПост 3 (ID: ${postIds[2]}):`);
    console.log('  Добавляем дизлайк от основного пользователя');
    await request(app.getHttpServer())
      .put(`${POSTS_BASE}/${postIds[2]}/like-status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ likeStatus: 'Dislike' })
      .expect(204);

    console.log(`  Добавляем лайк от: ${otherUsers[0].login}`);
    await request(app.getHttpServer())
      .put(`${POSTS_BASE}/${postIds[2]}/like-status`)
      .set('Authorization', `Bearer ${otherTokens[0]}`)
      .send({ likeStatus: 'Like' })
      .expect(204);
    console.log(`  ✓ Лайков: 1, Дизлайков: 1`);

    // Пост 4: оставляем без лайков от нашего пользователя, но лайк от другого
    console.log(`\nПост 4 (ID: ${postIds[3]}):`);
    console.log(`  Добавляем лайк от: ${otherUsers[1].login}`);
    await request(app.getHttpServer())
      .put(`${POSTS_BASE}/${postIds[3]}/like-status`)
      .set('Authorization', `Bearer ${otherTokens[1]}`)
      .send({ likeStatus: 'Like' })
      .expect(204);
    console.log(`  ✓ Всего лайков на пост 4: 1 (от другого пользователя)`);

    // Даем время на обработку
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('\n=== Ожидание обработки лайков завершено ===');

    // Шаг 4: Запрашиваем все посты (авторизованным пользователем)
    console.log('\n=== Шаг 4: Запрашиваем все посты ===');
    console.log(`Используем токен пользователя: ${userLogin}`);
    console.log(`Endpoint: GET ${POSTS_BASE}`);

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

    console.log('✓ Статус ответа:', response.status);
    console.log('✓ Количество постов в ответе:', response.body.items.length);

    // Проверяем структуру ответа
    expect(response.body).toHaveProperty('pagesCount');
    expect(response.body).toHaveProperty('page', 1);
    expect(response.body).toHaveProperty('pageSize', 10);
    expect(response.body).toHaveProperty('totalCount', 4);
    expect(response.body).toHaveProperty('items');
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBe(4);

    // Шаг 5: Проверяем каждый пост
    console.log('\n=== Шаг 5: Проверяем данные в ответе ===');

    const posts = response.body.items;

    // Проверка 1: Пост с 3 лайками
    const post1 = posts.find((p: any) => p.id === postIds[0]);
    console.log(`\nПроверка поста 1 (ID: ${postIds[0]}):`);
    console.log(`  Заголовок: ${post1.title}`);
    console.log(`  Лайков: ${post1.extendedLikesInfo.likesCount}`);
    console.log(`  Дизлайков: ${post1.extendedLikesInfo.dislikesCount}`);
    console.log(`  Наш статус (myStatus): ${post1.extendedLikesInfo.myStatus}`);
    console.log(
      `  Новых лайков (newestLikes): ${post1.extendedLikesInfo.newestLikes.length}`,
    );

    expect(post1).toBeDefined();
    expect(post1.extendedLikesInfo.likesCount).toBe(3);
    expect(post1.extendedLikesInfo.dislikesCount).toBe(0);
    expect(post1.extendedLikesInfo.myStatus).toBe('Like');
    expect(post1.extendedLikesInfo.newestLikes.length).toBe(3);

    // Ключевая проверка: наш userLogin должен быть в newestLikes
    const userLikeInPost1 = post1.extendedLikesInfo.newestLikes.find(
      (like: any) => like.login === userLogin,
    );

    expect(userLikeInPost1).toBeDefined();
    expect(userLikeInPost1.login).toBe(userLogin);
    expect(userLikeInPost1.userId).toBe(userId);
    console.log(`  ✓ Наш логин в newestLikes: ${userLikeInPost1.login}`);
    console.log(`  ✓ Ожидаемый логин: ${userLogin}`);
    console.log(`  ✓ UserId в ответе: ${userLikeInPost1.userId}`);
    console.log(`  ✓ Ожидаемый userId: ${userId}`);

    // Проверка 2: Пост с 1 лайком (только наш)
    const post2 = posts.find((p: any) => p.id === postIds[1]);
    console.log(`\nПроверка поста 2 (ID: ${postIds[1]}):`);
    console.log(`  Заголовок: ${post2.title}`);
    console.log(`  Лайков: ${post2.extendedLikesInfo.likesCount}`);
    console.log(`  Наш статус: ${post2.extendedLikesInfo.myStatus}`);
    console.log(
      `  Новых лайков: ${post2.extendedLikesInfo.newestLikes.length}`,
    );

    expect(post2.extendedLikesInfo.likesCount).toBe(1);
    expect(post2.extendedLikesInfo.dislikesCount).toBe(0);
    expect(post2.extendedLikesInfo.myStatus).toBe('Like');
    expect(post2.extendedLikesInfo.newestLikes.length).toBe(1);
    expect(post2.extendedLikesInfo.newestLikes[0].login).toBe(userLogin);
    console.log(
      `  ✓ Логин в newestLikes: ${post2.extendedLikesInfo.newestLikes[0].login}`,
    );

    // Проверка 3: Пост с нашим дизлайком и чужим лайком
    const post3 = posts.find((p: any) => p.id === postIds[2]);
    console.log(`\nПроверка поста 3 (ID: ${postIds[2]}):`);
    console.log(`  Заголовок: ${post3.title}`);
    console.log(`  Лайков: ${post3.extendedLikesInfo.likesCount}`);
    console.log(`  Дизлайков: ${post3.extendedLikesInfo.dislikesCount}`);
    console.log(`  Наш статус: ${post3.extendedLikesInfo.myStatus}`);
    console.log(
      `  Новых лайков: ${post3.extendedLikesInfo.newestLikes.length}`,
    );

    expect(post3.extendedLikesInfo.likesCount).toBe(1);
    expect(post3.extendedLikesInfo.dislikesCount).toBe(1);
    expect(post3.extendedLikesInfo.myStatus).toBe('Dislike');
    expect(post3.extendedLikesInfo.newestLikes.length).toBe(1);
    expect(post3.extendedLikesInfo.newestLikes[0].login).toBe(
      otherUsers[0].login,
    );
    console.log(
      `  ✓ Логин в newestLikes: ${post3.extendedLikesInfo.newestLikes[0].login}`,
    );
    console.log(`  ✓ Это логин другого пользователя (не наш)`);

    // Проверка 4: Пост без нашей реакции
    const post4 = posts.find((p: any) => p.id === postIds[3]);
    console.log(`\nПроверка поста 4 (ID: ${postIds[3]}):`);
    console.log(`  Заголовок: ${post4.title}`);
    console.log(`  Лайков: ${post4.extendedLikesInfo.likesCount}`);
    console.log(`  Дизлайков: ${post4.extendedLikesInfo.dislikesCount}`);
    console.log(`  Наш статус: ${post4.extendedLikesInfo.myStatus}`);
    console.log(
      `  Новых лайков: ${post4.extendedLikesInfo.newestLikes.length}`,
    );

    expect(post4.extendedLikesInfo.likesCount).toBe(1);
    expect(post4.extendedLikesInfo.dislikesCount).toBe(0);
    expect(post4.extendedLikesInfo.myStatus).toBe('None');
    expect(post4.extendedLikesInfo.newestLikes.length).toBe(1);
    expect(post4.extendedLikesInfo.newestLikes[0].login).toBe(
      otherUsers[1].login,
    );
    console.log(
      `  ✓ Логин в newestLikes: ${post4.extendedLikesInfo.newestLikes[0].login}`,
    );
    console.log(`  ✓ Это логин другого пользователя`);

    // Итоговая проверка
    console.log('\n' + '='.repeat(50));
    console.log('ТЕСТ УСПЕШНО ЗАВЕРШЕН!');
    console.log('='.repeat(50));
    console.log('✓ Создано 4 поста через API');
    console.log('✓ Созданы дополнительные пользователи через SA');
    console.log('✓ Расставлены лайки разными пользователями');
    console.log('✓ Запрос выполнен авторизованным пользователем');
    console.log(`✓ UserLogin в ответе (${userLogin}) совпадает с исходным`);
    console.log('✓ Все счетчики лайков/дизлайков корректны');
    console.log('✓ Статусы myStatus отображаются правильно');
    console.log('='.repeat(50));
  });

  // Дополнительный тест для проверки без авторизации
  it('должен возвращать myStatus = "None" для неавторизованного пользователя', async () => {
    const adminLogin = 'admin';
    const adminPassword = 'qwerty';

    // Создаем пост через SA
    const postResponse = await request(app.getHttpServer())
      .post(POSTS_BASE)
      .set('Authorization', basicAuth(adminLogin, adminPassword))
      .send({
        title: 'Test Post for Unauthorized',
        shortDescription: 'Test Description',
        content: 'Test Content',
        blogId: blogId,
      })
      .expect(201);

    const postId = postResponse.body.id;

    // Ставим лайк от авторизованного пользователя
    await request(app.getHttpServer())
      .put(`${POSTS_BASE}/${postId}/like-status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ likeStatus: 'Like' })
      .expect(204);

    // Запрос БЕЗ авторизации
    const response = await request(app.getHttpServer())
      .get(POSTS_BASE)
      .query({
        pageNumber: 1,
        pageSize: 10,
      })
      .expect(200);

    const post = response.body.items.find((p: any) => p.id === postId);
    expect(post).toBeDefined();
    expect(post.extendedLikesInfo.myStatus).toBe('None');
    expect(post.extendedLikesInfo.newestLikes.length).toBe(1);
  });
});
