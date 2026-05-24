import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailAdapter } from 'src/modules/notifications/email-adapter';
import { CreateUserInputDto } from '../../api/dto/input/create-user.input.dto';
import { UsersRepository } from '../../infrastructure/users/repositories/users-repository';
import { UsersService } from '../user-service';

@Injectable()
export class RegistrationUserCommand {
  constructor(public readonly body: CreateUserInputDto) {}
}

@CommandHandler(RegistrationUserCommand)
export class RegisterUserUseCase implements ICommandHandler<RegistrationUserCommand> {
  private readonly logger = new Logger(RegisterUserUseCase.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
    private readonly emailAdapter: EmailAdapter,
  ) {}

  async execute(command: RegistrationUserCommand): Promise<void> {
    const userId = await this.usersService.createUser(command.body);
    const user = await this.usersRepository.findOrNotFoundFail(userId);

    this.emailAdapter
      .sendConfirmationCodeEmail(user.email, user.confirmationCode)
      .catch((error) => {
        this.logger.error('Error sending confirmation email', error);
      });
  }
}
