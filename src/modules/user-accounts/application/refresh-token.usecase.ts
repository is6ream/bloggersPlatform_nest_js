import { AuthService } from 'src/modules/user-accounts/application/auth-service';
import { UsersRepository } from 'src/modules/user-accounts/infrastructure/users/usersRepository';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { DeviceSessionsRepository } from '../infrastructure/auth/device-sessions.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';

@Injectable()
export class RefreshTokensCommand {
  constructor(
    public userId: string,
    public deviceId: string,
    public refreshToken: string,
  ) {}
}

@CommandHandler(RefreshTokensCommand)
export class RefreshTokensUseCase implements ICommandHandler<RefreshTokensCommand> {
  constructor(
    private readonly authService: AuthService,
    private readonly usersRepository: UsersRepository,
    private readonly deviceSessionsRepository: DeviceSessionsRepository,
  ) {}

  async execute({ userId, deviceId, refreshToken }: RefreshTokensCommand) {

    console.log("command bus works")


    console.log('refreshToken: ', refreshToken);

    const session = await this.deviceSessionsRepository.findByUserAndDevice(
      userId,
      deviceId,
    );

    if (!session?.refreshTokenHash) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Refresh token hash does not match',
      });
    }

    const isValid = await bcrypt.compare(
      refreshToken,
      session.refreshTokenHash,
    );
    if (!isValid) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Refresh token hash does not match',
      });
    }

    const tokens = await this.authService.issueTokens(userId, deviceId);

    const newRefreshHash = await bcrypt.hash(tokens.refreshToken, 10);

    await this.deviceSessionsRepository.updateSessionToken({
      userId,
      deviceId,
      refreshTokenHash: newRefreshHash,
    });

    return tokens;
  }
}
