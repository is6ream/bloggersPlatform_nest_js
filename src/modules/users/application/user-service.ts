import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/usersRepository';

@Injectable()
export class UserService {
  constructor(private usersRepository: UsersRepository) {}

  async create(dto: UserInputModel): Promise<Result<string>> {
    const isEmailExist = await this.usersRepository.isUserExistByEmailOrLogin(
      dto.email,
    );
    if (isEmailExist) {
      return handleBadRequestResult('Email already exists', 'email');
    }
    const passwordHash = await bcryptService.generateHash(dto.password);
    const user = new UserModel();
    user.login = dto.login;
    user.passwordHash = passwordHash;
    user.email = dto.email;
    const newUserId = await this.usersRepository.create(user);
    return handleSuccessResult(newUserId);
  }

  async delete(id: string): Promise<Result> {
    const result = await this.usersRepository.delete(id);
    if (!result) {
      return handleNotFoundResult('user not found', 'userId');
    } else {
      return handleSuccessResult();
    }
  }

  async findUser(id: string): Promise<Result<UserViewModel>> {
    const user: UserViewModel = await this.usersRepository.find(id);

    return handleSuccessResult(user);
  }
}
