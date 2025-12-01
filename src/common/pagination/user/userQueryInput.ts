import { UserSortField } from './userSortField';
import { PaginationAndSorting } from '../paginationAndSortingType';
export type UserQueryInput = PaginationAndSorting<UserSortField> &
  Partial<{
    searchLoginTerm: string;
    searchEmailTerm: string;
  }>;
