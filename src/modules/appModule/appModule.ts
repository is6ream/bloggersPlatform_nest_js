import { Module } from '@nestjs/common';
import { UserAccountsModule } from '../user-accounts/userAccounts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './appController';
import { AppService } from './appService';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/'),
    UserAccountsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
