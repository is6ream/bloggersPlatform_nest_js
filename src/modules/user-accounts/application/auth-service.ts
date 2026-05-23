import { CreateUserDto } from 'src/modules/user-accounts/dto/UserInputDto';
import { Injectable, Logger } from '@nestjs/common';
import { BcryptService } from './bcrypt-service';
import { JwtService } from '@nestjs/jwt';
import { UserContextDto } from '../guards/dto/user-context.input.dto';
import { UsersService } from './user-service';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { EmailAdapter } from 'src/modules/notifications/email-adapter';
import { UserContextOutput } from '../guards/dto/user-context.output.dto';
import { ConfigService } from '@nestjs/config';
import { DeviceSessionsRepository } from '../infrastructure/auth/device-sessions.repository';
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersRepository: UsersRepository,
    private usersService: UsersService,
    private jwtService: JwtService,
    private bcryptService: BcryptService,
    private emailAdapter: EmailAdapter,
    private configService: ConfigService,
    private deviceSessionsRepository: DeviceSessionsRepository,
  ) { }

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

  async registerUser(dto: CreateUserDto) {
    const userId: string = await this.usersService.createUser(dto);
    const user = await this.usersRepository.findOrNotFoundFail(userId);

    this.emailAdapter
      .sendConfirmationCodeEmail(user.email, user.confirmationCode)
      .catch((error) => {
        console.error(`Error sending email: ${error}`);
      });
  }

  async passwordRecovery(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    user.requestPasswordRecovery();
    if (!user.recoveryCode) {
      return null;
    }

    await this.usersRepository.save(user);

    try {
      await this.emailAdapter.sendConfirmationCodeEmail(email, user.recoveryCode);
    } catch (e) {
      this.logger.error('Error sending recovery email', e);
    }
  }

  async loginUser(
    user: UserContextDto,
    deviceMeta: { ip: string; userAgent: string },
  ) {
    const deviceId = randomUUID();

    const accessPayload = { sub: user.id, deviceId };
    const refreshPayload = { sub: user.id, deviceId, tokenId: randomUUID() };
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

    const decoded = this.jwtService.decode(refreshToken) as { iat: number };
    const iat = new Date(decoded.iat * 1000);

    await this.deviceSessionsRepository.createSession({
      userId: user.id,
      deviceId,
      ip: deviceMeta.ip,
      userAgent: deviceMeta.userAgent,
      iat, 
    });

    return { accessToken, refreshToken };
  }

  async resetPassword(
    newPassword: string,
    recoveryCode: string,
  ): Promise<void> {
    const user = await this.usersRepository.findByRecoveryCode(recoveryCode);

    if (!user) {
      throw new DomainException({ code: 1, message: 'User not found' });
    }

    if (user.recoveryExpiresAt! < new Date(Date.now())) {
      throw new DomainException({
        code: 2,
        message: 'Recovery code expired',
      });
    }

    user.passwordHash = await this.bcryptService.generateHash(newPassword);
    await this.usersRepository.save(user);
  }

  async confirmRegistration(code: string): Promise<void> {
    const user = await this.usersRepository.findByConfirmationCode(code);
    if (!user) {
      throw new DomainException({
        code: 2,
        message: 'User not found',
        extensions: [{ message: 'User not found', field: 'code' }],
      });
    }
    if (user.confirmationCode !== code) {
      throw new DomainException({
        code: 2,
        message: 'Invalid confirmation code',
      });
    }
    if (user.confirmationExpiration < new Date(Date.now())) {
      throw new DomainException({ code: 2, message: 'Code is expired' });
    }
    if (user.isEmailConfirmed) {
      throw new DomainException({
        code: 2,
        message: 'User already confirmed',
        extensions: [
          {
            message: 'User already confirmed',
            field: 'code',
          },
        ],
      });
    }
    user.isEmailConfirmed = true;
    await this.usersRepository.save(user);
  }

  async emailResending(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new DomainException({
        code: 2,
        message: 'User not found',
        extensions: [{ message: 'User not found', field: 'email' }],
      });
    }

    if (user.isEmailConfirmed) {
      throw new DomainException({
        code: 2,
        message: 'Email already confirmed',
        extensions: [
          {
            message: 'Email already confirmed',
            field: 'email',
          },
        ],
      });
    }
    user.requestNewConfirmationCode();
    await this.usersRepository.save(user);
    this.emailAdapter.sendConfirmationCodeEmail(
      email,
      user.confirmationCode,
    );
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

  async logout(userId: string, deviceId: string): Promise<void> {
    this.logger.log(
      `[/logout] Invalidating session — userId=${userId}, deviceId=${deviceId}`,
    );
    await this.deviceSessionsRepository.deleteSession(userId, deviceId);
  }

}
