import { AuthService } from './../../src/modules/user-accounts/application/auth-service';
import { Test } from '@nestjs/testing';
import { UsersRepository } from '../../src/modules/user-accounts/infrastructure/users/usersRepository';


describe('AuthService - Password Recovery', () => {
  let authService: AuthService;
  let usersRepository: UsersRepository;
  let emailService: EmailAdapter;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: EmailAdapter,
          useValue: {
            sendRecoveryEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
    usersRepository = moduleRef.get(UsersRepository);
    emailService = moduleRef.get(EmailAdapter);
  });

  it('should send recovery email for existing user', async () => {
    // Arrange
    const mockUser = {
      _id: '123',
      email: 'user@example.com',
      // ... другие поля
    };

    usersRepository.findByEmail = jest.fn().mockResolvedValue(mockUser);
    emailService.sendRecoveryEmail = jest.fn().mockResolvedValue(true);

    // Act
    await authService.passwordRecovery('user@example.com');

    // Assert
    expect(usersRepository.findByEmail).toHaveBeenCalledWith(
      'user@example.com',
    );
    expect(emailService.sendRecoveryEmail).toHaveBeenCalledWith(
      mockUser.email,
      expect.any(String), // recovery token
    );
  });

  it('should throw error for non-existing user', async () => {
    // Arrange
    usersRepository.findByEmail = jest.fn().mockResolvedValue(null);

    // Act & Assert
    await expect(
      authService.passwordRecovery('nonexistent@example.com'),
    ).rejects.toThrow('User not found');
  });
});
