import { BaseQueryParams } from 'src/core/dto/base.query-params.input-dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum PublishedStatus {
  All = 'All',
  Published = 'Published',
}

export class GetQuestionsQueryParams extends BaseQueryParams {
  @IsOptional()
  @IsString()
  bodySearchTerm?: string;

  @IsEnum(PublishedStatus)
  publishedStatus: PublishedStatus = PublishedStatus.All;
}
