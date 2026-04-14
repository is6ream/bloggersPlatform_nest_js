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
import { e2eApiPath } from 'test/e2e/helpers/api-path';
import { BlogsRepository } from 'src/modules/bloggers-platform/blogs/infrastructure/blogsRepository';
import { BlogsRawSqlQueryRepository } from 'src/modules/bloggers-platform/blogs/infrastructure/blogs-raw-sql.query-repository';
import { BlogSqlEntity } from 'src/modules/bloggers-platform/blogs/domain/blog-sql.entity';
import { GetBlogsQueryParams } from 'src/modules/bloggers-platform/blogs/api/query/get-blogs-query-params';
import { SortDirection } from 'src/core/dto/base.query-params.input-dto';

const TESTING_PATH = e2eApiPath('testing/all-data');

function ensureIntegrationPgEnv(): void {
  process.env.PGHOST = process.env.PGHOST || 'localhost';
  process.env.PGPORT = process.env.PGPORT || '5432';
  process.env.PGDATABASE = process.env.PGDATABASE || 'blogger_platform_test';
  process.env.PGUSER = process.env.PGUSER || 'nestjs';
  process.env.PGPASSWORD = process.env.PGPASSWORD || 'nestjs';
}

describe('Blogs repositories (integration)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let blogsRepository: BlogsRepository;
  let blogsQueryRepository: BlogsRawSqlQueryRepository;

  beforeAll(async () => {
    ensureIntegrationPgEnv();

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    appSetup(app);
    await app.init();

    blogsRepository = moduleFixture.get(BlogsRepository);
    blogsQueryRepository = moduleFixture.get(BlogsRawSqlQueryRepository);
  });

  beforeEach(async () => {
    await request(app.getHttpServer()).delete(TESTING_PATH).expect(204);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('save + findById: persist and read blog entity', async () => {
    const entity = BlogSqlEntity.createForInsert({
      name: 'repo-blog',
      description: 'repo-description',
      websiteUrl: 'https://repo-blog.com',
    });

    await blogsRepository.save(entity);

    const found = await blogsRepository.findById(entity.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(entity.id);
    expect(found?.name).toBe('repo-blog');
    expect(found?.deleteAt).toBeNull();
  });

  it('findByIdOrThrowValidationError: throw validation error for invalid id format', async () => {
    await expect(
      blogsRepository.findByIdOrThrowValidationError('invalid-id-format'),
    ).rejects.toMatchObject({
      code: 3,
      message: 'Invalid blog id format',
    });
  });

  it('getAll: exclude soft-deleted blogs and apply searchNameTerm', async () => {
    const keep = BlogSqlEntity.createForInsert({
      name: 'keep-blog',
      description: 'keep description',
      websiteUrl: 'https://keep-blog.com',
    });
    const deleteMe = BlogSqlEntity.createForInsert({
      name: 'delete-blog',
      description: 'delete description',
      websiteUrl: 'https://delete-blog.com',
    });

    await blogsRepository.save(keep);
    await blogsRepository.save(deleteMe);

    deleteMe.makeDeleted();
    await blogsRepository.save(deleteMe);

    const query = new GetBlogsQueryParams();
    query.pageNumber = 1;
    query.pageSize = 10;
    query.sortDirection = SortDirection.Desc;
    query.searchNameTerm = 'keep';

    const result = await blogsQueryRepository.getAll(query);

    expect(result.totalCount).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe(keep.id);
    expect(result.items[0].name).toBe('keep-blog');
  });
});
