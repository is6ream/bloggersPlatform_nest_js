import { AuthService } from '../application/auth-service';
import { AuthQueryRepository } from '../infrastructure/auth/authQueryRepository';
import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Post,
  Req,
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
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { RefreshTokenGuard } from 'src/modules/user-accounts/guards/jwt/refresh-token.guard';
import { AuthIpRestrictionGuard } from '../guards/auth-ip-restriction.guard';
import { authNewPasswordThrottle } from '../config/auth-ip-restriction.config';
import { CommandBus } from '@nestjs/cqrs';
import { RefreshTokensCommand } from 'src/modules/user-accounts/application/refresh-token.usecase';
import { getClientIpFromRequest } from 'src/core/utils/client-ip';
import { CookieResponse, HttpRequestWithUser } from 'src/core/types/http.types';

const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type RefreshTokenRequestUser = {
  sub: string;
  deviceId: string;
  refreshToken?: string;
  iat: number
};

@Controller('auth')
@UseGuards(AuthIpRestrictionGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private authQueryRepository: AuthQueryRepository,
    private commandBus: CommandBus,
  ) { }
//вынести set clear token в сервис
  private getRefreshTokenCookieOptions(
    req: HttpRequestWithUser,
    maxAgeMs?: number,
  ): { httpOnly: true; secure: boolean; sameSite: 'strict'; maxAge?: number } {
    const isSecure =
      req.secure || req.get?.('x-forwarded-proto') === 'https';

    // В учебной/локальной среде нам важно, чтобы кука отправлялась и по HTTP,
    // поэтому флаг secure включаем только в продакшене или при реально HTTPS-запросе.
    const secure =
      process.env.NODE_ENV === 'production' ? true : isSecure;

    return {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      ...(maxAgeMs !== undefined && { maxAge: maxAgeMs }),
    };
  }

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() body: PasswordRecoveryInputDto) {
    //не хватает await
    return await this.commandBus.execute()
    return this.authService.passwordRecovery(body.email);
  }

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
    @Req() req: HttpRequestWithUser,
    @Res({ passthrough: true }) res: CookieResponse,
  )
    : Promise<{ accessToken: string }> {
    const ip = getClientIpFromRequest(req);

    const userAgentHeader = req.headers['user-agent'];
    const userAgent = Array.isArray(userAgentHeader)
      ? userAgentHeader[0]
      : userAgentHeader || 'unknown';

    const { accessToken, refreshToken } = await this.authService.loginUser(
      user,
      { ip, userAgent },
    );
    res.cookie('refreshToken', refreshToken, {
      ...this.getRefreshTokenCookieOptions(req, REFRESH_TOKEN_COOKIE_MAX_AGE_MS),
    });

    return { accessToken: accessToken };
  }


  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  registration(@Body() body: CreateUserInputDto): Promise<void> {
    return this.authService.registerUser(body);
  }

  @Post('new-password')
  @Throttle(authNewPasswordThrottle)
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() body: NewPasswordInputDto): Promise<void> {
    return this.authService.resetPassword(body.newPassword, body.recoveryCode);
  }

  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmRegistration(
    @Body() body: PasswordConfirmationInputDto,
  ): Promise<void> {
    return this.authService.confirmRegistration(body.code);
  }

  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async emailResending(@Body() body: EmailResendingInputDto): Promise<void> {
    return this.authService.emailResending(body.email);
  }

  @Post('refresh-token')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  async refreshToken(
    @Req() req: HttpRequestWithUser<RefreshTokenRequestUser>,
    @Res({ passthrough: true }) res: CookieResponse,
  ) {
    const userId = req.user!.sub;
    const deviceId = req.user!.deviceId;
    const refreshToken = req.user!.refreshToken!;
    const iat = req.user!.iat!;

    this.logger.log(
      `[/refresh-token] Request with valid refresh token — userId=${userId}, deviceId=${deviceId}`,
    );

    const tokens = await this.commandBus.execute(
      new RefreshTokensCommand(userId, deviceId, refreshToken, iat),
    );


    res.cookie('refreshToken', tokens.refreshToken, {
      ...this.getRefreshTokenCookieOptions(req, REFRESH_TOKEN_COOKIE_MAX_AGE_MS),
    });

    return { accessToken: tokens.accessToken };
  }


  @Post('logout')
  @SkipThrottle()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshTokenGuard)
  async logout(
    @Req() req: HttpRequestWithUser<RefreshTokenRequestUser>,
    @Res({ passthrough: true }) res: CookieResponse,
  ): Promise<void> {
    const { sub: userId, deviceId } = req.user!

    console.log("userId: ", userId, "deviceId: ", deviceId)

    if (userId && deviceId) {
      await this.authService.logout(userId, deviceId);
    }

    res.clearCookie(
      'refreshToken',
      this.getRefreshTokenCookieOptions(req),
    );
  }

  @ApiBearerAuth()
  @Get('me')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  async getMe(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<GetMeOutputDto> {
    return this.authQueryRepository.getMe(user.id);
  }


}
