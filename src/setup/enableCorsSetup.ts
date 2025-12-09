import { INestApplication } from '@nestjs/common';

export function enableCors(app: INestApplication) {
  return app.enableCors();
}
