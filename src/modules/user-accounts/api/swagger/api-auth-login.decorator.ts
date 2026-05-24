import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginInputDto } from '../dto/input/login-input.dto';
import { AccessTokenResponse } from '../dto/output/access-token-response.dto';

export function ApiAuthLoginDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Login user',
      description: 'Login user in system',
    }),
    ApiBody({
      type: LoginInputDto,
      description: 'Login user in system',
    }),
    ApiOkResponse({
      description: 'Successfully logged in',
      type: AccessTokenResponse,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
  );
}
