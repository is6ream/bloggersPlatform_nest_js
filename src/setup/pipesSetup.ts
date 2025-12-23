import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';

export function pipesSetup(app: INestApplication) {
  return app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: false,
      exceptionFactory: (errors) => {
        const errorsForResponse: any[] = [];

        errors.forEach((e) => {
          const constraintKeys = Object.keys(e.constraints!);
          constraintKeys.forEach((ck) => {
            errorsForResponse.push({
              message: e.constraints![ck],
              field: e.property,
            });
          });
        });

        throw new BadRequestException(errorsForResponse);
      },
    }),
  );
}
