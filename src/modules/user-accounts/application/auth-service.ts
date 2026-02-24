import { CreateUserDto } from 'src/modules/user-accounts/dto/UserInputDto';
import { Injectable } from '@nestjs/common';
import { BcryptService } from './bcrypt-service';
import { UsersRepository } from '../infrastructure/users/usersRepository';
import { JwtService } from '@nestjs/jwt';
import { UserContextDto } from '../guards/dto/user-context.input.dto';
import { UsersService } from './user-service';
import { UserDocument } from '../domain/userEntity';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { EmailAdapter } from 'src/modules/notifications/email-adapter';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';
import { UserContextOutput } from '../guards/dto/user-context.output.dto';
import dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';

dotenv.config();
@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private usersService: UsersService,
    private jwtService: JwtService,
    private bcryptService: BcryptService,
    private emailAdapter: EmailAdapter,
    private configService: ConfigService,
  ) {}

  async validateUser(
    loginOrEmail: string,
    password: string,
  ): Promise<UserContextOutput | null> {
    const user: UserDocument | null =
      await this.usersRepository.findUserByLoginOrEmail({
        login: loginOrEmail,
        email: loginOrEmail,
      });
    console.log('user check: ', user);
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
    return { id: user._id.toString(), loginOrEmail: loginOrEmail };
  }
  async registerUser(dto: CreateUserDto) {
    const existingUser = await this.usersRepository.findUserByLoginOrEmail({
      login: dto.login,
      email: dto.email,
    });

    if (existingUser?.login === dto.login) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User with such login already exists',
        extensions: [
          {
            message: 'User with such login already exists',
            field: 'login',
          },
        ],
      });
    }

    if (existingUser?.email === dto.email) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User with such email already exists',
        extensions: [
          {
            message: 'User with such email already exists',
            field: 'email',
          },
        ],
      });
    }

    const userId: string = await this.usersService.createUser(dto);
    const user: UserDocument =
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
    const user: UserDocument | null =
      await this.usersRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    user.requestPasswordRecovery();
    await this.usersRepository.save(user);

    await this.emailAdapter.sendRecoveryCodeEmail(
      email,
      user.passwordRecovery?.code!,
    );
  }

  async loginUser(user: UserContextDto) {
    const payload = {
      id: user.id,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '10s',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '20s',
    });
    await this.usersRepository.updateRefreshTokenHash(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async resetPassword(
    newPassword: string,
    recoveryCode: string,
  ): Promise<void> {
    const user: UserDocument | null =
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
    const user: UserDocument | null =
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
    const user: UserDocument | null =
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
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
        expiresIn: '10s',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: '20s',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
