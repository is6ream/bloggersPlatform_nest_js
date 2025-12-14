import { Module } from '@nestjs/common';
import { TestingController } from './testing-contorller';

@Module({
  imports: [],
  controllers: [TestingController],
})
export class TestingModule {}
