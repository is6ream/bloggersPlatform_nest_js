//configModule must be in the top of imports
import { configModule } from 'src/config';
import { Module } from '@nestjs/common';
import { UserAccountsModule } from '../user-accounts/userAccounts.module';
import { AppController } from './appController';
import { AppService } from './appService';
import { MongooseModule } from '@nestjs/mongoose';
import { BloggersPlatformModule } from '../bloggers-platform/bloggers-platform.module';
import { TestingModule } from '../testing/testing-module';
import { EmailAdapter } from '../notifications/email-adapter';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI as string),
    CqrsModule.forRoot(),
    UserAccountsModule,
    BloggersPlatformModule,
    TestingModule,
    configModule,
  ],
  controllers: [AppController],
  providers: [AppService, EmailAdapter],
})
export class AppModule {}
