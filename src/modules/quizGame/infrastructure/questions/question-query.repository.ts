import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { GetQuestionsQueryParams, PublishedStatus } from '../../api/query/get-questions-query.params';
import { QuestionPaginatedViewDto } from '../../api/paginated/question-paginated.view-dto';
import { QuestionViewDto } from '../../api/dto/output/question.view-dto';
import { QuestionOrmEntity } from '../../entities/question.orm-entity';

@Injectable()
export class QuestionsQueryRepository {
  constructor(
    @InjectRepository(QuestionOrmEntity)
    private readonly repo: Repository<QuestionOrmEntity>,
  ) { }

  async getAllQuestions(
    query: GetQuestionsQueryParams,
  ): Promise<QuestionPaginatedViewDto> {
    const searchTerm = query.bodySearchTerm?.trim() ?? '';
    const sortDirection = query.sortDirection.toUpperCase() as 'ASC' | 'DESC';

    const qb = this.repo
      .createQueryBuilder('q')
      .where('q.deleteAt IS NULL');

    if (searchTerm) {
      qb.andWhere('q.body ILIKE :search', { search: `%${searchTerm}%` });
    }

    if (query.publishedStatus === PublishedStatus.Published) {
      qb.andWhere('q.published = :published', { published: true });
    }

    qb.orderBy(`q.${query.sortBy}`, sortDirection)
      .skip(query.calculateSkip())
      .take(query.pageSize);

    const [items, totalCount] = await qb.getManyAndCount();

    return QuestionPaginatedViewDto.mapToView({
      items: items.map((question) => QuestionViewDto.mapToView(question)),
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
    });
  }

  async getByIdOrNotFoundFail(id: string): Promise<QuestionViewDto> {
    const question = await this.repo.findOne({
      where: { id, deleteAt: IsNull() },
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    return QuestionViewDto.mapToView(question);
  }
}
