import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { UserContextDto } from '../../guards/dto/user-context.input.dto';
import { AuthService } from '../auth-service';
import { DeviceSessionsRepository } from '../../infrastructure/auth/device-sessions.repository';

@Injectable()
export class LoginCommand {
  constructor(
    public readonly user: UserContextDto,
    public readonly deviceMeta: { ip: string; userAgent: string },
  ) {}
}

@CommandHandler(LoginCommand)
export class LoginUseCase implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly deviceSessionsRepository: DeviceSessionsRepository,
  ) {}

  async execute(command: LoginCommand): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const deviceId = randomUUID();

    const { accessToken, refreshToken } = await this.authService.issueTokens(
      command.user.id,
      deviceId,
    );

    const decoded = this.jwtService.decode(refreshToken) as { iat: number };
    const iat = new Date(decoded.iat * 1000);

    await this.deviceSessionsRepository.createSession({
      userId: command.user.id,
      deviceId,
      ip: command.deviceMeta.ip,
      userAgent: command.deviceMeta.userAgent,
      iat,
    });

    return { accessToken, refreshToken };
  }
}
