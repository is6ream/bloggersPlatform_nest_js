import { UsersService } from 'src/modules/user-accounts/application/user-service';
import { CreateUserDto } from 'src/modules/user-accounts/dto/UserInputDto';

export const usersEntities = [
  {
    login: 'testLog',
    email: 'test@email.com',
    password: '12345',
  },
  {
    login: 'testLog1',
    email: 'test1@email.com',
    password: 'testLog1',
  },
  {
    login: 'testLog2',
    email: 'test2@email.com',
    password: 'testLog2',
  },
  {
    login: 'testLog3',
    email: 'test3@email.com',
    password: 'testLog3',
  },
];

export async function createFourUsers(
  arr: CreateUserDto[],
  usersService: UsersService,
): Promise<string[]> {
  const usersIds = [];
  for (let i = 0; i < arr.length; i++) {
    const user = await usersService.createUser(arr[i]);
    usersIds.push(user);
  }
  return usersIds;
}
