import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';

@Module({
  //Модуль является composition root
  imports: [UserAccountsModule],
  controllers: [UsersController],
  providers: [AppService],
})
export class AppModule {}
