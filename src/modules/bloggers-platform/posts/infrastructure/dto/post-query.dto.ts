export class PostQueryDto {
  pageNumber: number = 1;
  pageSize: number = 10;
  sortBy: string = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';
}
