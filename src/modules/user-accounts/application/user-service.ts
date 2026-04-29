import { Injectable } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from '../dto/UserInputDto';
import { BcryptService } from './bcrypt-service';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';
import { UsersRepository } from '../infrastructure/users/repositories/users-repository';
import { UserOrmEntity } from '../infrastructure/users/entities/user.orm-entity';

@Injectable()
export class UsersService {
  constructor(
    private bcryptService: BcryptService,
    private repository: UsersRepository
  ) { }

  async createUser(dto: CreateUserDto): Promise<string> {
    const userWithSameLogin = await this.repository.findByLogin(dto.login);

    if (userWithSameLogin) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'user with such login already exists',
      });
    }

    const passwordHash = await this.bcryptService.generateHash(dto.password);

    const user = UserOrmEntity.create({ login: dto.login, email: dto.email, passwordHash: passwordHash })

    await this.repository.save(user)

    return user.id;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<string> {
    const user = await this.repository.findOrNotFoundFail(id);

    user.update(dto);

    await this.repository.save(user);

    return user.id;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.repository.findOrNotFoundFail(id);

    user.makeDeleted();

    await this.repository.save(user);
  }
}
