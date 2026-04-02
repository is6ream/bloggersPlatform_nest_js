import { CreateUserDto } from 'src/modules/user-accounts/dto/UserInputDto';
import { Injectable, Logger } from '@nestjs/common';
import { BcryptService } from './bcrypt-service';
import { UsersRepository } from '../infrastructure/users/usersRepository';
import { JwtService } from '@nestjs/jwt';
import { UserContextDto } from '../guards/dto/user-context.input.dto';
import { UsersService } from './user-service';
import { UserSqlEntity } from '../domain/user-sql.entity';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { EmailAdapter } from 'src/modules/notifications/email-adapter';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';
import { UserContextOutput } from '../guards/dto/user-context.output.dto';
import dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { DeviceSessionsRepository } from '../infrastructure/auth/device-sessions.repository';
import { randomUUID } from 'crypto';

dotenv.config();
const ACCESS_TOKEN_TTL = '10s';
const REFRESH_TOKEN_TTL = '20d';

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
    const user: UserSqlEntity | null =
      await this.usersRepository.findUserByLoginOrEmail({
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
    return { id: user.id, loginOrEmail: loginOrEmail };
  }
  async registerUser(dto: CreateUserDto) {
    const existingUser = await this.usersRepository.findUserByLoginOrEmail({
      login: dto.login,
      email: dto.email,
    });

    if (existingUser?.login === dto.login || existingUser?.email === dto.email) {
      return;
    }

    const userId: string = await this.usersService.createUser(dto);
    const user: UserSqlEntity =
      await this.usersRepository.findOrNotFoundFail(userId);

    await this.emailAdapter
      .sendConfirmationCodeEmail(
        user.email,
        user.emailConfirmation.confirmationCode,
      )
      .catch((error) => {
        console.error(`Error sending email: ${error}`);
      });
  }
  async passwordRecovery(email: string) {
    const user: UserSqlEntity | null =
      await this.usersRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    user.requestPasswordRecovery();
    await this.usersRepository.save(user);

    try {
      await this.emailAdapter.sendConfirmationCodeEmail(
        email,
        user.passwordRecovery?.code!
      );
    } catch (e) {
      console.error('Error sending recovery email: ', e)
    }

  }

  async loginUser(
    user: UserContextDto,
    deviceMeta: { ip: string; userAgent: string },
  ) {
    const deviceId = randomUUID();

    const accessPayload = { id: user.id };
    const refreshPayload = { sub: user.id, deviceId, tokenId: randomUUID() };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: process.env.JWT_SECRET,
      expiresIn: ACCESS_TOKEN_TTL,
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: REFRESH_TOKEN_TTL,
    });

    const refreshTokenHash = await this.bcryptService.generateHash(
      refreshToken,
    );

    await this.deviceSessionsRepository.createSession({
      userId: user.id,
      deviceId,
      ip: deviceMeta.ip,
      userAgent: deviceMeta.userAgent,
      refreshTokenHash,
    });

    return { accessToken, refreshToken };
  }

  async resetPassword(
    newPassword: string,
    recoveryCode: string,
  ): Promise<void> {
    const user: UserSqlEntity | null =
      await this.usersRepository.findByRecoveryCode(recoveryCode);

    if (!user) {
      throw new DomainException({ code: 1, message: 'User not found' });
    }

    if (user.passwordRecovery?.expiresAt! < new Date(Date.now())) {
      throw new DomainException({
        code: 2,
        message: 'Recovery code expired',
      });
    }
    const newPasswordHash = await this.bcryptService.generateHash(newPassword);
    user.passwordHash = newPasswordHash;
    await this.usersRepository.save(user);
  }

  async confirmRegistration(code: string): Promise<void> {
    const user: UserSqlEntity | null =
      await this.usersRepository.findByConfirmationCode(code);
    if (!user) {
      throw new DomainException({
        code: 2,
        message: 'User not found',
        extensions: [{ message: 'User not found', field: 'code' }],
      });
    }
    if (user.emailConfirmation.confirmationCode !== code) {
      throw new DomainException({
        code: 2,
        message: 'Invalid confirmation code',
      });
    }
    if (user.emailConfirmation.expirationDate < new Date(Date.now())) {
      throw new DomainException({ code: 2, message: 'Code is expired' });
    }
    if (user.emailConfirmation.isConfirmed) {
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
    user.emailConfirmation.isConfirmed = true;
    await this.usersRepository.save(user);
  }

  async emailResending(email: string) {
    const user: UserSqlEntity | null =
      await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new DomainException({
        code: 2,
        message: 'User not found',
        extensions: [{ message: 'User not found', field: 'email' }],
      });
    }

    if (user.emailConfirmation.isConfirmed) {
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
    await this.emailAdapter.sendConfirmationCodeEmail(
      email,
      user.emailConfirmation.confirmationCode,
    );
  }

  async issueTokens(
    userId: string,
    deviceId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessPayload = { sub: userId, deviceId };
    const refreshPayload = { sub: userId, deviceId, tokenId: randomUUID() };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
        expiresIn: ACCESS_TOKEN_TTL,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: REFRESH_TOKEN_TTL,
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
