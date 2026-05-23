import { Injectable } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UsersRepository } from "../../infrastructure/users/repositories/users-repository";
import { EmailAdapter } from "src/modules/notifications/email-adapter";
import { Logger } from "@nestjs/common";
import { AuthService } from "../auth-service";
@Injectable()
export class PasswordRecoveryCommand {
    constructor(
        public email: string,
    ) { }
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase implements ICommandHandler<PasswordRecoveryCommand> {
    constructor(
        private usersRepository: UsersRepository,
        private emailAdapter: EmailAdapter,
        private readonly logger = new Logger(AuthService.name)

    ) { }

    async execute(command: PasswordRecoveryCommand): Promise<any> {
        const user = await this.usersRepository.findByEmail(command.email);
        if (!user) {
            return null;
        }

        user.requestPasswordRecovery();
        if (!user.recoveryCode) {
            return null;
        }

        await this.usersRepository.save(user);

        try {
            await this.emailAdapter.sendConfirmationCodeEmail(command.email, user.recoveryCode);
        } catch (e) {
            this.logger.error('Error sending recovery email', e);
        }
    }
}