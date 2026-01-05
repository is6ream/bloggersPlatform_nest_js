import { HttpExceptionFilter } from 'src/modules/user-accounts/api/validation/exception.filter';
import { INestApplication } from '@nestjs/common';
import { DomainHttpExceptionsFilter } from 'src/core/exceptions/filters/domain-exception.filter';

export function exceptionFiltersSetup(app: INestApplication) {
  // app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalFilters(new DomainHttpExceptionsFilter());
}
