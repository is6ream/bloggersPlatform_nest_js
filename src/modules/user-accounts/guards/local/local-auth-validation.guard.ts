import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BadRequestException } from '@nestjs/common';
import { LoginInputDto } from '../../api/dto/input/login-input.dto';

@Injectable()
export class LocalAuthValidationGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const dto = plainToInstance(LoginInputDto, request.body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      throw new BadRequestException({
        errorsMessages: errors.map((err) => ({
          message: Object.values(err.constraints || {})[0],
          field: err.property,
        })),
      });
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
