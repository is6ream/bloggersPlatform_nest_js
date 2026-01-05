import { Extension } from '../domain-exceptions';
import { DomainExceptionCode } from '../domain-exception-codes';

export type ErrorResponseBody = {
  errorMessages: [{ message: string; field: string }];
};
