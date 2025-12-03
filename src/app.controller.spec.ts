import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { UserController } from './modules/userAccounts/api/user-controller';

describe('AppController', () => {
  let usersController: UserController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [AppService],
    }).compile();

    usersController = app.get<UserController>(UserController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(usersController.getAll()).toBe('Hello World!');
    });
  });
});
