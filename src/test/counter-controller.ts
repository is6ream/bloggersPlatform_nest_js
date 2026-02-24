import { Controller, Get } from '@nestjs/common';
import { CounterService } from './counter-service';

@Controller('counter')
export class CounterController {
  constructor(private readonly counterService: CounterService) {
    console.log("Controller created")
  }

  @Get()
  increase() {
    return {
      value: this.counterService.increment(),
    };
  }
}