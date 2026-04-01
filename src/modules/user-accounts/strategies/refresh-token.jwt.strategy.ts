import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private static extractRefreshToken(request: Request): string | null {
    const cookieToken = request?.cookies?.['refreshToken'];
    if (cookieToken) {
      return cookieToken;
    }

    const authHeader = request?.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }

    const bodyToken =
      typeof (request as any)?.body?.refreshToken === 'string'
        ? (request as any).body.refreshToken
        : null;

    return bodyToken || null;
  }

  constructor(
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => RefreshJwtStrategy.extractRefreshToken(request),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string; deviceId: string }) {
    const refreshToken = RefreshJwtStrategy.extractRefreshToken(req);
    return { sub: payload.sub, deviceId: payload.deviceId, refreshToken };
  }
}
