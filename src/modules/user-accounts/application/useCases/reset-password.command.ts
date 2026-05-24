import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { BcryptService } from '../bcrypt-service';
import { UsersRepository } from '../../infrastructure/users/repositories/users-repository';

@Injectable()
export class ResetPasswordCommand {
  constructor(
    public readonly newPassword: string,
    public readonly recoveryCode: string,
  ) {}
}

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordUseCase implements ICommandHandler<ResetPasswordCommand> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<void> {
    const user = await this.usersRepository.findByRecoveryCode(command.recoveryCode);

    if (!user) {
      throw new DomainException({ code: 1, message: 'User not found' });
    }

    if (user.recoveryExpiresAt! < new Date(Date.now())) {
      throw new DomainException({
        code: 2,
        message: 'Recovery code expired',
      });
    }

    user.passwordHash = await this.bcryptService.generateHash(command.newPassword);
    await this.usersRepository.save(user);
  }
}
