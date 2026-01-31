import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserExtractorInterceptor implements NestInterceptor {
  constructor(private jwtService: JwtService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      const payload = this.jwtService.decode(token);

      console.log(payload.id, 'user id check in payload');

      if (payload && typeof payload === 'object') {
        request.user = {
          userId: payload.sub || payload.id,
        };
      }
    }

    return next.handle();
  }
}
