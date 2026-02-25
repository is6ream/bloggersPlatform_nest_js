import { Module } from '@nestjs/common';
import { UserController } from './api/user-controller';
import { UsersQueryRepository } from './infrastructure/users/usersQueryRepository';
import { UsersService } from './application/user-service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/userEntity';
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
import { DeviceSession, DeviceSessionSchema } from './domain/device-session.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      {name: DeviceSession.name, schema: DeviceSessionSchema}
    ]),
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
    }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ])
  ],
  controllers: [UserController, AuthController],
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
    UsersService,
    EmailAdapter,
    BasicAuthStrategy,
  ],
  exports: [],
})

export class UserAccountsModule {}
