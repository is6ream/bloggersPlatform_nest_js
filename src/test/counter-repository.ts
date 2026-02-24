import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.DEFAULT }) // меняй тут
export class CounterRepository {
  constructor(){
    console.log("Repo created")
  }
  private counter = 0;

  increment() {
    this.counter++;
    return this.counter;
  }

  get() {
    return this.counter;
  }
}