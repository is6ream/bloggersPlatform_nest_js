import { INestApplication } from '@nestjs/common';
import { pipesSetup } from 'src/setup/pipesSetup';
import { globalPrefixSetup } from './globalPrefixSetup';
import { enableCors } from './enableCorsSetup';
import { exceptionFiltersSetup } from './exceptionFilterSetup';
import { swaggerSetup } from './swaggerSetup';

export function appSetup(app: INestApplication) {
  pipesSetup(app);
  globalPrefixSetup(app);
  enableCors(app);
  exceptionFiltersSetup(app);
  swaggerSetup(app);
}
