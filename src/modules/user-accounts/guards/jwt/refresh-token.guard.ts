import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsedRefreshTokenStore } from '../../application/used-refresh-token.store';
import { DeviceSessionsRepository } from '../../infrastructure/auth/device-sessions.repository';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
  private readonly logger = new Logger(RefreshTokenGuard.name);

  constructor(
    private readonly usedRefreshTokenStore: UsedRefreshTokenStore,
    private readonly deviceSessionsRepository: DeviceSessionsRepository,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const parentResult = await super.canActivate(context);
    if (!parentResult) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { sub?: string; deviceId?: string; refreshToken?: string } | undefined;
    if (!user?.sub || !user?.deviceId) return true;

    const session = await this.deviceSessionsRepository.findByUserAndDevice(
      user.sub,
      user.deviceId,
    );
    if (!session) {
      this.logger.warn(
        `[${request.url}] Refresh token: device session not found (e.g. deleted)`,
      );
      throw new UnauthorizedException();
    }
    return true;
  }

  handleRequest<TUser = any>(
    err: any,
    user: TUser | false,
    _info: any,
    context: ExecutionContext,
  ): TUser {
    const path = context.switchToHttp().getRequest()?.url ?? 'unknown';

    if (err || !user) {
      this.logger.warn(
        `[${path}] Refresh token invalid or missing: ${err?.message ?? (user ? 'no error' : 'no user')}`,
      );
      throw new UnauthorizedException();
    }

    const payload = user as { sub?: string; deviceId?: string; refreshToken?: string };
    if (payload.refreshToken && this.usedRefreshTokenStore.isUsed(payload.refreshToken)) {
      this.logger.warn(`[${path}] Refresh token already used (replay)`);
      throw new UnauthorizedException();
    }

    this.logger.log(
      `[${path}] Refresh token JWT valid — userId=${payload.sub}, deviceId=${payload.deviceId}`,
    );
    return user;
  }
}
