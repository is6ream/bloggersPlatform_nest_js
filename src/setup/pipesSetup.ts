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
        //pipe выкидывает объект?
        //  { message: 'Unauthorized', statusCode: 401 } message check
        console.log(errorsForResponse, 'errors check in pipe');
        throw new BadRequestException(errorsForResponse);
      },
    }),
  );
}
