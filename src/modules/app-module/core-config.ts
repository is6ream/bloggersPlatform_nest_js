import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty, IsNumber, IsString, validateSync } from 'class-validator';

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

  constructor(private configService: ConfigService) {
    const errors = validateSync(this);
    if (errors.length > 0) {
      const sortedMessage = errors
        .map((err) => Object.values(err.constraints || {}).join(', '))
        .join('; ');
    }
  }
}
