import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UsersRepository } from '../infrastructure/users/usersRepository';
import { User } from '../domain/userEntity';
import { UserModelType } from '../domain/userEntity';
import { UserDocument } from '../domain/userEntity';
import { CreateUserDto, UpdateUserDto } from '../dto/UserInputDto';
import { BcryptService } from './bcrypt-service';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';
import { EmailService } from 'src/modules/notifications/email-service';
import { JwtService } from '@nestjs/jwt';
import { UserContextDto } from '../guards/dto/user-context.dto';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
    private usersRepository: UsersRepository,
    private bcryptService: BcryptService,
    private emailService: EmailService,
    private jwtService: JwtService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<string> {
    const userWithSameLogin = await this.usersRepository.findByLogin(dto.login);

    if (userWithSameLogin) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'user with such login already exists',
      });
    }

    const passwordHash = await this.bcryptService.generateHash(dto.password);

    const user: UserDocument = this.UserModel.createInstance({
      email: dto.email,
      login: dto.login,
      password: passwordHash,
    });

    await this.usersRepository.save(user);

    return user._id.toString();
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<string> {
    const user = await this.usersRepository.findOrNotFoundFail(id);

    user.update(dto);

    await this.usersRepository.save(user);

    return user._id.toString();
  }

  async deleteUser(id: string) {
    const user = await this.usersRepository.findOrNotFoundFail(id);

    user.makeDeleted();

    await this.usersRepository.save(user);
  }

  async registerUser(dto: CreateUserDto) {
    const createdUserId = await this.createUser(dto);

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
    const accessToken = await this.jwtService.signAsync({
      id: userId,
    } as UserContextDto);

    return {
      accessToken,
    };
  }
}
