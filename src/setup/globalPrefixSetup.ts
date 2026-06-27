import { INestApplication, RequestMethod } from '@nestjs/common';

export const GLOBAL_PREFIX = 'hometask_25/api';

export function globalPrefixSetup(app: INestApplication) {
  return app.setGlobalPrefix(GLOBAL_PREFIX, {
    exclude: [{ path: '', method: RequestMethod.GET }],
  });
}
