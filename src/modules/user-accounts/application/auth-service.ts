import { Injectable } from '@nestjs/common';
import { BcryptService } from './bcrypt-service';
import { UsersRepository } from '../infrastructure/users/usersRepository';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private bcryptService: BcryptService,
  ) {}

  async validateUser(login: string, password: string): Promise<null> {
    const user = await this.usersRepository.findByLogin(login);
    if (!user) {
      return null;
    }
//остановился здесь, нужно закомитить и прописать фукнцию CompareHash
    const isPasswordValid = await this.bcryptService


  }
}
