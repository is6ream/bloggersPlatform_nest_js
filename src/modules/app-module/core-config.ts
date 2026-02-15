import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  validateSync,
} from 'class-validator';
import { Enviroments } from 'src/modules/app-module/types/env-enums';
import { configValidationUtility } from 'src/core/config/config-validation.utility';

@Injectable()
export class CoreConfig {
  @IsNumber(
    {},
    {
      message: 'Set env variable PORT',
    },
  )
  port: number = Number(this.configService.getOrThrow('PORT'));

  @IsNotEmpty({
    message: 'Set Env variable MONGO_URI',
  })
  mongoURI: string = this.configService.getOrThrow('MONGODB_URI');

  @IsEnum(Enviroments)
  env: string = this.configService.getOrThrow('NODE_ENV');

  @IsBoolean({
    message:
      'Set Enviroments environment variable IS_SWAGGER_ENABLED to enable/disable Swagger, example: true',
  })
  isSwaggerEnabled: boolean | null = configValidationUtility.convertToBoolean(
    this.configService.getOrThrow('IS_SWAGGER_ENABLED'),
  );

  constructor(private configService: ConfigService) {
    configValidationUtility.validateConfig(this);
  }
}
