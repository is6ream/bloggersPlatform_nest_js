import { Controller, Get } from '@nestjs/common';
import { AppService } from './appService';
@Controller('app')
export class AppController {
  constructor(private readonly appService: AppService) {
    console.log('AppController created');
  }
  // ?page=2
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
