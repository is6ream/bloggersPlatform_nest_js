import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserIdOptional = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();

    console.log('=== UserIdOptional DEBUG ===');
    console.log('Request.user:', request.user);
    console.log('Request.user?.userId:', request.user?.userId); // ← проверь это!
    console.log('Request.user?.id:', request.user?.id);
    console.log('Request.userId:', request.userId); // может быть напрямую в request
    console.log('=== END DEBUG ===');

    // Ищи в правильном месте:
    return request.user?.userId || request.userId || request.user?.id;
  },
);
