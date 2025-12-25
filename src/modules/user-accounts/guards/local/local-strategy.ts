import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../../application/auth-service';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-local';
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'login' });
  }

  //validate возвращает то, что впоследствии будет записано в req.user
  async validate(username: string, password: string): Promise<UserContextDto> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw UnauthorizedDomainException.create();
    }

    return user;
  }
}
