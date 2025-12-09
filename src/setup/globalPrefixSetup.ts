import { INestApplication } from '@nestjs/common';

export function globalPrefixSetup(app: INestApplication) {
  return app.setGlobalPrefix('hometask_13/api');
}
