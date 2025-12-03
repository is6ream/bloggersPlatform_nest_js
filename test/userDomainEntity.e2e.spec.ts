import { User } from 'src/modules/userAccounts/domain/userEntity';

describe('Userentity methods tests', () => {
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
