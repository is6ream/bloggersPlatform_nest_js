import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContextDto } from '../../dto/user-context.input.dto';
import { Request } from 'express';

export const ExtractUserFromRequest = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserContextDto => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: UserContextDto }>();

    const user = {
      id: request.user.id,
    };

    console.log(user, 'user check in decorator');
    if (!user) {
      throw new Error('there is no user in the request object!');
    }

    return user;
  },
);
