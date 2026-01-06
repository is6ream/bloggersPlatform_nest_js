// local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../application/auth-service';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    console.log(username, password, 'username, pass, check');
    const user = await this.authService.validateUser(username, password);

    if (!user) {
      // Кидаем DomainException вместо UnauthorizedException
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid credentials',
      });
    }

    return user;
  }
}
