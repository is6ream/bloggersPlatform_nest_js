import { UsersService } from '../application/user-service';
import { AuthService } from '../application/auth-service';
import { AuthQueryRepository } from '../infrastructure/auth/authQueryRepository';
import { Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { CreateUserInputDto } from './dto/createUserInputDto';
import { Body } from '@nestjs/common';
import { AuthUserInputDto } from './dto/auth-user-input.dto';
@Controller('auth')
export class AuthController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private authQueryRepository: AuthQueryRepository,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards
  login(@Body() body: AuthUserInputDto): Promise<string> {
    return this.usersService.loginUser(body);
  }

  @Post('registration')
  registration(@Body() body: CreateUserInputDto): Promise<void> {
    return this.usersService.registerUser(body);
  }
}
