import { EmailAdapter } from './../../notifications/email-adapter';
import { AuthService } from './auth-service';
import { Test } from '@nestjs/testing';
import { UsersService } from './user-service';
import { JwtService } from '@nestjs/jwt';
import { BcryptService } from './bcrypt-service';
import { DeviceSessionsRepository } from '../infrastructure/auth/device-sessions.repository';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../infrastructure/users/repositories/users-repository';

describe('AuthService - Password Recovery', () => {
  let authService: AuthService;
  let usersRepository: {
    findByEmail: jest.Mock;
    findByRecoveryCode: jest.Mock;
    save: jest.Mock;
    findOrNotFoundFail: jest.Mock;
    findUserByLoginOrEmail: jest.Mock;
    findByConfirmationCode: jest.Mock;
    findById: jest.Mock;
    findByLogin: jest.Mock;
    findByIdOrThrowValidationError: jest.Mock;
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
            findByLogin: jest.fn(),
            findByIdOrThrowValidationError: jest.fn(),
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

  it('should send recovery email for existing confirmed user', async () => {
    const recoveryCode = 'generated-recovery-code';
    const mockUser = {
      id: '123',
      email: 'user@example.com',
      isEmailConfirmed: true,
      recoveryCode: null as string | null,
      recoveryExpiresAt: null as Date | null,
      recoveryIsUsed: null as boolean | null,
      requestPasswordRecovery: jest.fn().mockImplementation(function (this: typeof mockUser) {
        this.recoveryCode = recoveryCode;
        this.recoveryExpiresAt = new Date(Date.now() + 3600000);
        this.recoveryIsUsed = false;
      }),
    };

    usersRepository.findByEmail.mockResolvedValue(mockUser);
    usersRepository.save.mockResolvedValue(undefined);

    await authService.passwordRecovery('user@example.com');

    expect(usersRepository.findByEmail).toHaveBeenCalledWith('user@example.com');
    expect(mockUser.requestPasswordRecovery).toHaveBeenCalled();
    expect(usersRepository.save).toHaveBeenCalledWith(mockUser);
    expect(emailAdapter.sendConfirmationCodeEmail).toHaveBeenCalledWith(
      'user@example.com',
      recoveryCode,
    );
  });

  it('should not send email when user email is not confirmed', async () => {
    const mockUser = {
      id: '123',
      email: 'user@example.com',
      isEmailConfirmed: false,
      recoveryCode: null as string | null,
      requestPasswordRecovery: jest.fn().mockImplementation(function (this: typeof mockUser) {
        // isEmailConfirmed is false, so no code is set
      }),
    };

    usersRepository.findByEmail.mockResolvedValue(mockUser);

    const result = await authService.passwordRecovery('user@example.com');

    expect(result).toBeNull();
    expect(usersRepository.save).not.toHaveBeenCalled();
    expect(emailAdapter.sendConfirmationCodeEmail).not.toHaveBeenCalled();
  });

  it('should confirm new password', async () => {
    const mockDto = {
      newPassword: '12345678',
      recoveryCode: '3213dsfdrewfsert4',
    };

    const expiresAt = new Date(Date.now() + 60_000);
    const mockUser = {
      recoveryExpiresAt: expiresAt,
      recoveryCode: mockDto.recoveryCode,
      recoveryIsUsed: false,
      passwordHash: 'old',
    };

    usersRepository.findByRecoveryCode.mockResolvedValue(mockUser as any);
    usersRepository.save.mockResolvedValue(undefined);

    await authService.resetPassword(mockDto.newPassword, mockDto.recoveryCode);

    expect(usersRepository.findByRecoveryCode).toHaveBeenCalledWith(mockDto.recoveryCode);
    expect(usersRepository.save).toHaveBeenCalledWith(mockUser);
    expect(mockUser.passwordHash).toBe('new-hash');
  });
});
