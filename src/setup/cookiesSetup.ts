import cookieParser from 'cookie-parser';
import { INestApplication } from '@nestjs/common';

export function enableCookiesSetup(app: INestApplication) {
  return app.use(cookieParser());
}
