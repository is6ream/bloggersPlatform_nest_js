import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CoreConfig {
  constructor(private configService: ConfigService) {}
  port: number = this.configService.getOrThrow('PORT');
  mongoURI: string = this.configService.getOrThrow('MONGODB_URI');
}
