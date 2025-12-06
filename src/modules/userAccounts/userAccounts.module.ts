import { Module } from '@nestjs/common';
import { UserController } from './api/user-controller';
import { UsersQueryRepository } from './infrastructure/usersQueryRepository';
import { UsersService } from './application/user-service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/userEntity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), //forFeature позволяет ижектировать UserModel в провайдеры
  ],
  controllers: [UserController],
  providers: [UsersQueryRepository, UsersService],
  exports: [],
})
export class UserAccountsModule {} 
