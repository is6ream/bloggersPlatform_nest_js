import {
  BaseQueryParams,
  SortBy,
} from 'src/core/dto/base.query-params.input-dto';

export class getBlogsQueryParams extends BaseQueryParams {
  sortBy: SortBy = SortBy.CreatedAt;
  searchNameTerm: string | null = null;
  pageNumber: number;
  pageSize: number;
}
