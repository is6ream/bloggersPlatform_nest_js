import { User } from './userEntity';

describe('User entity methods tests', () => {
  //хочу посмотреть name
  it('should create new user', () => {
    const user = User.createInstance({
      email: 'test@email.com',
      passwordHash: '321321321fsdfds',
      login: 'testLogin',
    });

    console.log(User.name, 'username check');

    expect(user.email).toBe('test@email.com');
  });
});
