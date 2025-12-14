import { Module } from '@nestjs/common';
import { UserAccountsModule } from '../user-accounts/userAccounts.module';
// import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './appController';
import { AppService } from './appService';
import { MongooseModule } from '@nestjs/mongoose';
import { BloggersPlatformModule } from '../bloggers-platform/bloggers-platform.module';
import { TestingController } from '../testing/testing-contorller';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/blogger-platform'),
    UserAccountsModule,
    BloggersPlatformModule,
    TestingController,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
