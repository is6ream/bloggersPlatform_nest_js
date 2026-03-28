import { Injectable } from '@nestjs/common';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { GetMeOutputDto } from '../../api/dto/output/get-me-output.dto';
import { UsersRepository } from '../users/usersRepository';

@Injectable()
export class AuthQueryRepository {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getMe(id: string): Promise<GetMeOutputDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new DomainException({ code: 1, message: 'User not found' });
    }
    return {
      email: user.email,
      login: user.login,
      userId: user.id,
    };
  }
}
