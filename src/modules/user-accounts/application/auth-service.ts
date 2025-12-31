import { CreateUserDto } from 'src/modules/user-accounts/dto/UserInputDto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { BcryptService } from './bcrypt-service';
import { UsersRepository } from '../infrastructure/users/usersRepository';
import { JwtService } from '@nestjs/jwt';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { EmailService } from 'src/modules/notifications/email-service';
import { UsersService } from './user-service';
@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private usersService: UsersService,
    private jwtService: JwtService,
    private bcryptService: BcryptService,
    private emailService: EmailService,
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

    console.log(user.email, 'email check');

    await this.emailService
      .sendConfirmationEmail(
        user.email,
        user.emailConfirmation.confirmationCode,
      )
      .catch(console.error);
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
}
