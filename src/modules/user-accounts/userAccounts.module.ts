import { Module } from '@nestjs/common';
import { UserController } from './api/user-controller';
import { UsersQueryRepository } from './infrastructure/users/usersQueryRepository';
import { UsersService } from './application/user-service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/userEntity';
import { UsersRepository } from './infrastructure/users/usersRepository';
import { BcryptService } from './application/bcrypt-service';
import { AuthController } from './api/authController';
import { EmailService } from '../notifications/email-service';
import { AuthService } from './application/auth-service';
import { AuthQueryRepository } from './infrastructure/auth/authQueryRepository';
import { JwtService } from '@nestjs/jwt';
import { LocalStrategy } from './guards/local/local-strategy';
import { PassportModule } from '@nestjs/passport';
import { EmailAdapter } from '../notifications/email-adapter';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
  ],
  controllers: [UserController, AuthController],
  providers: [
    LocalStrategy,
    UsersQueryRepository,
    UsersRepository,
    UsersService,
    BcryptService,
    EmailService,
    AuthService,
    AuthQueryRepository,
    JwtService,
    EmailAdapter,
  ],
  exports: [],
})
export class UserAccountsModule {}
