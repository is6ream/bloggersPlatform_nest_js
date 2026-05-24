import { EmailAdapter } from './../../notifications/email-adapter';
import { Test } from '@nestjs/testing';
import { BcryptService } from './bcrypt-service';
import { UsersRepository } from '../infrastructure/users/repositories/users-repository';
import { PasswordRecoveryUseCase } from './useCases/password-recovery.command';
import { ResetPasswordUseCase } from './useCases/reset-password.command';

describe('Auth use cases - Password Recovery', () => {
  let passwordRecoveryUseCase: PasswordRecoveryUseCase;
  let resetPasswordUseCase: ResetPasswordUseCase;
  let usersRepository: {
    findByEmail: jest.Mock;
    findByRecoveryCode: jest.Mock;
    save: jest.Mock;
  };
  let emailAdapter: EmailAdapter;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PasswordRecoveryUseCase,
        ResetPasswordUseCase,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
            findByRecoveryCode: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: EmailAdapter,
          useValue: {
            sendConfirmationCodeEmail: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: BcryptService,
          useValue: {
            generateHash: jest.fn().mockResolvedValue('new-hash'),
          },
        },
      ],
    }).compile();

    passwordRecoveryUseCase = moduleRef.get(PasswordRecoveryUseCase);
    resetPasswordUseCase = moduleRef.get(ResetPasswordUseCase);
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

    await passwordRecoveryUseCase.execute({ email: 'user@example.com' } as any);

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

    await passwordRecoveryUseCase.execute({ email: 'user@example.com' } as any);

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

    await resetPasswordUseCase.execute({
      newPassword: mockDto.newPassword,
      recoveryCode: mockDto.recoveryCode,
    } as any);

    expect(usersRepository.findByRecoveryCode).toHaveBeenCalledWith(mockDto.recoveryCode);
    expect(usersRepository.save).toHaveBeenCalledWith(mockUser);
    expect(mockUser.passwordHash).toBe('new-hash');
  });
});
