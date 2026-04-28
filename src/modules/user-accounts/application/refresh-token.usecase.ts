import { AuthService } from 'src/modules/user-accounts/application/auth-service';
import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(RefreshTokensUseCase.name);

  constructor(
    private readonly authService: AuthService,
    private readonly deviceSessionsRepository: DeviceSessionsRepository,
  ) {}

  async execute({ userId, deviceId, refreshToken }: RefreshTokensCommand) {
    this.logger.log(
      `[/refresh-token] Validating refresh token — userId=${userId}, deviceId=${deviceId}`,
    );


    const session = await this.deviceSessionsRepository.findByUserAndDevice(
      userId,
      deviceId,
    );

    if (!session?.refreshTokenHash) {
      this.logger.warn(
        `[/refresh-token] Session not found or no refreshTokenHash — userId=${userId}, deviceId=${deviceId}`,
      );
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
      this.logger.warn(
        `[/refresh-token] Refresh token hash mismatch — userId=${userId}, deviceId=${deviceId}`,
      );
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Refresh token hash does not match',
      });
    }

    const tokens = await this.authService.issueTokens(userId, deviceId);
    const newRefreshHash = await bcrypt.hash(tokens.refreshToken, 10);

    const updated = await this.deviceSessionsRepository.updateSessionTokenIfMatch({
      userId,
      deviceId,
      currentRefreshTokenHash: session.refreshTokenHash,
      newRefreshTokenHash: newRefreshHash,
    });

    if (!updated) {
      this.logger.warn(
        `[/refresh-token] Token already used or session invalid (concurrent?) — userId=${userId}, deviceId=${deviceId}`,
      );
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Refresh token already used or session invalid',
      });
    }

    this.logger.log(
      `[/refresh-token] Refresh token valid, tokens issued — userId=${userId}, deviceId=${deviceId}`,
    );
    return tokens;
  }
}
