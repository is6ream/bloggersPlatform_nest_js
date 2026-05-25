import { ApiError } from '../api/client';
import type { FieldError } from '../types/api';

export function getFieldErrors(error: unknown): FieldError[] {
  if (error instanceof ApiError && error.body.errorsMessages) {
    return error.body.errorsMessages;
  }
  return [];
}

export function getFieldError(
  errors: FieldError[],
  field: string,
): string | undefined {
  return errors.find((e) => e.field === field)?.message;
}

export function getGeneralError(error: unknown): string | undefined {
  if (error instanceof ApiError) {
    if (error.body.errorsMessages?.length) {
      return error.body.errorsMessages.map((e) => e.message).join(', ');
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
}
