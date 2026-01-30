export interface PostQueryDto {
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  searchPostNameTerm?: string;
}
