import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    if (status === 400) {
      const errorResponse: any = {
        errorMessages: [],
      };
      const responseBody: any = exception.getResponse();

      //@ts-ignore
      responseBody.message.forEach((m) => {
        errorResponse.errorMessages.push(m);
      });

      response.status(status).json(errorResponse);
    } else {
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}
