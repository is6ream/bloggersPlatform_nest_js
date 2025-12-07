import { Module } from '@nestjs/common';
import { UserController } from './api/user-controller';
import { UsersQueryRepository } from './infrastructure/usersQueryRepository';
import { UsersService } from './application/user-service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/userEntity';
import { UsersRepository } from './infrastructure/usersRepository';
import { BcryptService } from './application/bcrypt-service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), //forFeature позволяет ижектировать UserModel в провайдеры
  ],
  controllers: [UserController],
  providers: [
    UsersQueryRepository,
    UsersRepository,
    UsersService,
    BcryptService,
  ],
  exports: [],
})
export class UserAccountsModule {}
