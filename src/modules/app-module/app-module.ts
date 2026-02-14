//configModule must be in the top of imports
import { configModule } from 'src/config';
import { Module } from '@nestjs/common';
import { UserAccountsModule } from '../user-accounts/userAccounts.module';
import { AppController } from './app-controller';
import { AppService } from './app-service';
import { MongooseModule } from '@nestjs/mongoose';
import { BloggersPlatformModule } from '../bloggers-platform/bloggers-platform.module';
import { TestingModule } from '../testing/testing-module';
import { EmailAdapter } from '../notifications/email-adapter';
import { CqrsModule } from '@nestjs/cqrs';
import { AppConfig } from 'src/modules/app-module/app-config';

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
  providers: [AppService, EmailAdapter, AppConfig],
})
export class AppModule {}
