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

  async validate(
    loginOrEmail: string,
    password: string,
  ): Promise<UserContextDto> {
    const userId: UserContextDto | null = await this.authService.validateUser(
      loginOrEmail,
      password,
    );
    if (!userId) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid username or password',
      });
    }
    return userId;
  }
}
