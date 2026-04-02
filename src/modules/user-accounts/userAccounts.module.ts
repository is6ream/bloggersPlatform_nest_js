import { Module } from '@nestjs/common';
import { UserController } from './api/user-controller';
import { UsersQueryRepository } from './infrastructure/users/usersQueryRepository';
import { UsersService } from './application/user-service';
import { UsersRepository } from './infrastructure/users/usersRepository';
import { BcryptService } from './application/bcrypt-service';
import { AuthController } from './api/auth-controller';
import { AuthService } from './application/auth-service';
import { AuthQueryRepository } from './infrastructure/auth/authQueryRepository';
import { JwtService } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local-strategy';
import { PassportModule } from '@nestjs/passport';
import { EmailAdapter } from '../notifications/email-adapter';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt-strategy';
import { BasicAuthStrategy } from './strategies/basic-strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { RefreshJwtStrategy } from 'src/modules/user-accounts/strategies/refresh-token.jwt.strategy';
import { DeviceSessionsRepository } from './infrastructure/auth/device-sessions.repository';
import { DeviceSessionsQueryRepository } from './infrastructure/auth/device-sessions.query-repository';
import { DeviceSessionsPostgresDatabase } from './infrastructure/auth/device-sessions-postgres.database';
import { CqrsModule } from '@nestjs/cqrs';
import { RefreshTokensUseCase } from './application/refresh-token.usecase';
import { UsedRefreshTokenStore } from './application/used-refresh-token.store';
import { DeleteDeviceSessionUseCase } from './application/delete-device-session.usecase';
import { DeleteAllOtherSessionsUseCase } from './application/delete-all-other-sessions.usecase';
import { SecurityController } from './api/security.controller';

@Module({
  imports: [
    CqrsModule,
    PassportModule,
    ConfigModule,
    ThrottlerModule.forRoot([{ ttl: 10000, limit: 5 }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '20s' },
    }),
    }),
  ],
  controllers: [UserController, AuthController, SecurityController],
  providers: [
    JwtStrategy,
    LocalStrategy,
    RefreshJwtStrategy,
    UsersQueryRepository,
    UsersRepository,
    UsersService,
    BcryptService,
    AuthService,
    AuthQueryRepository,
    JwtService,
    EmailAdapter,
    DeviceSessionsPostgresDatabase,
    DeviceSessionsRepository,
    DeviceSessionsQueryRepository,
    BasicAuthStrategy,
    UsedRefreshTokenStore,
    RefreshTokensUseCase,
    DeleteDeviceSessionUseCase,
    DeleteAllOtherSessionsUseCase,
  ],
  exports: [DeviceSessionsPostgresDatabase, ThrottlerModule],
})

export class UserAccountsModule {}
