import { Global, Module } from '@nestjs/common';
import { CoreConfig } from 'src/modules/app-module/core-config';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Global()
@Module({
  providers: [
    CoreConfig,
    ConfigService,
    {
      provide: DataSource,
      inject: [CoreConfig],
      useFactory: async (coreConfig: CoreConfig): Promise<DataSource> => {
        const dataSource = new DataSource({
          type: 'postgres',
          host: coreConfig.pgHost,
          port: coreConfig.pgPort,
          username: coreConfig.pgUser,
          password: coreConfig.pgPassword,
          database: coreConfig.pgDatabase,
          synchronize: false,
        });

        if (!dataSource.isInitialized) {
          await dataSource.initialize();
        }

        return dataSource;
      },
    },
  ],
  exports: [CoreConfig, DataSource],
})
export class CoreModule {}
