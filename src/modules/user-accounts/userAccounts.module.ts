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
import * as dotenv from 'dotenv';
import { JwtStrategy } from './strategies/jwt-strategy';
import { ThrottlerModule } from '@nestjs/throttler';
import { BasicAuthStrategy } from './strategies/basic-strategy';
dotenv.config();
console.log(process.env.JWT_SECRET, 'JWT_SECRET check');
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in .env file');
}
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60m' },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 5,
      },
    ]),
  ],
  controllers: [UserController, AuthController],
  providers: [
    JwtStrategy,
    LocalStrategy,
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
