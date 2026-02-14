import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfig {
  constructor(private configService: ConfigService) {}
  port: number = this.configService.getOrThrow('PORT');
  mongoURI: string = this.configService.getOrThrow('MONGO_URI');
}
