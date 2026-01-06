import { Extension } from '../domain-exceptions';
import { DomainExceptionCode } from '../domain-exception-codes';

export type ErrorResponseBody = {
  errorsMessages: { message: string; field: string }[];
};
