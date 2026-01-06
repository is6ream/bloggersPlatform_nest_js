import { CreateUserDto } from 'src/modules/user-accounts/dto/UserInputDto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { BcryptService } from './bcrypt-service';
import { UsersRepository } from '../infrastructure/users/usersRepository';
import { JwtService } from '@nestjs/jwt';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { UsersService } from './user-service';
import { UserDocument } from '../domain/userEntity';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { EmailAdapter } from 'src/modules/notifications/email-adapter';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';
@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private usersService: UsersService,
    private jwtService: JwtService,
    private bcryptService: BcryptService,
    private emailAdapter: EmailAdapter,
  ) {}

  async validateUser(
    loginOrEmail: string,
    password: string,
  ): Promise<UserContextDto | null> {
    const user: UserDocument | null =
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
    return { id: user._id.toString() };
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

    const createdUserId = await this.usersService.createUser(dto);
    const user = await this.usersRepository.findOrNotFoundFail(createdUserId);
    await this.usersRepository.save(user);
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
    await this.emailAdapter.sendRecoveryCodeEmail(
      email,
      user.emailConfirmation.confirmationCode,
    );
  }

  async loginUser(userId: string) {
    const accessToken = await this.jwtService.signAsync(
      {
        id: userId,
      } as UserContextDto,
      { secret: process.env.JWT_SECRET },
    );
    console.log(accessToken, 'accessToken check');
    return {
      accessToken,
    };
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

    if (user.emailConfirmation.expirationDate < new Date(Date.now())) {
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
    console.log(code, 'code check');
    const user: UserDocument | null =
      await this.usersRepository.findByRecoveryCode(code);
    if (!user) {
      throw new DomainException({ code: 1, message: 'User not found' });
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
      throw new DomainException({ code: 2, message: 'User already confirmed' });
    }
    user.emailConfirmation.isConfirmed = true;
    await this.usersRepository.save(user);
  }

  async emailResending(email: string) {
    const user: UserDocument | null =
      await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new DomainException({ code: 1, message: 'User not found' });
    }
    await this.emailAdapter.sendConfirmationCodeEmail(
      email,
      user.emailConfirmation.confirmationCode,
    );
  }
}
