import { HttpExceptionFilter } from 'src/modules/user-accounts/api/validation/exception.filter';
import { INestApplication } from '@nestjs/common';

export function exceptionFiltersSetup(app: INestApplication) {
  app.useGlobalFilters(new HttpExceptionFilter());
}
