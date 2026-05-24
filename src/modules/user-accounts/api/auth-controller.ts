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
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiAuthLoginDecorator } from './swagger/api-auth-login.decorator';
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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RefreshTokensCommand } from 'src/modules/user-accounts/application/refresh-token.usecase';
import { getClientIpFromRequest } from 'src/core/utils/client-ip';
import { CookieResponse, HttpRequestWithUser } from 'src/core/types/http.types';
import { PasswordRecoveryCommand } from '../application/useCases/password-recovery.command';
import { LoginCommand } from '../application/useCases/login.command';
import { RegistrationUserCommand } from '../application/useCases/registration-user.command';
import { ResetPasswordCommand } from '../application/useCases/reset-password.command';
import { ConfirmRegistrationCommand } from '../application/useCases/confirm-registration.command';
import { EmailResendingCommand } from '../application/useCases/email-resending.command';
import { LogoutCommand } from '../application/useCases/logout.command';
import { GetMeQuery } from '../application/queries/get-me.query';

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
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}
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
    return await this.commandBus.execute(new PasswordRecoveryCommand(body.email))
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthValidationGuard)
  @ApiAuthLoginDecorator()
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

    const { accessToken, refreshToken } = await this.commandBus.execute(
      new LoginCommand(user, { ip, userAgent }),
    );
    res.cookie('refreshToken', refreshToken, {
      ...this.getRefreshTokenCookieOptions(req, REFRESH_TOKEN_COOKIE_MAX_AGE_MS),
    });

    return { accessToken: accessToken };
  }


  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(@Body() body: CreateUserInputDto): Promise<void> {
    return await this.commandBus.execute(new RegistrationUserCommand(body))
  }

  @Post('new-password')
  @Throttle(authNewPasswordThrottle)
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() body: NewPasswordInputDto): Promise<void> {
    return this.commandBus.execute(
      new ResetPasswordCommand(body.newPassword, body.recoveryCode),
    );
  }

  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmRegistration(
    @Body() body: PasswordConfirmationInputDto,
  ): Promise<void> {
    return this.commandBus.execute(new ConfirmRegistrationCommand(body.code));
  }

  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async emailResending(@Body() body: EmailResendingInputDto): Promise<void> {
    return this.commandBus.execute(new EmailResendingCommand(body.email));
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
    const { sub: userId, deviceId } = req.user!;

    if (userId && deviceId) {
      await this.commandBus.execute(new LogoutCommand(userId, deviceId));
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
    return this.queryBus.execute(new GetMeQuery(user.id));
  }


}
