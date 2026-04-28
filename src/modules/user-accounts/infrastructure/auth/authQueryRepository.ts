import { Injectable } from '@nestjs/common';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { GetMeOutputDto } from '../../api/dto/output/get-me-output.dto';
import { UsersRawSqlRepository } from '../users/repositories/users-raw-sql.repository';

@Injectable()
export class AuthQueryRepository {
  constructor(private readonly usersRepository: UsersRawSqlRepository) {}

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
