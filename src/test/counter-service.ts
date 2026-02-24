import { Injectable, Scope } from '@nestjs/common';
import { CounterRepository } from './counter-repository';

@Injectable({ scope: Scope.DEFAULT }) 
export class CounterService {
  constructor(private readonly repo: CounterRepository) {
    console.log("service created")
  }

  increment() {
    return this.repo.increment();
  }

  get() {
    return this.repo.get();
  }
}