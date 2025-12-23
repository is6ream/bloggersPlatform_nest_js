import { UsersService } from '../application/user-service';
import { AuthService } from '../application/auth-service';
import { AuthQueryRepository } from '../infrastructure/auth/authQueryRepository';
import { Controller } from '@nestjs/common';
@Controller('auth')
export class AuthController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private authQueryRepository: AuthQueryRepository,
  ) {}
}
