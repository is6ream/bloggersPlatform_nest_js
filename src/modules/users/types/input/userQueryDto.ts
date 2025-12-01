export class PaginationQueryDto {
  pageNumber?: string = '1';

  pageSize?: string = '10';

  sortBy?: string = 'createdAt';

  sortDirection?: 'asc' | 'desc' = 'desc';
}

export class UserQueryDto extends PaginationQueryDto {
  searchLoginTerm?: string;
  searchEmailTerm?: string;
}
