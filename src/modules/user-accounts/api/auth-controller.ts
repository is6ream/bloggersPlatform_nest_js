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
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { RefreshTokenGuard } from 'src/modules/user-accounts/guards/jwt/refresh-token.guard';
import { Request } from 'express';
import { CommandBus } from '@nestjs/cqrs';
import { RefreshTokensCommand } from 'src/modules/user-accounts/application/refresh-token.usecase';
import { UsedRefreshTokenStore } from '../application/used-refresh-token.store';

const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private authQueryRepository: AuthQueryRepository,
    private commandBus: CommandBus,
    private usedRefreshTokenStore: UsedRefreshTokenStore,
  ) {}

  private normalizeIp(rawIp: string): string {
    const ipWithoutPort = rawIp.includes(':') && rawIp.includes('.')
      ? rawIp.replace(/^::ffff:/, '')
      : rawIp;

    if (ipWithoutPort === '::1') {
      return '127.0.0.1';
    }

    return ipWithoutPort.trim().toLowerCase();
  }

  private getRefreshTokenCookieOptions(
    req: Request,
    maxAgeMs?: number,
  ): { httpOnly: true; secure: boolean; sameSite: 'strict'; maxAge?: number } {
    const isSecure =
      req.secure || req.get('x-forwarded-proto') === 'https';

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

  private extractClientIp(req: Request): string {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(xForwardedFor)
      ? xForwardedFor[0]
      : xForwardedFor?.toString().split(',')[0]?.trim();

    const ip = (
      forwardedIp ||
      (req.ip as string) ||
      (req.socket?.remoteAddress as string) ||
      'unknown'
    );

    return this.normalizeIp(ip);
  }

  @Post('password-recovery')
  @Throttle({
    default: { limit: 5, ttl: 60000 },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() body: PasswordRecoveryInputDto) {
    return this.authService.passwordRecovery(body.email);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: { limit: 5, ttl: 10000 },
  })
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
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  )
    : Promise<{ accessToken: string }> {
    const ip = this.extractClientIp(req);

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
  @Throttle({
    default: { limit: 5, ttl: 10000 },
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
    default: { limit: 5, ttl: 10000 },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmRegistration(
    @Body() body: PasswordConfirmationInputDto,
  ): Promise<void> {
    return this.authService.confirmRegistration(body.code);
  }

  @Post('registration-email-resending')
  @Throttle({
    default: { limit: 5, ttl: 10000 },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async emailResending(@Body() body: EmailResendingInputDto): Promise<void> {
    return this.authService.emailResending(body.email);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = (req.user as any).sub;
    const deviceId = (req.user as any).deviceId;
    const refreshToken = (req.user as any).refreshToken;

    this.logger.log(
      `[/refresh-token] Request with valid refresh token — userId=${userId}, deviceId=${deviceId}`,
    );

    const tokens = await this.commandBus.execute(
      new RefreshTokensCommand(userId, deviceId, refreshToken),
    );

    this.usedRefreshTokenStore.add(refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      ...this.getRefreshTokenCookieOptions(req, REFRESH_TOKEN_COOKIE_MAX_AGE_MS),
    });

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshTokenGuard)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const { sub: userId, deviceId, refreshToken } = req.user as any;

    this.logger.log(
      `[/logout] Request with valid refresh token — userId=${userId}, deviceId=${deviceId}`,
    );

    if (refreshToken) {
      this.usedRefreshTokenStore.add(refreshToken);
    }
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
  @UseGuards(JwtAuthGuard)
  async getMe(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<GetMeOutputDto> {
    return this.authQueryRepository.getMe(user.id);
  }


}
