import {
  HttpException,
  Catch,
  ExceptionFilter,
  ArgumentsHost,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const responseBody = exception.getResponse();

    // console.log(status, 'status check');

    // console.log(responseBody, 'responseBody check');
    if (status === 400) {
      response.status(status).json(responseBody);
    } else {
      // Для других ошибок - стандартный формат
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: ctx.getRequest<Request>().url,
      });
    }
  }
}
