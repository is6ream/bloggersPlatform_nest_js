import { Module } from '@nestjs/common';
import { TestingController } from './testing-contoroller';

@Module({
  imports: [],
  controllers: [TestingController],
})
export class TestingModule {}
