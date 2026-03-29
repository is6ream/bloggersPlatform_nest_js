import { Module } from '@nestjs/common';
import { TestingController } from './testing-controller';
import { UserAccountsModule } from '../user-accounts/userAccounts.module';

@Module({
  imports: [UserAccountsModule],
  controllers: [TestingController],
})
export class TestingModule {}
