import { EmailAdapter } from './../../notifications/email-adapter';
import { AuthService } from './auth-service';
import { UsersRawSqlRepository } from '../infrastructure/users/repositories/users-raw-sql.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserOrmEntity } from '../infrastructure/users/entities/user.orm-entity';
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
  let userOrmRepository: { findOne: jest.Mock; update: jest.Mock };
  let emailAdapter: EmailAdapter;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRawSqlRepository,
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
          provide: getRepositoryToken(UserOrmEntity),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn().mockResolvedValue(undefined),
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
    usersRepository = moduleRef.get(
      UsersRawSqlRepository,
    ) as typeof usersRepository;
    userOrmRepository = moduleRef.get(getRepositoryToken(UserOrmEntity));
    emailAdapter = moduleRef.get(EmailAdapter);
  });

  it('should send recovery email for existing user', async () => {
    const mockOrmRow = {
      id: '123',
      login: 'user',
      email: 'user@example.com',
      passwordHash: 'hash',
      confirmationCode: 'abc-123-def',
      confirmationExpiration: new Date(),
      isEmailConfirmed: true,
      recoveryCode: null,
      recoveryExpiresAt: null,
      recoveryIsUsed: null,
      createdAt: new Date(),
      deleteAt: null,
      refreshTokenHash: null,
    };

    userOrmRepository.findOne.mockResolvedValue(mockOrmRow);

    await authService.passwordRecovery('user@example.com');

    expect(userOrmRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });
    expect(userOrmRepository.update).toHaveBeenCalledWith(
      '123',
      expect.objectContaining({
        recoveryIsUsed: false,
        recoveryCode: expect.any(String),
        recoveryExpiresAt: expect.any(Date),
      }),
    );
    expect(emailAdapter.sendConfirmationCodeEmail).toHaveBeenCalledWith(
      mockOrmRow.email,
      expect.any(String),
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
