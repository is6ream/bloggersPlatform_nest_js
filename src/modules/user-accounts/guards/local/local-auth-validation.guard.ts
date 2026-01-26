import { Injectable, ExecutionContext, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginInputDto } from '../../api/dto/input/login-input.dto';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';

@Injectable()
export class LocalAuthValidationGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const dto = plainToInstance(LoginInputDto, request.body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      //если ошибок валидации больше одной, выбрасываем 400 ошибку
      throw new DomainException({
        code: DomainExceptionCode.ValidationError,
        message: 'Validation failed',
        extensions: errors.map((err) => ({
          message: Object.values(err.constraints || {})[0],
          field: err.property,
        })),
      });
    }
    try {
      return (await super.canActivate(context)) as boolean; //если ошибок валидации нет, передаем запрос в контроллер
    } catch (error) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized, // противном случае выбрасываем 401
        message: 'Invalid credentials',
      });
    }
  }
}
