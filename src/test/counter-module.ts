import { Module } from '@nestjs/common';
import { CounterController } from './counter-controller';
import { CounterService } from './counter-service';
import { CounterRepository } from './counter-repository';
//todo поработать со scope
@Module({
    controllers: [CounterController],
    providers: [CounterService, CounterRepository],
})
export class CounterModule { }