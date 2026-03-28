import { EmailAdapter } from './../../notifications/email-adapter';
import { AuthService } from './auth-service';
import { UsersRepository } from '../infrastructure/users/usersRepository';
import { Test } from '@nestjs/testing';
import { UsersService } from './user-service';
import { JwtService } from '@nestjs/jwt';
import { BcryptService } from './bcrypt-service';
import { DeviceSessionsRepository } from '../infrastructure/auth/device-sessions.repository';
import { ConfigService } from '@nestjs/config';

describe('AuthService - Password Recovery', () => {
  let authService: AuthService;
  let usersRepository: {
    findByEmail: jest.Mock;
    findByRecoveryCode: jest.Mock;
    save: jest.Mock;
  };
  let emailAdapter: EmailAdapter;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
            findByRecoveryCode: jest.fn(),
            save: jest.fn(),
            findById: jest.fn(),
            findOrNotFoundFail: jest.fn(),
            findUserByLoginOrEmail: jest.fn(),
            findByConfirmationCode: jest.fn(),
            updateRefreshTokenHash: jest.fn(),
            findByIdOrThrowValidationError: jest.fn(),
            findOrThrowValidationErrorWithExtenstions: jest.fn(),
            findByLogin: jest.fn(),
          },
        },
        {
          provide: EmailAdapter,
          useValue: {
            sendConfirmationCodeEmail: jest.fn().mockResolvedValue(true),
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
            generateHash: jest.fn().mockResolvedValue('new-hash'),
            checkPassword: jest.fn(),
          },
        },
        {
          provide: DeviceSessionsRepository,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn() },
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
    usersRepository = moduleRef.get(UsersRepository) as typeof usersRepository;
    emailAdapter = moduleRef.get(EmailAdapter);
  });

  it('should send recovery email for existing user', async () => {
    const mockUser = {
      id: '123',
      email: 'user@example.com',
      emailConfirmation: {
        confirmationCode: 'abc-123-def',
        isConfirmed: true,
        expirationDate: new Date(),
      },
      passwordRecovery: null as { code: string } | null,
      requestPasswordRecovery() {
        this.passwordRecovery = { code: 'recovery-code' };
      },
    };

    usersRepository.findByEmail.mockResolvedValue(mockUser as any);
    usersRepository.save.mockResolvedValue(undefined);

    await authService.passwordRecovery('user@example.com');

    expect(usersRepository.findByEmail).toHaveBeenCalledWith(
      'user@example.com',
    );
    expect(emailAdapter.sendConfirmationCodeEmail).toHaveBeenCalledWith(
      mockUser.email,
      'recovery-code',
    );
  });

  it('should confirm new password', async () => {
    const mockDto = {
      newPassword: '12345678',
      recoveryCode: '3213dsfdrewfsert4',
    };

    const expiresAt = new Date(Date.now() + 60_000);
    const mockUser = {
      passwordRecovery: { expiresAt, code: mockDto.recoveryCode, isUsed: false },
      passwordHash: 'old',
    };

    usersRepository.findByRecoveryCode.mockResolvedValue(mockUser as any);
    usersRepository.save.mockResolvedValue(undefined);

    await authService.resetPassword(mockDto.newPassword, mockDto.recoveryCode);

    expect(usersRepository.findByRecoveryCode).toHaveBeenCalledWith(
      mockDto.recoveryCode,
    );
    expect(usersRepository.save).toHaveBeenCalledWith(mockUser);
    expect(mockUser.passwordHash).toBe('new-hash');
  });
});
