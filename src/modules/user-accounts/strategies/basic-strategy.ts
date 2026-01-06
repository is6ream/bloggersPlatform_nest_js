import { BasicStrategy } from 'passport-http';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class BasicAuthStrategy extends PassportStrategy(
  BasicStrategy,
  'basic',
) {
  constructor() {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    if (username === 'admin' && password === 'qwerty') {
      return { username: 'admin' };
    }
    throw new UnauthorizedException();
  }
}
