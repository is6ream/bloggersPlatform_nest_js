import { TestingModule, Test } from '@nestjs/testing';
import { UsersQueryRepository } from './usersQueryRepository';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../domain/userEntity';
import { GetUsersQueryParams } from '../api/get-users-query-params.input.dto';

describe('UsersQueyRepository', () => {
  let repository: UsersQueryRepository;
  let mockUserModel: any;

  beforeEach(async () => {
    mockUserModel = {
      find: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([
              {
                _id: '1',
                login: 'user1',
                email: 'user1@test.com',
                createdAt: new Date(),
              },
              {
                _id: '2',
                login: 'user2',
                email: 'user2@test.com',
                createdAt: new Date(),
              },
            ]),
          }),
        }),
      }),
      countDocuments: jest.fn().mockResolvedValue(2),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersQueryRepository,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    repository = module.get<UsersQueryRepository>(UsersQueryRepository);
  });

  it('should return paginated users', async () => {
    const query = new GetUsersQueryParams();
    query.pageNumber = 1;
    query.pageSize = 10;

    const result = await repository.getAll(query);

    expect(result.items).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(mockUserModel.find).toHaveBeenCalled();
    expect(mockUserModel.countDocuments).toHaveBeenCalled();
  });
});
