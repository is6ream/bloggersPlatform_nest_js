import { Module } from '@nestjs/common';
import { UserController } from './api/user-controller';
import { UsersQueryRepository } from './infrastructure/usersQueryRepository';
import { UsersService } from './application/user-service';
@Module({
  controllers: [UserController],
  providers: [UsersQueryRepository, UsersService],
})
export class UserModule {}
