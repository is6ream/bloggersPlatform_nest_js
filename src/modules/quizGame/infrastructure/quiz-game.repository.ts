import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionOrmEntity } from '../entities/question.orm-entity';

@Injectable()
export class QuizGameRepository {
  constructor(
    @InjectRepository(QuestionOrmEntity)
    private readonly repo: Repository<QuestionOrmEntity>,
  ) {}

  async save(question: QuestionOrmEntity): Promise<void> {
    await this.repo.save(question);
  }
}
