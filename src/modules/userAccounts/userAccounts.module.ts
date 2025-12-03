import { Module } from '@nestjs/common';
import { UserController } from './api/user-controller';
import { UsersQueryRepository } from './infrastructure/usersQueryRepository';
import { UsersService } from './application/user-service';

@Module({
  imports: [],
  controllers: [UserController],
  providers: [UsersQueryRepository, UsersService],
  exports: [],
})
export class UserAccountsModule {} //не приходит гет запрос за всеми юзерами в постмане


//Нужно описать доменную модель и ее методы. Методы покрыть тестами
//UserAccountModule 
