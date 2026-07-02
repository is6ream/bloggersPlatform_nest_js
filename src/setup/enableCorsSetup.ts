import { INestApplication } from '@nestjs/common';

export function enableCors(app: INestApplication) {
  return app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });
}
