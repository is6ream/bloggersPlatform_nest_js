import { Injectable } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from '../dto/UserInputDto';
import { BcryptService } from './bcrypt-service';
import { UsersRepository } from '../infrastructure/users/repositories/users-repository';
import { UserOrmEntity } from '../infrastructure/users/entities/user.orm-entity';
import { throwRegistrationConflict } from './throw-registration-conflict';

@Injectable()
export class UsersService {
  constructor(
    private bcryptService: BcryptService,
    private repository: UsersRepository
  ) { }

  async createUser(dto: CreateUserDto): Promise<string> {
    await this.assertRegistrationAvailable(dto);

    const passwordHash = await this.bcryptService.generateHash(dto.password);

    const user = UserOrmEntity.create({ login: dto.login, email: dto.email, passwordHash: passwordHash })

    await this.repository.save(user)

    return user.id;
  }

  private async assertRegistrationAvailable(dto: CreateUserDto): Promise<void> {
    const [existingByEmail, existingByLogin] = await Promise.all([
      this.repository.findByEmail(dto.email),
      this.repository.findByLogin(dto.login),
    ]);

    if (existingByEmail) {
      throwRegistrationConflict('email', 'Email already registered');
    }
    if (existingByLogin) {
      throwRegistrationConflict('login', 'Login already registered');
    }
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
