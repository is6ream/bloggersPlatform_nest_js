import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeviceSessionsRepository } from '../infrastructure/auth/device-sessions.repository';

export class DeleteAllOtherSessionsCommand {
  constructor(
    public readonly userId: string,
    public readonly deviceId: string,
  ) {}
}

@CommandHandler(DeleteAllOtherSessionsCommand)
export class DeleteAllOtherSessionsUseCase
  implements ICommandHandler<DeleteAllOtherSessionsCommand>
{
  constructor(
    private readonly deviceSessionsRepository: DeviceSessionsRepository,
  ) {}

  async execute({ userId, deviceId }: DeleteAllOtherSessionsCommand): Promise<void> {
    await this.deviceSessionsRepository.deleteAllSessionsExceptCurrent(userId, deviceId);
  }
}
