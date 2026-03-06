import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';
import { DeviceSessionsQueryRepository } from '../infrastructure/auth/device-sessions.query-repository';
import { DeviceSessionsRepository } from '../infrastructure/auth/device-sessions.repository';

export class DeleteDeviceSessionCommand {
  constructor(
    public readonly userId: string,
    public readonly deviceId: string,
  ) {}
}

@CommandHandler(DeleteDeviceSessionCommand)
export class DeleteDeviceSessionUseCase
  implements ICommandHandler<DeleteDeviceSessionCommand>
{
  constructor(
    private readonly deviceSessionsQueryRepository: DeviceSessionsQueryRepository,
    private readonly deviceSessionsRepository: DeviceSessionsRepository,
  ) {}

  async execute({ userId, deviceId }: DeleteDeviceSessionCommand): Promise<void> {
    const session = await this.deviceSessionsQueryRepository.findByDeviceId(deviceId);

    if (!session) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Device session not found',
      });
    }

    if (session.userId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Forbidden',
      });
    }

    await this.deviceSessionsRepository.deleteSession(userId, deviceId);
  }
}
