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
import { CoreConfig } from 'src/modules/app-module/core-config';
import { CoreModule } from 'src/core/core.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    configModule,
    CoreModule,
    TypeOrmModule.forRootAsync({
      imports: [CoreModule],
      inject: [CoreConfig],
      useFactory: (coreConfig: CoreConfig) => ({
        type: 'postgres' as const,
        host: coreConfig.pgHost,
        port: coreConfig.pgPort,
        username: coreConfig.pgUser,
        password: coreConfig.pgPassword,
        database: coreConfig.pgDatabase,
        synchronize: false,
        autoLoadEntities: true,
      }),
    }),
    MongooseModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => {
        return {
          uri: coreConfig.mongoURI,
        };
      },
      inject: [CoreConfig],
    }),
    CqrsModule.forRoot(),
    UserAccountsModule,
    BloggersPlatformModule,
    TestingModule,
  ],
  controllers: [AppController],
  providers: [AppService, EmailAdapter],
})
export class AppModule { }
