import { Module } from '@nestjs/common';
import { UserAccountsModule } from '../userAccounts/userAccounts.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    UserAccountsModule,
    MongooseModule.forRoot('mongodb://localhost:27017/'),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
