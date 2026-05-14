import 'reflect-metadata';

import { register } from 'tsconfig-paths';
import { DataSource } from 'typeorm';

register({
  baseUrl: '.',
  paths: { 'src/*': ['src/*'] },
});

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

async function createDataSource() {
  const { Module } = await import('@nestjs/common');
  const { NestFactory } = await import('@nestjs/core');
  const { configModule } = await import('./src/config');
  const { CoreModule } = await import('./src/core/core.module');
  const { CoreConfig } = await import('./src/modules/app-module/core-config');

  @Module({
    imports: [configModule, CoreModule],
  })
  class TypeOrmCliModule {}

  const app = await NestFactory.createApplicationContext(TypeOrmCliModule, {
    logger: false,
  });

  const coreConfig = app.get(CoreConfig);

  const dataSource = new DataSource({
    type: 'postgres',
    host: coreConfig.pgHost,
    port: coreConfig.pgPort,
    username: coreConfig.pgUser,
    password: coreConfig.pgPassword,
    database: coreConfig.pgDatabase,
    migrations: ['migrations/*.ts'],
    ssl:
      coreConfig.env === 'production'
        ? { rejectUnauthorized: false }
        : false,
  });

  await app.close();
  return dataSource;
}

export default createDataSource();
