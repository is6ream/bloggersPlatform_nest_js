import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { DomainException } from '../domain-exceptions';
import { Request, Response } from 'express';
import { DomainExceptionCode } from '../domain-exception-codes';
import { ErrorResponseBody } from './error-response-body.type';
@Catch(DomainException)
export class DomainHttpExceptionsFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.mapToHttpStatus(exception.code);

    if (exception.code === DomainExceptionCode.Unauthorized) {
      response.status(status).send();
      return;
    }
    const responseBody = this.buildResponseBody(exception, request.url);
    response.status(status).json(responseBody);
  }

  private mapToHttpStatus(code: DomainExceptionCode): number {
    switch (code) {
      case DomainExceptionCode.BadRequest:
      case DomainExceptionCode.ValidationError:
      case DomainExceptionCode.ConfirmationCodeExpired:
      case DomainExceptionCode.EmailNotConfirmed:
      case DomainExceptionCode.PasswordRecoveryCodeExpired:
        return HttpStatus.BAD_REQUEST;
      case DomainExceptionCode.Forbidden:
        return HttpStatus.FORBIDDEN;
      case DomainExceptionCode.NotFound:
        return HttpStatus.NOT_FOUND;
      case DomainExceptionCode.Unauthorized:
        return HttpStatus.UNAUTHORIZED;
      case DomainExceptionCode.InternalServerError:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      default:
        return HttpStatus.I_AM_A_TEAPOT;
    }
  }

  private buildResponseBody(
    exception: DomainException,
    requestUrl: string,
  ): ErrorResponseBody | undefined {
    if (
      exception.code === DomainExceptionCode.ValidationError &&
      exception.extensions?.length > 0
    ) {
      return {
        errorsMessages: exception.extensions.map((ext) => ({
          message: ext.message,
          field: ext.field,
        })),
      };
    }

    if (exception.code === DomainExceptionCode.Forbidden) {
      return;
    }

    if (exception.code === DomainExceptionCode.NotFound) {
      return;
    }

    return {
      errorsMessages: [
        {
          message: exception.message,
          field: exception.extensions?.[0]?.field,
        },
      ],
    };
  }
}
