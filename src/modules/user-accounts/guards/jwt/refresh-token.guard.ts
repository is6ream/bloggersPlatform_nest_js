import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsedRefreshTokenStore } from '../../application/used-refresh-token.store';
import { DeviceSessionsRepository } from '../../infrastructure/auth/device-sessions.repository';
import {
  getClientIpFromRequest,
  normalizeClientIp,
} from 'src/core/utils/client-ip';

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
    const request = context.switchToHttp().getRequest();

    // --- ДИАГНОСТИКА: что пришло в запросе ---
    const rawCookies = request.headers?.cookie ?? '(no cookie header)';
    const cookieToken = request.cookies?.['refreshToken'];
    const authHeader = request.headers?.authorization ?? '(no authorization header)';
    this.logger.log(
      `[${request.url}] DIAG incoming cookies: ${rawCookies}`,
    );
    this.logger.log(
      `[${request.url}] DIAG parsed refreshToken cookie: ${cookieToken ? cookieToken.slice(0, 40) + '...' : '(absent)'}`,
    );
    this.logger.log(
      `[${request.url}] DIAG authorization header: ${authHeader}`,
    );

    const parentResult = await super.canActivate(context);
    if (!parentResult) return false;

    const user = request.user as { sub?: string; deviceId?: string; refreshToken?: string } | undefined;
    if (!user?.sub || !user?.deviceId) return true;

    const session = await this.deviceSessionsRepository.findByUserAndDevice(
      user.sub,
      user.deviceId,
    );
    if (!session) {
      this.logger.warn(
        `[${request.url}] DIAG 401 reason: device session NOT FOUND in DB — userId=${user.sub}, deviceId=${user.deviceId}`,
      );
      throw new UnauthorizedException();
    }

    this.logger.log(
      `[${request.url}] DIAG session found in DB — userId=${user.sub}, deviceId=${user.deviceId}, sessionIp=${session.ip}`,
    );

    const requestIp = getClientIpFromRequest(request);
    const sessionIp = session.ip ? normalizeClientIp(session.ip) : null;

    if (sessionIp && requestIp !== sessionIp) {
      this.logger.warn(
        `[${request.url}] DIAG IP mismatch (not blocking): token ip=${sessionIp}, request ip=${requestIp}`,
      );
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
        `[${path}] DIAG 401 reason: JWT validation FAILED — err=${err?.message ?? 'none'}, user=${user ? 'exists' : 'null/undefined'}. Likely causes: cookie absent, token invalid, or token expired.`,
      );
      throw new UnauthorizedException();
    }

    const payload = user as { sub?: string; deviceId?: string; refreshToken?: string };
    if (payload.refreshToken && this.usedRefreshTokenStore.isUsed(payload.refreshToken)) {
      this.logger.warn(
        `[${path}] DIAG 401 reason: refresh token ALREADY USED (replay attack protection) — userId=${payload.sub}, deviceId=${payload.deviceId}`,
      );
      throw new UnauthorizedException();
    }

    this.logger.log(
      `[${path}] Refresh token JWT valid — userId=${payload.sub}, deviceId=${payload.deviceId}`,
    );
    return user;
  }
}
