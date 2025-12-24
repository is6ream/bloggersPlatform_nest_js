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

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), //forFeature позволяет ижектировать UserModel в провайдеры
  ],
  controllers: [UserController, AuthController],
  providers: [
    UsersQueryRepository,
    UsersRepository,
    UsersService,
    BcryptService,
    EmailService,
    AuthService,
    AuthQueryRepository,
  ],
  exports: [],
})
export class UserAccountsModule {}
