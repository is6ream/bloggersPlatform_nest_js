import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { UsersRepository } from '../../infrastructure/users/repositories/users-repository';

@Injectable()
export class ConfirmRegistrationCommand {
  constructor(public readonly code: string) {}
}

@CommandHandler(ConfirmRegistrationCommand)
export class ConfirmRegistrationUseCase
  implements ICommandHandler<ConfirmRegistrationCommand>
{
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(command: ConfirmRegistrationCommand): Promise<void> {
    const user = await this.usersRepository.findByConfirmationCode(command.code);
    if (!user) {
      throw new DomainException({
        code: 2,
        message: 'User not found',
        extensions: [{ message: 'User not found', field: 'code' }],
      });
    }
    if (user.confirmationCode !== command.code) {
      throw new DomainException({
        code: 2,
        message: 'Invalid confirmation code',
      });
    }
    if (user.confirmationExpiration < new Date(Date.now())) {
      throw new DomainException({ code: 2, message: 'Code is expired' });
    }
    if (user.isEmailConfirmed) {
      throw new DomainException({
        code: 2,
        message: 'User already confirmed',
        extensions: [
          {
            message: 'User already confirmed',
            field: 'code',
          },
        ],
      });
    }
    user.isEmailConfirmed = true;
    await this.usersRepository.save(user);
  }
}
