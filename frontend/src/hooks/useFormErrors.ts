import { useState } from 'react';
import { getFieldErrors, getFieldError, getGeneralError } from '../utils/errors';
import type { FieldError } from '../types/api';

export function useFormErrors() {
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [generalError, setGeneralError] = useState<string | undefined>();

  const setError = (err: unknown) => {
    const fieldErrors = getFieldErrors(err);
    setErrors(fieldErrors);
    setGeneralError(
      fieldErrors.length ? undefined : getGeneralError(err),
    );
  };

  const clearErrors = () => {
    setErrors([]);
    setGeneralError(undefined);
  };

  const field = (name: string) => getFieldError(errors, name);

  return { errors, generalError, setError, clearErrors, field };
}
