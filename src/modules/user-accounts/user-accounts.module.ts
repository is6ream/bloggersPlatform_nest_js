import { Module } from '@nestjs/common';
import { UserAccountsController } from './api/user-controller';
import { UserAccountsService } from './application/user-service';

@Module({
  controllers: [UserAccountsController],
  providers: [UserAccountsService]
})
export class UserAccountsModule {
    
}
