import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserIdOptional = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id; // ← может вернуть undefined
  },
);
