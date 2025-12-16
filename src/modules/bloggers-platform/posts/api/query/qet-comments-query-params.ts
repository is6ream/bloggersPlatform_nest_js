import {
  SortBy,
  BaseQueryParams,
} from 'src/core/dto/base.query-params.input-dto';

export class GetCommentsQueryParams extends BaseQueryParams {
  sortBy: SortBy = SortBy.CreatedAt;
}
