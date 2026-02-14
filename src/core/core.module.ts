import { Global, Module } from '@nestjs/common';
import { CoreConfig } from 'src/modules/app-module/core-config';

@Global()
@Module({
  providers: [CoreConfig],
  exports: [CoreConfig],
})
export class CoreModule {}
