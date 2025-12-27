import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express'; // ← Импортируем тип Express
import { UserContextDto } from 'src/modules/user-accounts/guards/dto/user-context.dto';
// 1. Расширяем интерфейс Request из Express
declare global {
  namespace Express {
    interface Request {
      user?: UserContextDto; // ← Говорим TypeScript, что у Request может быть user
    }
  }
}

export const ExtractUserFromRequest = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserContextDto => {
    const request = context.switchToHttp().getRequest<Request>();

    const user = request.user;

    if (!user) {
      throw new Error('there is no user in the request object!');
    }

    return user;
  },
);
