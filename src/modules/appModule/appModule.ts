import { Module } from '@nestjs/common';
import { UserAccountsModule } from '../userAccounts/userAccounts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './appController';
import { AppService } from './appService';

@Module({
  imports: [
    UserAccountsModule,
    MongooseModule.forRoot('mongodb://localhost:27017/'),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
