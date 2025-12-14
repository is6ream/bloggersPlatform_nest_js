import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { PostViewDto } from '../../dto/postViewDto';

export class PostPaginatedViewDto extends PaginatedViewDto<PostViewDto> {
  items: PostViewDto[];
}
