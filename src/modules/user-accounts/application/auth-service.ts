import { Injectable } from '@nestjs/common';
import { BcryptService } from './bcrypt-service';
import { JwtService } from '@nestjs/jwt';
import { UserContextOutput } from '../guards/dto/user-context.output.dto';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { UsersRepository } from '../infrastructure/users/repositories/users-repository';
import type { JwtSignOptions } from '@nestjs/jwt';

function accessTokenExpiresIn(): JwtSignOptions['expiresIn'] {
  return (process.env.JWT_ACCESS_EXPIRES_IN?.trim() || '10m') as JwtSignOptions['expiresIn'];
}

function refreshTokenExpiresIn(): JwtSignOptions['expiresIn'] {
  return (process.env.JWT_REFRESH_EXPIRES_IN?.trim() || '20m') as JwtSignOptions['expiresIn'];
}

function getRequiredStringConfig(
  configService: ConfigService,
  key: string,
): string {
  return configService.getOrThrow<string>(key);
}

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private bcryptService: BcryptService,
    private configService: ConfigService,
  ) {}

  async validateUser(
    loginOrEmail: string,
    password: string,
  ): Promise<UserContextOutput | null> {
    const user = await this.usersRepository.findUserByLoginOrEmail({
      login: loginOrEmail,
      email: loginOrEmail,
    });
    if (!user) {
      return null;
    }
    const isPasswordValid = await this.bcryptService.checkPassword({
      password,
      hash: user.passwordHash,
    });
    if (!isPasswordValid) {
      return null;
    }
    return { id: user.id, loginOrEmail };
  }

  async issueTokens(
    userId: string,
    deviceId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessPayload = { sub: userId, deviceId };
    const refreshPayload = { sub: userId, deviceId, tokenId: randomUUID() };
    const jwtSecret = getRequiredStringConfig(this.configService, 'JWT_SECRET');
    const jwtRefreshSecret = getRequiredStringConfig(
      this.configService,
      'JWT_REFRESH_SECRET',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: jwtSecret,
        expiresIn: accessTokenExpiresIn(),
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: jwtRefreshSecret,
        expiresIn: refreshTokenExpiresIn(),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
