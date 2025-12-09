import { INestApplication } from '@nestjs/common';
import { pipesSetup } from 'src/setup/pipesSetup';
import { globalPrefixSetup } from './globalPrefixSetup';
import { enableCors } from './enableCorsSetup';

export function appSetup(app: INestApplication) {
  pipesSetup(app);
  globalPrefixSetup(app);
  enableCors(app);
}
