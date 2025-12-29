import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { AuthService } from '../application/auth-service';
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'login' });
  }

  //validate возвращает то, что в последствии будет записано в req.user, как он это делает? Разобраться
  async validate(username: string, password: string): Promise<UserContextDto> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid username or password',
      });
    }
    return user;
  }
}
