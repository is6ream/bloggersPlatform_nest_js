import {
  BaseQueryParams,
  SortBy,
} from 'src/core/dto/base.query-params.input-dto';

/*
*Класс, который описывает, какие поля по дефолту
будут заданными при GET запросе за всеми пользователями
 */
export class GetUsersQueryParams extends BaseQueryParams {
  sortBy: SortBy.CreatedAt;
  searchLoginTerm: string | null = null;
  searchEmailTerm: string | null = null;
}
