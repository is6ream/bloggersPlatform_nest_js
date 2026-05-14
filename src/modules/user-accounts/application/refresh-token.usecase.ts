import { AuthService } from 'src/modules/user-accounts/application/auth-service';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
    public iat: number,
  ) {}
}

@CommandHandler(RefreshTokensCommand)
export class RefreshTokensUseCase implements ICommandHandler<RefreshTokensCommand> {
  private readonly logger = new Logger(RefreshTokensUseCase.name);

  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly deviceSessionsRepository: DeviceSessionsRepository,
  ) {}

  async execute({ userId, deviceId, iat }: RefreshTokensCommand) {
    this.logger.log(
      `[/refresh-token] Validating refresh token — userId=${userId}, deviceId=${deviceId}`,
    );

    const session = await this.deviceSessionsRepository.findByUserDeviceAndIat(
      userId,
      deviceId,
      iat,
    );

    if (!session) {
      this.logger.warn(
        `[/refresh-token] Session not found or iat mismatch — userId=${userId}, deviceId=${deviceId}`,
      );
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Refresh token already used or session invalid',
      });
    }

    const tokens = await this.authService.issueTokens(userId, deviceId);

    const decoded = this.jwtService.decode(tokens.refreshToken) as { iat: number };
    const newIat = new Date(decoded.iat * 1000);

    const updated = await this.deviceSessionsRepository.updateSessionIatIfMatch({
      userId,
      deviceId,
      currentIat: session.iat,
      newIat,
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
