import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailAdapter } from 'src/modules/notifications/email-adapter';
import { UsersRepository } from '../../infrastructure/users/repositories/users-repository';

@Injectable()
export class PasswordRecoveryCommand {
  constructor(public readonly email: string) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase
  implements ICommandHandler<PasswordRecoveryCommand>
{
  private readonly logger = new Logger(PasswordRecoveryUseCase.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailAdapter: EmailAdapter,
  ) {}

  async execute(command: PasswordRecoveryCommand): Promise<void> {
    const user = await this.usersRepository.findByEmail(command.email);
    if (!user) {
      return;
    }

    user.requestPasswordRecovery();
    if (!user.recoveryCode) {
      return;
    }

    await this.usersRepository.save(user);

    try {
      await this.emailAdapter.sendConfirmationCodeEmail(
        command.email,
        user.recoveryCode,
      );
    } catch (e) {
      this.logger.error('Error sending recovery email', e);
    }
  }
}