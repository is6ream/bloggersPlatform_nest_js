import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { UsersRepository } from '../infrastructure/usersRepository';
import { User } from '../domain/userEntity';
import { UserModelType } from '../domain/userEntity';
import { CreateUserDto } from '../dto/createUserInputDto';
import { UserDocument } from '../domain/userEntity';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
    private usersRepository: UsersRepository,
  ) {}

  async createUser(dto: CreateUserDto): Promise<string> {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.passwordHash, saltRounds);

    const user: UserDocument = this.UserModel.createInstance({
      email: dto.email,
      login: dto.login,
      passwordHash: passwordHash,
    });

    await this.usersRepository.save(user);

    return user._id.toString();
  }
}
