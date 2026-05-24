import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeviceSessionsRepository } from '../../infrastructure/auth/device-sessions.repository';

@Injectable()
export class LogoutCommand {
  constructor(
    public readonly userId: string,
    public readonly deviceId: string,
  ) {}
}

@CommandHandler(LogoutCommand)
export class LogoutUseCase implements ICommandHandler<LogoutCommand> {
  private readonly logger = new Logger(LogoutUseCase.name);

  constructor(
    private readonly deviceSessionsRepository: DeviceSessionsRepository,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    this.logger.log(
      `[/logout] Invalidating session — userId=${command.userId}, deviceId=${command.deviceId}`,
    );
    await this.deviceSessionsRepository.deleteSession(
      command.userId,
      command.deviceId,
    );
  }
}
