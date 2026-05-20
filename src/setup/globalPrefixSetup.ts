import { INestApplication } from '@nestjs/common';

export const GLOBAL_PREFIX = 'hometask_22/api';

export function globalPrefixSetup(app: INestApplication) {
  return app.setGlobalPrefix(GLOBAL_PREFIX);
}
