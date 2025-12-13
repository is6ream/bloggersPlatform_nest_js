import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { BlogViewDto } from '../../dto/output/blogViewDto';

export class BlogPaginatedViewDto extends PaginatedViewDto<BlogViewDto> {
  items: BlogViewDto[];
}
