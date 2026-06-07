import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { QuestionOrmEntity } from '../../entities/question.orm-entity';
import { GAME_QUESTIONS_COUNT } from '../../constants/game-questions-count';

@Injectable()
export class QuestionRepository {
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

  async findRandomPublishedQuestions(
    limit: number = GAME_QUESTIONS_COUNT,
  ): Promise<QuestionOrmEntity[]> {
    return this.repo
      .createQueryBuilder('q')
      .where('q.published = :published', { published: true })
      .andWhere('q.deleteAt IS NULL')
      .orderBy('RANDOM()')
      .take(limit)
      .getMany();
  }
}
