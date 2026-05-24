import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { EmailAdapter } from 'src/modules/notifications/email-adapter';
import { UsersRepository } from '../../infrastructure/users/repositories/users-repository';

@Injectable()
export class EmailResendingCommand {
  constructor(public readonly email: string) {}
}

@CommandHandler(EmailResendingCommand)
export class EmailResendingUseCase implements ICommandHandler<EmailResendingCommand> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailAdapter: EmailAdapter,
  ) {}

  async execute(command: EmailResendingCommand): Promise<void> {
    const user = await this.usersRepository.findByEmail(command.email);
    if (!user) {
      throw new DomainException({
        code: 2,
        message: 'User not found',
        extensions: [{ message: 'User not found', field: 'email' }],
      });
    }

    if (user.isEmailConfirmed) {
      throw new DomainException({
        code: 2,
        message: 'Email already confirmed',
        extensions: [
          {
            message: 'Email already confirmed',
            field: 'email',
          },
        ],
      });
    }
    user.requestNewConfirmationCode();
    await this.usersRepository.save(user);
    this.emailAdapter.sendConfirmationCodeEmail(
      command.email,
      user.confirmationCode,
    );
  }
}
