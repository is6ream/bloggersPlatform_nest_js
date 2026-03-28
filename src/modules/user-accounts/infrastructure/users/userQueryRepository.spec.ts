import { TestingModule, Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UsersRawSqlQueryRepository } from './users-raw-sql.query-repository';
import { GetUsersQueryParams } from '../../api/dto/output/get-users-query-params.input.dto';

describe('UsersRawSqlQueryRepository', () => {
  let repository: UsersRawSqlQueryRepository;
  let queryMock: jest.Mock;

  beforeEach(async () => {
    queryMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRawSqlQueryRepository,
        {
          provide: DataSource,
          useValue: { query: queryMock },
        },
      ],
    }).compile();

    repository = module.get(UsersRawSqlQueryRepository);
  });

  it('should return paginated users', async () => {
    const rows = [
      {
        id: '1',
        login: 'user1',
        email: 'user1@test.com',
        passwordHash: 'h',
        confirmationCode: 'c',
        confirmationExpiration: new Date(),
        isEmailConfirmed: true,
        recoveryCode: null,
        recoveryExpiresAt: null,
        recoveryIsUsed: null,
        createdAt: new Date(),
        deleteAt: null,
        refreshTokenHash: null,
      },
      {
        id: '2',
        login: 'user2',
        email: 'user2@test.com',
        passwordHash: 'h',
        confirmationCode: 'c',
        confirmationExpiration: new Date(),
        isEmailConfirmed: true,
        recoveryCode: null,
        recoveryExpiresAt: null,
        recoveryIsUsed: null,
        createdAt: new Date(),
        deleteAt: null,
        refreshTokenHash: null,
      },
    ];

    queryMock
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(rows)
      .mockResolvedValueOnce([{ count: 2 }]);

    const query = new GetUsersQueryParams();
    query.pageNumber = 1;
    query.pageSize = 10;

    const result = await repository.getAll(query);

    expect(result.items).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(queryMock).toHaveBeenCalled();
  });
});
