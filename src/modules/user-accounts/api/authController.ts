import { UsersService } from '../application/user-service';
import { AuthService } from '../application/auth-service';
import { AuthQueryRepository } from '../infrastructure/auth/authQueryRepository';
import { Controller, Post } from '@nestjs/common';
import { CreateUserInputDto } from './validation/createUserInputDto';
import { Body } from '@nestjs/common';
@Controller('auth')
export class AuthController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private authQueryRepository: AuthQueryRepository,
  ) {}

  @Post('registration')
  registration(@Body() body: CreateUserInputDto): Promise<void> {
    return this.usersService.registerUser(body);
  }
}
