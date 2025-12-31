import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
export function pipesSetup(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: false,
      exceptionFactory: (errors) => {
        const errorsForResponse = errors.map((error) => ({
          message:
            Object.values(error.constraints || {})[0] || 'Validation error',
          field: error.property,
        }));

        console.log('🟡 ValidationPipe error:', errorsForResponse);

        throw new BadRequestException({
          errorsMessages: errorsForResponse,
        });
      },
    }),
  );
}
