import { EmailAdapter } from './../../notifications/email-adapter';
import { AuthService } from './auth-service';
import { UsersRepository } from '../infrastructure/users/usersRepository';
import { Test } from '@nestjs/testing';
import { UsersService } from './user-service';
import { JwtService } from '@nestjs/jwt';
import { BcryptService } from './bcrypt-service';
import { User } from '../domain/userEntity';

describe('AuthService - Password Recovery', () => {
  let authService: AuthService;
  let usersRepository: UsersRepository;
  let emailAdapter: EmailAdapter;
  let usersService: UsersService;

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
        {
          provide: UsersService,
          useValue: {
            createUser: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: BcryptService,
          useValue: {
            generateHash: jest.fn(),
            checkPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
    usersRepository = moduleRef.get(UsersRepository);
    emailAdapter = moduleRef.get(EmailAdapter);
  });

  it('should send recovery email for existing user', async () => {
    const mockUser = {
      _id: '123',
      email: 'user@example.com',
      emailConfirmation: {
        confirmationCode: 'abc-123-def',
        isConfirmed: false,
        expirationDate: new Date(),
      },
    };

    usersRepository.findByEmail = jest.fn().mockResolvedValue(mockUser);
    emailAdapter.sendRecoveryCodeEmail = jest.fn().mockResolvedValue(true);

    await authService.passwordRecovery('user@example.com');

    expect(usersRepository.findByEmail).toHaveBeenCalledWith(
      'user@example.com',
    );
    expect(emailAdapter.sendRecoveryCodeEmail).toHaveBeenCalledWith(
      mockUser.email,
      expect.any(String),
    );
  });

  it('should confirm new password', async () => {
    const mockDto = {
      newPassword: '12345678',
      recoveryCode: '3213dsfdrewfsert4',
    };

    usersRepository.findByRecoveryCode = jest
      .fn()
      .mockResolvedValue(mockDto.recoveryCode);

    await authService.resetPassword(mockDto.newPassword, mockDto.recoveryCode);

    expect(usersRepository.findByRecoveryCode).toHaveBeenCalledWith(
      mockDto.recoveryCode,
    );
  });

  // it('should throw error for non-existing user', async () => {
  //   usersRepository.findByEmail = jest.fn().mockResolvedValue(null);

  //   await expect(
  //     authService.passwordRecovery('nonexistent@example.com'),
  //   ).rejects.toThrow('User not found');
  // });
});
