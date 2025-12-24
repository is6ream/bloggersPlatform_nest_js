import { Module } from '@nestjs/common';
import { UserAccountsModule } from '../user-accounts/userAccounts.module';
import { AppController } from './appController';
import { AppService } from './appService';
import { MongooseModule } from '@nestjs/mongoose';
import { BloggersPlatformModule } from '../bloggers-platform/bloggers-platform.module';
import { TestingModule } from '../testing/testing-module';
import { NotificationsModule } from '../notifications/notifications-module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/blogger-platform'),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    UserAccountsModule,
    BloggersPlatformModule,
    TestingModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
