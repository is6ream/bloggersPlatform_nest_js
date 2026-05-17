import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';

export function throwRegistrationConflict(
  field: 'email' | 'login',
  message: string,
): never {
  throw new DomainException({
    code: DomainExceptionCode.BadRequest,
    message,
    extensions: [{ message, field }],
  });
}
