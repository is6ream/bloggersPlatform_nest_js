import { PostViewDto } from './../../dto/output/postViewDto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';

export class PostPaginatedViewDto extends PaginatedViewDto<PostViewDto> {
  items: PostViewDto[];
}
