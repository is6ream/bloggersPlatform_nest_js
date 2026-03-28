import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users/usersRepository';
import { CreateUserDto, UpdateUserDto } from '../dto/UserInputDto';
import { BcryptService } from './bcrypt-service';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';
import { UserSqlEntity } from '../domain/user-sql.entity';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private bcryptService: BcryptService,
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

    const user = UserSqlEntity.createForInsert({
      email: dto.email,
      login: dto.login,
      password: passwordHash,
    });

    await this.usersRepository.save(user);

    return user.id;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<string> {
    const user = await this.usersRepository.findOrNotFoundFail(id);

    user.update(dto);

    await this.usersRepository.save(user);

    return user.id;
  }

  async deleteUser(id: string) {
    const user = await this.usersRepository.findOrNotFoundFail(id);

    user.makeDeleted();

    await this.usersRepository.save(user);
  }
}
