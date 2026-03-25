import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { Enviroments } from 'src/modules/app-module/types/env-enums';
import { configValidationUtility } from 'src/core/config/config-validation.utility';
import { PoolConfig } from 'pg';

@Injectable()
export class CoreConfig {
  
  constructor(private configService: ConfigService) {
    configValidationUtility.validateConfig(this);
  }
  
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

  @IsString()
  pgHost: string = this.configService.get<string>('PGHOST')?.trim() || 'localhost';

  @IsNumber({}, { message: 'Set env variable PGPORT' })
  pgPort: number = Number(this.configService.get<string>('PGPORT') || '5432');

  @IsString()
  pgDatabase: string =
    this.configService.get<string>('PGDATABASE')?.trim() || 'blogger_platform';

  @IsString()
  pgUser: string = this.configService.get<string>('PGUSER')?.trim() || 'nestjs';

  @IsNotEmpty({ message: 'Set env variable PGPASSWORD' })
  pgPassword: string =
    this.configService.get<string>('PGPASSWORD')?.trim() || 'nestjs';

  @IsEnum(Enviroments)
  env: string = this.configService.getOrThrow('NODE_ENV');

  @IsBoolean({
    message:
      'Set Enviroments environment variable IS_SWAGGER_ENABLED to enable/disable Swagger, example: true',
  })
  isSwaggerEnabled: boolean | null = configValidationUtility.convertToBoolean(
    this.configService.getOrThrow('IS_SWAGGER_ENABLED'),
  );

  get deviceSessionsPostgresConfig(): PoolConfig {
    return {
      host: this.pgHost,
      port: this.pgPort,
      database: this.pgDatabase,
      user: this.pgUser,
      password: this.pgPassword,
    };
  }

}
