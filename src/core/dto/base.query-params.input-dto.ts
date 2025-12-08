import { Type } from 'class-transformer';

//Класс, который задает базовые параметры для пагинации Pres. layer
export class BaseQueryParams {
  @Type(() => Number)
  pageNumber: number = 1;
  @Type(() => Number)
  pageSize: number = 10;
  sortDirection: SortDirection = SortDirection.Desc;

  calculateSkip() {
    return (this.pageNumber - 1) * this.pageSize;
  }
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export enum SortBy {
  CreatedAt = 'createdAt',
  Login = 'login',
  Email = 'email',
}
