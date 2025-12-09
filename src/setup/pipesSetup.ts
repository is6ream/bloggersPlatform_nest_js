import { INestApplication, ValidationPipe } from '@nestjs/common';

export function pipesSetup(app: INestApplication) {
  return app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
}
