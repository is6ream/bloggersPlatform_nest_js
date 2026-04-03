import { INestApplication } from '@nestjs/common';
import { pipesSetup } from 'src/setup/pipesSetup';
import { globalPrefixSetup } from './globalPrefixSetup';
import { enableCors } from './enableCorsSetup';
import { exceptionFiltersSetup } from './exceptionFilterSetup';
import { swaggerSetup } from './swaggerSetup';
import { enableCookiesSetup } from 'src/setup/cookiesSetup';

function enableTrustProxy(app: INestApplication): void {
  const server = app.getHttpAdapter().getInstance();
  if (server?.set) {
    server.set('trust proxy', true);
  }
}

export function appSetup(app: INestApplication) {
  enableTrustProxy(app);
  pipesSetup(app);
  globalPrefixSetup(app);
  enableCors(app);
  exceptionFiltersSetup(app);
  swaggerSetup(app);
  enableCookiesSetup(app);
}
