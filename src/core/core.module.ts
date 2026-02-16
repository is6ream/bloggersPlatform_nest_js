import { Global, Module } from '@nestjs/common';
import { CoreConfig } from 'src/modules/app-module/core-config';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [CoreConfig, ConfigService],
  exports: [CoreConfig],
})
export class CoreModule {}
