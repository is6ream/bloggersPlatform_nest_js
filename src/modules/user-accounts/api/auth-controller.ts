import { AuthService } from '../application/auth-service';
import { AuthQueryRepository } from '../infrastructure/auth/authQueryRepository';
import {
  Controller,
  Get,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CreateUserInputDto } from './dto/input/create-user.input.dto';
import { Body, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UserContextDto } from '../guards/dto/user-context.input.dto';
import { ExtractUserFromRequest } from '../guards/decorators/param/extract-user-from-request.decorator';
import { PasswordRecoveryInputDto } from './dto/input/password-recovery-input.dto';
import { NewPasswordInputDto } from './dto/input/new-password-input.dto';
import { PasswordConfirmationInputDto } from './dto/input/password-confirmation.input.dto';
import { EmailResendingInputDto } from './dto/input/email-resending.input.dto';
import { GetMeOutputDto } from './dto/output/get-me-output.dto';
import { JwtAuthGuard } from '../guards/jwt/jwt-auth.guard';
import { LocalAuthValidationGuard } from '../guards/local/local-auth-validation.guard';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private authService: AuthService,
    private authQueryRepository: AuthQueryRepository,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthValidationGuard)
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
    @ExtractUserFromRequest() user: UserContextDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const refreshToken = 'stub.jwt.token.with.dots';

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 часа
    });
    return this.authService.loginUser(user);
  }

  @Post('password-recovery')
  @Throttle({
    default: { limit: 5, ttl: 60000 },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() body: PasswordRecoveryInputDto) {
    return this.authService.passwordRecovery(body.email);
  }

  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({
    default: { limit: 15, ttl: 60000 },
  })
  registration(@Body() body: CreateUserInputDto): Promise<void> {
    return this.authService.registerUser(body);
  }

  @Post('new-password')
  @Throttle({
    default: { limit: 5, ttl: 60000 },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() body: NewPasswordInputDto): Promise<void> {
    return this.authService.resetPassword(body.newPassword, body.recoveryCode);
  }

  @Post('registration-confirmation')
  @Throttle({
    default: { limit: 5, ttl: 60000 },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmRegistration(
    @Body() body: PasswordConfirmationInputDto,
  ): Promise<void> {
    return this.authService.confirmRegistration(body.code);
  }

  @Post('registration-email-resending')
  // @Throttle({
  //   default: { limit: 5, ttl: 60000 },
  // })
  @HttpCode(HttpStatus.NO_CONTENT)
  async emailResending(@Body() body: EmailResendingInputDto): Promise<void> {
    return this.authService.emailResending(body.email);
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<GetMeOutputDto> {
    return this.authQueryRepository.getMe(user.id);
  }
}
