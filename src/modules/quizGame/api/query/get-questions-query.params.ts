import { BaseQueryParams } from 'src/core/dto/base.query-params.input-dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum PublishedStatus {
  All = 'All',
  Published = 'Published',
}

export enum QuestionsSortBy {
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  Body = 'body',
  Published = 'published',
}

export class GetQuestionsQueryParams extends BaseQueryParams {
  @IsOptional()
  @IsString()
  bodySearchTerm?: string;

  @IsEnum(PublishedStatus)
  publishedStatus: PublishedStatus = PublishedStatus.All;

  @IsEnum(QuestionsSortBy)
  sortBy: QuestionsSortBy = QuestionsSortBy.CreatedAt;
}
