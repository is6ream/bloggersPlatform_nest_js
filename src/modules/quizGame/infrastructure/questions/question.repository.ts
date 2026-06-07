import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { QuestionOrmEntity } from '../../entities/question.orm-entity';

@Injectable()
export class QuizGameRepository {
  constructor(
    @InjectRepository(QuestionOrmEntity)
    private readonly repo: Repository<QuestionOrmEntity>,
  ) { }

  async findById(id: string): Promise<QuestionOrmEntity | null> {
    return this.repo.findOne({ where: { id, deleteAt: IsNull() } });
  }


  async findOrNotFoundFail(id: string): Promise<QuestionOrmEntity> {
    const question = await this.findById(id);
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    return question;
  }

  async save(question: QuestionOrmEntity): Promise<void> {
    await this.repo.save(question);
  }
}
