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
import { PasswordRecoveryInputDto } from '../api/dto/password-recovery-input.dto';
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
    const user = await this.usersRepository.findByLoginOrEmail(loginOrEmail);
    if (!user) {
      throw new UnauthorizedException('invalid password or email');
    }
    const isPasswordValid = await this.bcryptService.checkPassword({
      password,
      hash: user.passwordHash,
    });

    if (!isPasswordValid) {
      throw new UnauthorizedException('invalid password or email');
    }
    return { id: user._id.toString() };
  }

  async registerUser(dto: CreateUserDto) {
    const createdUserId = await this.usersService.createUser(dto);

    const user = await this.usersRepository.findOrNotFoundFail(createdUserId);

    await this.usersRepository.save(user);
    await this.emailAdapter
      .sendConfirmationCodeEmail(
        user.email,
        user.emailConfirmation.confirmationCode,
      )
      .catch(console.error);
  }
  async passwordRecovery(email: string) {
    const user: UserDocument | null =
      await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new DomainException({ code: 1, message: 'User not found' });
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
    return {
      accessToken,
    };
  }

  async confirmNewPassword(
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
}
