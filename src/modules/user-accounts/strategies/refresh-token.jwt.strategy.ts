// strategies/refresh-jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersQueryRepository } from '../infrastructure/users/usersQueryRepository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private usersQueryRepository: UsersQueryRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secret: configService.get('JWT_REFRESH_SECRET'),
    });
  }

  async validate(payload: { sub: string }, rawToken: string) {
    const user = await this.usersQueryRepository.findById(payload.sub);
    if (!user) throw new UnauthorizedException();

    const isValid = await bcrypt.compare(rawToken, user.refreshTokenHash);
    if (!isValid) throw new UnauthorizedException();

    return { sub: payload.sub, refreshToken: rawToken };
  }
}
