import {
  BaseQueryParams,
  SortBy,
} from 'src/core/dto/base.query-params.input-dto';

export class GetPostsQueryParams extends BaseQueryParams {
  sortBy: SortBy = SortBy.CreatedAt;
}
