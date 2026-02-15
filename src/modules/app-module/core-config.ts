import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsEnum, IsNotEmpty, IsNumber, validateSync } from 'class-validator';
import { Enviroments } from 'src/modules/app-module/types/env-enums';

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

  constructor(private configService: ConfigService) {
    const errors = validateSync(this);
    if (errors.length > 0) {
      const sortedMessage = errors
        .map((err) => Object.values(err.constraints || {}).join(', '))
        .join('; ');
    }
  }
}
