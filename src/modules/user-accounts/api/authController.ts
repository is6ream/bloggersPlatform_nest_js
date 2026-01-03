import { UsersService } from '../application/user-service';
import { AuthService } from '../application/auth-service';
import { AuthQueryRepository } from '../infrastructure/auth/authQueryRepository';
import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateUserInputDto } from './dto/createUserInputDto';
import { Body } from '@nestjs/common';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { ApiBody } from '@nestjs/swagger';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { ExtractUserFromRequest } from '../guards/decorators/param/extract-user-from-request.decorator';
import { LoginInputDto } from './dto/login-input.dto';
import { PasswordRecoveryInputDto } from './dto/password-recovery-input.dto';
import { NewPasswordInputDto } from './dto/new-password-input.dto';
@Controller('auth')
export class AuthController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private authQueryRepository: AuthQueryRepository,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  @UseGuards(LocalAuthGuard)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        loginOrEmail: { type: 'string', example: 'test@email.com' },
        password: { type: 'string', example: '123123123' },
      },
    },
  })
  async login(
    @Body() body: LoginInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<{ accessToken: string }> {
    return await this.authService.loginUser(user.id);
  }

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(
    @Body() body: PasswordRecoveryInputDto,
  ): Promise<void> {
    return await this.authService.passwordRecovery(body.email);
  }

  @Post('registration')
  registration(@Body() body: CreateUserInputDto): Promise<void> {
    return this.authService.registerUser(body);
  }

  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() body: NewPasswordInputDto): Promise<void> {
    return this.authService.confirmNewPassword(
      body.newPassword,
      body.recoveryCode,
    );
  }
}
